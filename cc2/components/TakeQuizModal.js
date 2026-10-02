import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function TakeQuizModal({ isOpen, onClose, quiz: initialQuiz, onSubmit }) {
  const [quiz, setQuiz] = useState(initialQuiz);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [retry, setRetry] = useState(0);
  const attempt = useRef(null);
  const answersRef = useRef([]);
  const saveQueue = useRef(Promise.resolve());
  const pendingAnswers = useRef(null);
  const saveTimer = useRef(null);
  const submitting = useRef(false);
  const autoSubmitted = useRef(false);
  const submitRef = useRef(null);
  const clockOffset = useRef(0);

  useEffect(() => {
    if (!isOpen || !initialQuiz?._id) return;
    let cancelled = false;
    setReady(false);
    setLoadError("");
    autoSubmitted.current = false;
    fetch("/api/quiz/attempt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quizId: initialQuiz._id }) })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to resume quiz");
        if (cancelled) return;
        attempt.current = data;
        clockOffset.current = new Date(data.serverNow).getTime() - Date.now();
        setTimeRemaining(Math.max(0, Math.ceil((new Date(data.deadline) - new Date(data.serverNow)) / 1000)));
        setQuiz({ ...initialQuiz, ...data.quiz });
        answersRef.current = data.answers;
        setAnswers(data.answers);
        setCurrentQuestion(0);
        setSaveStatus(data.savedAt ? "Saved answers restored" : "Answers save automatically");
        setReady(true);
      }).catch(error => { if (!cancelled) setLoadError(error.message); });
    return () => { cancelled = true; };
  }, [isOpen, initialQuiz, retry]);

  useEffect(() => {
    if (!ready || !isOpen) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(attempt.current.deadline).getTime() - Date.now() - clockOffset.current) / 1000));
      setTimeRemaining(remaining);
      if (!remaining && !autoSubmitted.current) {
        autoSubmitted.current = true;
        submitRef.current(true);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [ready, isOpen]);

  const persistDraft = () => {
    clearTimeout(saveTimer.current);
    saveQueue.current = saveQueue.current.then(async () => {
      const next = pendingAnswers.current;
      if (!next) return;
      pendingAnswers.current = null;
      const response = await fetch("/api/quiz/attempt", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quizId: quiz._id, attemptId: attempt.current.attemptId, version: attempt.current.version, answers: next }), keepalive: true });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save answers");
      attempt.current.version = data.version;
      setSaveStatus(pendingAnswers.current ? "Saving..." : "All changes saved");
    }).catch(error => { setSaveStatus(error.message + " Your latest changes may not be saved."); });
    return saveQueue.current;
  };
  const flushRef = useRef(null);
  flushRef.current = persistDraft;
  useEffect(() => {
    const flush = () => { if (pendingAnswers.current) flushRef.current(); };
    const onHidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => { clearTimeout(saveTimer.current); window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", onHidden); };
  }, []);
  const handleAnswerChange = (index, answer) => {
    if (submitting.current || timeRemaining <= 0) return;
    const next = [...answersRef.current];
    next[index] = answer;
    answersRef.current = next;
    pendingAnswers.current = next;
    setAnswers(next);
    setSaveStatus("Saving...");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flushRef.current(), 350);
  };
  const handleSubmit = async (automatic = false) => {
    if (!ready || submitting.current) return;
    const unanswered = quiz.questions.length - answersRef.current.filter(answer => String(answer).trim() !== "").length;
    if (!automatic && unanswered && !confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) return;
    submitting.current = true;
    setIsLoading(true);
    try {
      await persistDraft();
      await onSubmit({ quizId: quiz._id, attemptId: attempt.current.attemptId, version: attempt.current.version, answers: answersRef.current });
      onClose();
    } catch (error) {
      toast.error(error.message || "Submission failed. Please retry; saved answers are kept.");
    } finally { submitting.current = false; setIsLoading(false); }
  };
  submitRef.current = handleSubmit;
  const handleClose = async () => {
    if (ready && !confirm("Your saved answers will be kept, but the timer continues. Leave this quiz?")) return;
    await persistDraft();
    onClose();
  };

  if (!isOpen) return null;
  const question = quiz?.questions?.[currentQuestion];
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="quiz-title" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <header className="flex items-center justify-between gap-4 border-b dark:border-gray-700 pb-4 mb-5">
          <h2 id="quiz-title" className="text-2xl font-bold">{quiz?.quizName || "Quiz"}</h2>
          <button onClick={handleClose} disabled={isLoading} aria-label="Close quiz" className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Close</button>
        </header>
        {!ready ? (
          <div role="status"><p>{loadError || "Restoring your quiz..."}</p>{loadError && <button className="mt-4 underline" onClick={() => setRetry(value => value + 1)}>Retry</button>}</div>
        ) : question ? (
          <>
            <div className="flex justify-between gap-4 mb-2 text-sm">
              <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
              <span className={timeRemaining < 60 ? "text-red-600 font-bold" : "font-semibold"} aria-label="Time remaining">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}</span>
            </div>
            <p role="status" className="text-sm text-gray-500 dark:text-gray-400 mb-5">{saveStatus}</p>
            {timeRemaining === 0 && <p className="mb-4 text-amber-700">Time is up. Only answers saved before the deadline will be graded.</p>}
            <fieldset disabled={isLoading || timeRemaining <= 0}>
              <legend className="font-semibold text-lg mb-5">{question.question}</legend>
              {question.options?.length ? question.options.map((option, index) => (
                <label key={index} className="flex gap-3 items-start border dark:border-gray-600 rounded-lg p-4 mb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input type="radio" name={`question-${currentQuestion}`} checked={answers[currentQuestion] === option} onChange={() => handleAnswerChange(currentQuestion, option)} className="mt-1" />
                  <span>{option}</span>
                </label>
              )) : question.type === "true-false" ? ["true", "false"].map(option => (
                <label key={option} className="flex gap-3 p-3"><input type="radio" name={`question-${currentQuestion}`} checked={answers[currentQuestion] === option} onChange={() => handleAnswerChange(currentQuestion, option)} />{option}</label>
              )) : <textarea aria-label="Your answer" value={answers[currentQuestion] ?? ""} maxLength={5000} onChange={event => handleAnswerChange(currentQuestion, event.target.value)} className="w-full border rounded-lg p-4 bg-transparent" rows={4} />}
            </fieldset>
            <nav aria-label="Quiz questions" className="flex flex-wrap gap-2 my-6">
              {quiz.questions.map((_, index) => <button key={index} aria-current={index === currentQuestion ? "step" : undefined} onClick={() => setCurrentQuestion(index)} className={`w-9 h-9 rounded border ${index === currentQuestion ? "bg-indigo-600 text-white" : String(answers[index] ?? "").trim() ? "bg-green-100 text-green-900" : ""}`}>{index + 1}</button>)}
            </nav>
            <footer className="flex flex-wrap justify-between gap-3 border-t dark:border-gray-700 pt-5">
              <button disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(value => value - 1)} className="px-4 py-2 border rounded disabled:opacity-40">Previous</button>
              {currentQuestion < quiz.questions.length - 1 && <button onClick={() => setCurrentQuestion(value => value + 1)} className="px-4 py-2 border rounded">Next</button>}
              <button disabled={isLoading} onClick={() => handleSubmit(false)} className="px-5 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">{isLoading ? "Submitting..." : "Submit quiz"}</button>
            </footer>
            <p className="mt-4 text-xs text-gray-500">Rejoin with the same quiz code to resume. The timer continues while you are away.</p>
          </>
        ) : <p>No questions available.</p>}
      </section>
    </div>
  );
}
