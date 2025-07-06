import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .or(z.literal(''));

export const dateSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  });

export const phoneSchema = z
  .string()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format. Please use international format (e.g., +1234567890)'
  );

export function validateForm<T>(schema: z.ZodType<T>, data: any): { success: boolean; errors?: { [key: string]: string } } {
  try {
    schema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {} as { [key: string]: string });
      
      return { success: false, errors };
    }
    throw error;
  }
}

// Example usage:
// const signupSchema = z.object({
//   name: nameSchema,
//   email: emailSchema,
//   password: passwordSchema,
//   username: usernameSchema,
//   website: urlSchema.optional(),
//   phone: phoneSchema.optional()
// });
//
// const { success, errors } = validateForm(signupSchema, formData);
