import { z } from 'zod';

/**
 * Schema for updating company information
 */
export const updateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  logo_url: z.string().url('Logo URL must be a valid URL').optional().nullable(),
  domain: z.string().min(2, 'Domain is required').optional(),
  location: z.string().max(100, 'Location must be under 100 characters').optional().nullable(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

