import { Employee } from './employee';
import { Software } from './software';

export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'pending';

export interface License {
  license_id: string;
  user_id: string;
  user?: Employee;
  software_name: string;
  installations?: Software[];
  activation_date: Date;
  expiration_date?: Date;
  price: number;
  status: LicenseStatus;
  created_at?: Date;
  updated_at?: Date;
}

export type LicenseCreateInput = Omit<License, 'license_id' | 'installations' | 'created_at' | 'updated_at'>;
export type LicenseUpdateInput = Partial<Omit<License, 'license_id' | 'created_at' | 'updated_at'>>; 