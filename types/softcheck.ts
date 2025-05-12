import { Prisma } from '@prisma/client';

// Define tipos basados en Prisma generated types una vez que estén disponibles
type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type SoftwareDatabase = {
  id: string;
  deviceId: string;
  userId: string;
  softwareName: string;
  version: string;
  vendor: string;
  installDate: Date;
  installPath: string;
  installMethod?: string | null;
  lastExecuted?: Date | null;
  isRunning: boolean;
  digitalSignature?: string | null;
  isApproved: boolean;
  detectedBy?: string | null;
  sha256?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Employee with related data
 */
export type EmployeeWithRelations = Employee & {
  softwareInstalls?: SoftwareDatabase[];
};

/**
 * Software installation with related data
 */
export type SoftwareWithRelations = SoftwareDatabase & {
  user?: Employee;
};

/**
 * Software Dashboard Stats
 */
export interface SoftwareStats {
  totalSoftware: number;
  totalEmployees: number;
  softwareApprovedThisMonth: number;
}

/**
 * Software Activity Summary
 */
export interface SoftwareActivity {
  id: string;
  type: 'software_update' | 'software_approval';
  description: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
  };
}

/**
 * Software Filter Options
 */
export interface SoftwareFilterOptions {
  status?: 'all' | 'approved' | 'unapproved';
  vendor?: string;
  installDateRange?: {
    start: Date;
    end: Date;
  };
} 