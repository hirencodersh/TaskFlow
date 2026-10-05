import { z } from 'zod';

export const taskLabelParamsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

export const taskLabelActionSchema = z.object({
  labelId: z.string().min(1, 'Label ID is required'),
});

export type TaskLabelParams = z.infer<
  typeof taskLabelParamsSchema
>;

export type TaskLabelActionInput = z.infer<
  typeof taskLabelActionSchema
>;