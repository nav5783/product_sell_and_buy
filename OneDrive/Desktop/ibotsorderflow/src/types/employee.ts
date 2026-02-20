export interface Employee {
  id?: string;
  name: string;
  address: string;
  mobile: string;
  email: string;
  defaultSalary: number;
  joiningDate: string;
  leavingDate?: string;
  isLoggedIn: boolean;
  insertedOn: any;
  updatedOn: any;
}
