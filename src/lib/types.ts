
export interface Equipment {
  id: string;
  name: string;
  model?: string; // Novo campo
  serialNumber?: string; // Novo campo
  description?: string;
  barcode: string;
  sectorId?: string;
  sectorName?: string; // For display purposes
  lastCheckedTimestamp?: number; // Timestamp of the last successful conference
}

export interface Sector {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  // For a real app, password would be handled securely on the backend
}
