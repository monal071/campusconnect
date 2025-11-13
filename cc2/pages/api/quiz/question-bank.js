import { getSession } from 'next-auth/react';
import clientPromise from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await clientPromise;
  const db = client.db();
  const questionBank = db.collection('questionBank');

  if (req.method === 'GET') {
    try {
      const { category, difficulty, tags, search } = req.query;
      const userId = session.user.id;

      let query = { userId: new ObjectId(userId) };

      // Apply filters
      if (category && category !== 'all') {
        query.category = category;
      }

      if (difficulty && difficulty !== 'all') {
        query.difficulty = difficulty;
      }

      if (tags) {
        const tagArray = tags.split(',');
        query.tags = { $in: tagArray };
      }

      if (search) {
        query.$or = [
          { question: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ];
      }

      const questions = await questionBank
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      // Get statistics
      const stats = {
        total: await questionBank.countDocuments({ userId: new ObjectId(userId) }),
        byCategory: {},
        byDifficulty: {
          easy: await questionBank.countDocuments({ userId: new ObjectId(userId), difficulty: 'easy' }),
          medium: await questionBank.countDocuments({ userId: new ObjectId(userId), difficulty: 'medium' }),
          hard: await questionBank.countDocuments({ userId: new ObjectId(userId), difficulty: 'hard' }),
        },
      };

      res.status(200).json({
        questions,
        stats,
        total: questions.length,
      });
    } catch (error) {
      console.error('Error fetching question bank:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  } else if (req.method === 'POST') {
    try {
      const { question, options, correctAnswer, category, difficulty, points, tags, explanation } = req.body;

      if (!question || !options || correctAnswer === undefined || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newQuestion = {
        userId: new ObjectId(session.user.id),
        question,
        options,
        correctAnswer,
        category,
        difficulty: difficulty || 'medium',
        points: points || 1,
        tags: tags || [],
        explanation: explanation || '',
        usageCount: 0,
        successRate: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await questionBank.insertOne(newQuestion);

      res.status(201).json({
        message: 'Question added to bank',
        questionId: result.insertedId,
      });
    } catch (error) {
      console.error('Error adding question to bank:', error);
      res.status(500).json({ error: 'Failed to add question' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { questionId, ...updates } = req.body;

      if (!questionId) {
        return res.status(400).json({ error: 'Question ID required' });
      }

      const result = await questionBank.updateOne(
        { 
          _id: new ObjectId(questionId),
          userId: new ObjectId(session.user.id)
        },
        { 
          $set: {
            ...updates,
            updatedAt: new Date(),
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.status(200).json({ message: 'Question updated' });
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({ error: 'Failed to update question' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { questionId } = req.query;

      if (!questionId) {
        return res.status(400).json({ error: 'Question ID required' });
      }

      const result = await questionBank.deleteOne({
        _id: new ObjectId(questionId),
        userId: new ObjectId(session.user.id)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.status(200).json({ message: 'Question deleted from bank' });
    } catch (error) {
      console.error('Error deleting question:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
