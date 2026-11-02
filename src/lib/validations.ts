import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    email: z.email("Enter a valid email"),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const employeeStatusValues = ["PENDING", "ACTIVE", "INACTIVE", "TERMINATED"] as const;
export const roleValues = ["ADMIN", "HR", "EMPLOYEE"] as const;

export const employeeSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.email("Enter a valid email"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  department: z.string().trim().max(100).optional().or(z.literal("")),
  designation: z.string().trim().max(100).optional().or(z.literal("")),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  status: z.enum(employeeStatusValues),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  role: z.enum(roleValues).optional(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const profileUpdateSchema = z.object({
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
