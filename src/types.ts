import { Timestamp } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export interface Vehicle {
  id?: string;
  userId: string;
  make: string;
  model: string;
  subModel?: string;
  year: number;
  nickname?: string;
  vin?: string;
  createdAt: Timestamp;
}

export interface Repair {
  id?: string;
  userId: string;
  vehicleId?: string; // Now linked to a car
  date: Timestamp;
  description: string;
  partNumbers: string[];
  repairTime: number; // in minutes
  tools: string[];
  odometer?: number; // New field
  vehicleInfo?: string; // Keep for legacy but move towards vehicleId
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Diagnostic {
  id?: string;
  userId: string;
  vehicleId?: string;
  dateDiscovered: Timestamp;
  codes: string[];
  notes?: string;
  odometer?: number;
  createdAt: Timestamp;
}
