import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { DatabaseError } from '../utils/db';
import { ApiResponse } from '../types/api';

interface ExtendedApiResponse<T = any> extends ApiResponse<T> {
  details?: any;
}

export function withErrorHandler(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse<ExtendedApiResponse<any>>) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: error.errors[0].message,
          details: error.errors
        });
      }

      if (error instanceof DatabaseError) {
        return res.status(500).json({
          success: false,
          error: 'Database operation failed',
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred'
      });
    }
  };
}

export function withMethods(methods: string[], handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse<ExtendedApiResponse<any>>) => {
    if (!methods.includes(req.method || '')) {
      res.setHeader('Allow', methods);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`
      });
    }

    return handler(req, res);
  };
}

export function withValidation(schema: any, handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse<ExtendedApiResponse<any>>) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      return handler(req, res);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: error.errors[0].message,
          details: error.errors
        });
      }
      throw error;
    }
  };
}
