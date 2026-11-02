export type Role = "ADMIN" | "HR" | "EMPLOYEE";

export const canManageEmployees = (role: string) => role === "ADMIN" || role === "HR";
export const canDeleteEmployees = (role: string) => role === "ADMIN";
export const canViewAllEmployees = (role: string) => role === "ADMIN" || role === "HR";
