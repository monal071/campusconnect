import { createHash } from "crypto";

// The same deterministic order is used for display and server-side grading.
export function quizQuestions(quiz, userId) {
  let seed = createHash("sha256").update(`${quiz._id}:${userId}`).digest().readUInt32BE(0);
  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  let questions = quiz.questions.map((q, index) => ({ ...q, id: q.id ?? String(q._id ?? index), originalIndex: index }));
  if (quiz.settings?.randomizeQuestions) questions = shuffle(questions);
  return questions.map(q => {
    if (!quiz.settings?.randomizeOptions || !Array.isArray(q.options)) return q;
    return { ...q, correctAnswer: typeof q.correctAnswer === "number" ? q.options[q.correctAnswer] : q.correctAnswer, options: shuffle(q.options) };
  });
}

export function studentQuestions(quiz, userId) {
  return quizQuestions(quiz, userId).map(({ correctAnswer, explanation, originalIndex, ...question }) => question);
}
