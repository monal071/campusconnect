import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { connectToDatabase } from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";

/**
 * API Route: /api/quiz/[quizId]/randomize
 *
 * POST - Get randomized version of quiz for current student
 */
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { quizId } = req.query;
  const userId = session.user.id;

  if (!ObjectId.isValid(quizId)) {
    return res.status(400).json({ error: "Invalid quiz ID" });
  }

  const { db } = await connectToDatabase();

  if (req.method === "POST") {
    try {
      // Get quiz
      const quiz = await db.collection("quizzes").findOne({
        _id: new ObjectId(quizId),
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Check if randomization is enabled
      if (
        !quiz.settings?.randomizeQuestions &&
        !quiz.settings?.randomizeOptions
      ) {
        // Return original quiz if randomization disabled
        return res.json(quiz);
      }

      // Generate seed from userId and quizId for consistent randomization
      const seed = generateSeed(userId, quizId);

      // Randomize questions
      let questions = [...quiz.questions];
      if (quiz.settings?.randomizeQuestions) {
        questions = shuffleArray(questions, seed);
      }

      // Randomize options for each question
      if (quiz.settings?.randomizeOptions) {
        questions = questions.map((question, index) => {
          if (!question.options || question.type === "essay") {
            return question;
          }

          const questionSeed = seed + index;
          const shuffledOptions = shuffleArray(question.options, questionSeed);

          return {
            ...question,
            options: shuffledOptions,
            // Store mapping for grading (server-side only)
            _optionMapping: question.options.map((opt) =>
              shuffledOptions.indexOf(opt)
            ),
          };
        });
      }

      // Store randomization mapping for this student (for consistent grading)
      await db.collection("quizRandomizations").updateOne(
        {
          quizId: new ObjectId(quizId),
          userId: userId,
        },
        {
          $set: {
            quizId: new ObjectId(quizId),
            userId: userId,
            seed: seed,
            questionOrder: questions.map((q) => q._id || q.question),
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      // Return randomized quiz (without sensitive data)
      const randomizedQuiz = {
        ...quiz,
        questions: questions.map(({ _optionMapping, ...question }) => question),
        isRandomized: true,
      };

      res.json(randomizedQuiz);
    } catch (error) {
      console.error("Error randomizing quiz:", error);
      res.status(500).json({ error: "Failed to randomize quiz" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

/**
 * Generate consistent seed from userId and quizId
 */
function generateSeed(userId, quizId) {
  const userNum = parseInt(userId.replace(/\D/g, "").slice(0, 8)) || 0;
  const quizNum = parseInt(quizId.replace(/\D/g, "").slice(0, 8)) || 0;
  return userNum + quizNum;
}

/**
 * Seeded shuffle algorithm (Fisher-Yates)
 */
function shuffleArray(array, seed) {
  const arr = [...array];
  let currentSeed = seed;

  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}
