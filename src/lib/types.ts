
export interface Equipment {
  id: string;
  name: string; // This is 'Marca' in the UI
  type?: string; // Novo campo 'Tipo'
  model?: string;
  serialNumber?: string;
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
