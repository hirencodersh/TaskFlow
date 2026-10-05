import { z } from 'zod';

export const createLabelSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),

  name: z
    .string()
    .trim()
    .min(1, 'Label name is required')
    .max(50, 'Label name must be at most 50 characters'),

  color: z
    .string()
    .trim()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      'Color must be a valid hex color',
    ),
});

export type CreateLabelInput = z.infer<
  typeof createLabelSchema
>;

export const updateLabelSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Label name is required')
      .max(50, 'Label name must be at most 50 characters')
      .optional(),

    color: z
      .string()
      .trim()
      .regex(
        /^#[0-9A-Fa-f]{6}$/,
        'Color must be a valid hex color',
      )
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field is required',
  );

export type UpdateLabelInput = z.infer<
  typeof updateLabelSchema
>;

export const projectIdParamsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

export const labelIdParamsSchema = z.object({
  id: z.string().min(1, 'Label ID is required'),
});

export type ProjectIdParams = z.infer<
  typeof projectIdParamsSchema
>;

export type LabelIdParams = z.infer<
  typeof labelIdParamsSchema
>;