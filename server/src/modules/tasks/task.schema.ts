import { z } from 'zod';

export const createTaskSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),

  title: z
    .string()
    .trim()
    .min(2, 'Task title must be at least 2 characters')
    .max(200, 'Task title must be at most 200 characters'),

  description: z
    .string()
    .trim()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),

  status: z
    .enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
    .default('TODO'),

  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .default('MEDIUM'),

  assigneeId: z.string().min(1).optional(),

  dueDate: z.coerce.date().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Task title must be at least 2 characters')
      .max(200, 'Task title must be at most 200 characters')
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, 'Description must be at most 5000 characters')
      .optional(),

    status: z
      .enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
      .optional(),

    priority: z
      .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
      .optional(),

    assigneeId: z
      .string()
      .min(1, 'Assignee ID is required')
      .optional(),

    dueDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field is required',
  );



export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const listTaskQuerySchema = z.object({
  search: z.string().trim().optional(),

  status: z
    .enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
    .optional(),

  priority: z
    .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .optional(),

  assigneeId: z.string().min(1).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),

  sortBy: z
    .enum(['createdAt', 'dueDate', 'priority', 'title'])
    .default('createdAt'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type ListTaskQuery = z.infer<
  typeof listTaskQuerySchema
>;