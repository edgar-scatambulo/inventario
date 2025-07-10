
import type { Timestamp } from "firebase/firestore";

export interface Equipment {
  id: string;
  name: string; // This is 'Marca' in the UI
  type?: string; 
  model?: string;
  serialNumber?: string;
  description?: string;
  barcode: string;
  sectorId?: string | null;
  sectorName?: string | null; // For display purposes
  lastCheckedTimestamp?: Timestamp | number; // Can be a Firestore Timestamp or a number from localStorage
  createdAt?: Timestamp | number; // Can be a Firestore Timestamp or a number from localStorage
}

export interface Sector {
  id: string;
  name: string;
}

export type UserRole = 'admin' | 'viewer';

export interface User {
  uid: string;
  email: string | null;
  role: UserRole;
}
