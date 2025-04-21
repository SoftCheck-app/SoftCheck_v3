import { Employee } from './employee';
import { License } from './license';

export interface Software {
  id: string;
  device_id: string;
  user_id: string;
  user?: Employee;
  license_id?: string;
  license?: License;
  software_name: string;
  version: string;
  vendor: string;
  install_date: Date;
  install_path: string;
  install_method: string;
  last_executed?: Date;
  is_running: boolean;
  digital_signature: boolean;
  is_approved: boolean;
  detected_by: string;
  sha256: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export type SoftwareCreateInput = Omit<Software, 'id' | 'created_at' | 'updated_at'>;
export type SoftwareUpdateInput = Partial<Omit<Software, 'id' | 'created_at' | 'updated_at'>>; 