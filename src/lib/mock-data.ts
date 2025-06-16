import type { Equipment, Sector } from './types';

const oneDay = 24 * 60 * 60 * 1000;
const now = Date.now();

export const mockSectors: Sector[] = [
  { id: 'sector-1', name: 'TI - Desenvolvimento' },
  { id: 'sector-2', name: 'Marketing Digital' },
  { id: 'sector-3', name: 'Recursos Humanos' },
  { id: 'sector-4', name: 'Financeiro' },
  { id: 'sector-5', name: 'Sala de Reuniões Alpha' },
];

export const mockEquipment: Equipment[] = [
  {
    id: 'equip-1',
    name: 'Dell Latitude 7420',
    type: 'Notebook',
    model: 'Latitude 7420',
    serialNumber: 'SN7420XYZ001',
    description: 'Processador i7, 16GB RAM, 512GB SSD',
    barcode: '8901234567890',
    sectorId: 'sector-1',
    sectorName: 'TI - Desenvolvimento',
    createdAt: now - (5 * oneDay), // 5 days ago
  },
  {
    id: 'equip-2',
    name: 'LG UltraWide 34"',
    type: 'Monitor',
    model: '34WN750-B',
    serialNumber: 'SNLG34MON002',
    description: 'Resolução 3440x1440, Curvo',
    barcode: '8901234567891',
    sectorId: 'sector-1',
    sectorName: 'TI - Desenvolvimento',
    createdAt: now - (4 * oneDay), // 4 days ago
  },
  {
    id: 'equip-3',
    name: 'Apple MacBook Pro 16"',
    type: 'Notebook',
    model: 'MacBookPro18,1',
    serialNumber: 'SNMBP16M2P003',
    description: 'Chip M2 Pro, 32GB RAM, 1TB SSD',
    barcode: '8901234567892',
    sectorId: 'sector-2',
    sectorName: 'Marketing Digital',
    createdAt: now - (3 * oneDay), // 3 days ago
  },
  {
    id: 'equip-4',
    name: 'HP LaserJet Pro',
    type: 'Impressora',
    model: 'M428fdw',
    serialNumber: 'SNHPLJM428004',
    description: 'Multifuncional, Wi-Fi',
    barcode: '8901234567893',
    sectorId: 'sector-3',
    sectorName: 'Recursos Humanos',
    createdAt: now - (2 * oneDay), // 2 days ago
  },
  {
    id: 'equip-5',
    name: 'Epson PowerLite',
    type: 'Gabinete',
    model: '1781W',
    serialNumber: 'SNEPSPL1781005',
    description: '3LCD, Full HD',
    barcode: '8901234567894',
    sectorId: 'sector-5',
    sectorName: 'Sala de Reuniões Alpha',
    createdAt: now - (1 * oneDay), // 1 day ago
  },
  {
    id: 'equip-6',
    name: 'Herman Miller',
    type: 'Gabinete',
    model: 'Aeron Remastered',
    serialNumber: 'SNHMAERON006',
    description: 'Modelo Aeron, Tamanho B',
    barcode: '8901234567895',
    sectorId: 'sector-4',
    sectorName: 'Financeiro',
    createdAt: now, // Today
  },
];
