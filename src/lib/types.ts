export interface Equipment {
  id: string;
  name: string;
  description: string;
  barcode: string;
  sectorId?: string;
  sectorName?: string; // For display purposes
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
