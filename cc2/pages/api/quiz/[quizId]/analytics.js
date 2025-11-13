import { getSession } from "next-auth/react";
import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { quizId } = req.query;
  const { range = "all" } = req.query;

  if (req.method === "GET") {
    try {
      const client = await clientPromise;
      const db = client.db();

      // Get quiz
      const quiz = await db.collection("quizzes").findOne({
        _id: new ObjectId(quizId),
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Check if user has permission (creator or admin)
      if (
        quiz.userId.toString() !== session.user.id &&
        session.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to view analytics" });
      }

      // Get all submissions for this quiz
      const submissions = await db
        .collection("quizSubmissions")
        .find({ quizId: new ObjectId(quizId) })
        .sort({ submittedAt: -1 })
        .toArray();

      // Filter by time range
      let filteredSubmissions = submissions;
      if (range !== "all") {
        const now = new Date();
        const rangeDate = new Date();

        if (range === "week") {
          rangeDate.setDate(now.getDate() - 7);
        } else if (range === "month") {
          rangeDate.setMonth(now.getMonth() - 1);
        }

        filteredSubmissions = submissions.filter(
          (s) => new Date(s.submittedAt) >= rangeDate
        );
      }

      // Calculate analytics
      const totalAttempts = filteredSubmissions.length;

      // Average score
      const averageScore =
        totalAttempts > 0
          ? Math.round(
              filteredSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) /
                totalAttempts
            )
          : 0;

      // Pass rate (assuming 60% is passing)
      const passThreshold = 60;
      const passedCount = filteredSubmissions.filter(
        (s) => (s.score || 0) >= passThreshold
      ).length;
      const passRate =
        totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

      // Average time (in minutes)
      const averageTime =
        totalAttempts > 0
          ? filteredSubmissions.reduce((sum, s) => {
              if (s.timeSpent) return sum + s.timeSpent;
              if (s.submittedAt && s.startedAt) {
                return (
                  sum +
                  Math.floor(
                    (new Date(s.submittedAt) - new Date(s.startedAt)) /
                      1000 /
                      60
                  )
                );
              }
              return sum;
            }, 0) / totalAttempts
          : 0;

      // Score distribution
      const scoreDistribution = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
      filteredSubmissions.forEach((s) => {
        const score = s.score || 0;
        const bucket = Math.min(Math.floor(score / 20), 4);
        scoreDistribution[bucket]++;
      });

      // Performance trend (last 10 submissions or less)
      const trendSubmissions = filteredSubmissions.slice(0, 10).reverse();
      const trendDates = trendSubmissions.map((s) =>
        new Date(s.submittedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      );
      const trendScores = trendSubmissions.map((s) => s.score || 0);

      // Question analysis
      const questionStats = quiz.questions.map((question, index) => {
        const questionResponses = filteredSubmissions
          .map((s) => s.answers?.[index])
          .filter((a) => a !== undefined);

        const correctResponses = questionResponses.filter(
          (a) => a === question.correctAnswer
        ).length;

        const successRate =
          questionResponses.length > 0
            ? Math.round((correctResponses / questionResponses.length) * 100)
            : 0;

        const totalTime = filteredSubmissions.reduce((sum, s) => {
          return sum + (s.questionTimes?.[index] || 0);
        }, 0);

        const avgTime =
          questionResponses.length > 0
            ? Math.round(totalTime / questionResponses.length)
            : 0;

        const skipped = filteredSubmissions.filter(
          (s) => s.answers?.[index] === undefined || s.answers?.[index] === null
        ).length;

        return {
          text: question.question,
          successRate,
          attempts: questionResponses.length,
          avgTime,
          skipped,
        };
      });

      // Top performers
      const topPerformers = filteredSubmissions
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5)
        .map((s) => ({
          name: s.userName || "Anonymous",
          score: s.score || 0,
          time:
            s.timeSpent ||
            Math.floor(
              (new Date(s.submittedAt) - new Date(s.startedAt)) / 1000 / 60
            ),
        }));

      // Calculate changes (compare with previous period)
      let attemptsChange = 0;
      let scoreChange = 0;
      let passRateChange = 0;
      let timeChange = 0;

      if (range !== "all") {
        const now = new Date();
        const currentPeriodStart = new Date();
        const previousPeriodStart = new Date();

        if (range === "week") {
          currentPeriodStart.setDate(now.getDate() - 7);
          previousPeriodStart.setDate(now.getDate() - 14);
        } else if (range === "month") {
          currentPeriodStart.setMonth(now.getMonth() - 1);
          previousPeriodStart.setMonth(now.getMonth() - 2);
        }

        const previousSubmissions = submissions.filter((s) => {
          const date = new Date(s.submittedAt);
          return date >= previousPeriodStart && date < currentPeriodStart;
        });

        if (previousSubmissions.length > 0) {
          const prevAvgScore = Math.round(
            previousSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) /
              previousSubmissions.length
          );
          const prevPassRate = Math.round(
            (previousSubmissions.filter((s) => (s.score || 0) >= passThreshold)
              .length /
              previousSubmissions.length) *
              100
          );

          attemptsChange = totalAttempts - previousSubmissions.length;
          scoreChange = averageScore - prevAvgScore;
          passRateChange = passRate - prevPassRate;
        }
      }

      res.status(200).json({
        totalAttempts,
        averageScore,
        passRate,
        averageTime,
        scoreDistribution,
        trendDates,
        trendScores,
        questions: questionStats,
        topPerformers,
        attemptsChange,
        scoreChange,
        passRateChange,
        timeChange,
      });
    } catch (error) {
      console.error("Error fetching quiz analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
