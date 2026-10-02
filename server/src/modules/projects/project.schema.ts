import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be at most 100 characters'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),

  status: z
    .enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
    .default('PLANNING'),

  startDate: z.coerce.date().optional(),

  dueDate: z.coerce.date().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field is required',
  );

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;