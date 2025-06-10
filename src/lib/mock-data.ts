import type { Equipment, Sector } from './types';

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
    name: 'Notebook Dell Latitude 7420',
    description: 'Processador i7, 16GB RAM, 512GB SSD',
    barcode: '8901234567890',
    sectorId: 'sector-1',
    sectorName: 'TI - Desenvolvimento',
  },
  {
    id: 'equip-2',
    name: 'Monitor LG UltraWide 34"',
    description: 'Resolução 3440x1440, Curvo',
    barcode: '8901234567891',
    sectorId: 'sector-1',
    sectorName: 'TI - Desenvolvimento',
  },
  {
    id: 'equip-3',
    name: 'Apple MacBook Pro 16"',
    description: 'Chip M2 Pro, 32GB RAM, 1TB SSD',
    barcode: '8901234567892',
    sectorId: 'sector-2',
    sectorName: 'Marketing Digital',
  },
  {
    id: 'equip-4',
    name: 'Impressora HP LaserJet Pro',
    description: 'Multifuncional, Wi-Fi',
    barcode: '8901234567893',
    sectorId: 'sector-3',
    sectorName: 'Recursos Humanos',
  },
  {
    id: 'equip-5',
    name: 'Projetor Epson PowerLite',
    description: '3LCD, Full HD',
    barcode: '8901234567894',
    sectorId: 'sector-5',
    sectorName: 'Sala de Reuniões Alpha',
  },
  {
    id: 'equip-6',
    name: 'Cadeira Ergonômica Herman Miller',
    description: 'Modelo Aeron, Tamanho B',
    barcode: '8901234567895',
    sectorId: 'sector-4',
    sectorName: 'Financeiro',
  },
];
