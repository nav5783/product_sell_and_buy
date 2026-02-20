export type EmployeeRole = "admin" | "manager" | "staff";

export interface EmployeeLogin {
  id?: string;          // Firestore doc ID
  employeeId: string;   // Auto-generated, like EMP0001
  employeeName: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  createdAt: any;       // Firestore Timestamp
  updatedAt: any;       // Firestore Timestamp
}
