import { z } from "zod";

export const personSchema = z.object({
  _id: z.string().optional(),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.email("Invalid email format").optional().or(z.literal("")),
  referralDate: z.string().optional(),
  programs: z.array(z.string()).optional(),
  pronouns: z.string().optional(),
  preferredContactMethod: z.string().optional(),
  status: z.record(z.string(), z.record(z.string(), z.string())).optional()
});

export type Person = z.infer<typeof personSchema>;