import { z } from 'zod';

export const attachmentParamsSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

export type AttachmentParams = z.infer<
  typeof attachmentParamsSchema
>;

export const attachmentIdParamsSchema = z.object({
  id: z.string().min(1, 'Attachment ID is required'),
});

export type AttachmentIdParams = z.infer<
  typeof attachmentIdParamsSchema
>;