import { License } from './license';

export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  user_id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  software_licenses?: License[];
  status: EmployeeStatus;
  created_at?: Date;
  updated_at?: Date;
}

export type EmployeeCreateInput = Omit<Employee, 'user_id' | 'created_at' | 'updated_at'>;
export type EmployeeUpdateInput = Partial<Omit<Employee, 'user_id' | 'created_at' | 'updated_at'>>; 