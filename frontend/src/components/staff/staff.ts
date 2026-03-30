export interface StaffMember {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string | null;
  role: "admin" | "super-admin" | "staff";
  active: boolean;
  programs: string[];
  mfaEnabled: boolean;
  passwordHash?: string;
}