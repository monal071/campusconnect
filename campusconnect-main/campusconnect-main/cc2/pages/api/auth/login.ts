import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getUserByEmail, validatePassword } from '../../../utils/user-model';
import { sign } from 'jsonwebtoken';
import type { ApiResponse, User } from '../../../types/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ token: string; user: User }>>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: parse.error.errors[0].message
      });
    }

    const { email, password } = parse.data;
    const user = await getUserByEmail(email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    const isValid = await validatePassword(user, password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Don't include sensitive data in the token
    const tokenData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = sign(
      tokenData,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Don't send password back to client
    const { password: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: safeUser as User
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.message && error.message.includes('Failed to connect to MongoDB')) {
      return res.status(503).json({
        success: false,
        error: 'Database unavailable',
        message: 'Cannot connect to database. Please try again later.'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
