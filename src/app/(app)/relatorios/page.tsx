"use client";

import * as React from 'react';
import { FileText, Download, Filter, Search, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Equipment, Sector } from '@/lib/types';
import { mockEquipment, mockSectors } from '@/lib/mock-data';

type ReportType = 'total' | 'bySector';

interface ReportData {
  type: ReportType;
  sector?: Sector;
  items: Equipment[];
}

export default function RelatoriosPage() {
  const [reportData, setReportData] = React.useState<ReportData | null>(null);
  const [selectedSectorId, setSelectedSectorId] = React.useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sectors] = React.useState<Sector[]>(mockSectors);
  const [allEquipment] = React.useState<Equipment[]>(mockEquipment);

  const generateReport = (type: ReportType) => {
    let itemsToReport: Equipment[] = [];
    let reportTitle = '';

    if (type === 'total') {
      itemsToReport = allEquipment;
      reportTitle = 'Relatório de Inventário Total';
    } else if (type === 'bySector' && selectedSectorId) {
      const sector = sectors.find(s => s.id === selectedSectorId);
      if (sector) {
        itemsToReport = allEquipment.filter(eq => eq.sectorId === selectedSectorId);
        reportTitle = `Relatório de Inventário - Setor: ${sector.name}`;
      } else {
        setReportData(null); // Clear previous report if sector not found
        return;
      }
      setReportData({ type, sector, items: itemsToReport, title: reportTitle });
      return;
    } else if (type === 'bySector' && !selectedSectorId) {
       setReportData({ type, items: [], title: "Selecione um setor para gerar o relatório." });
       return;
    }
     setReportData({ type, items: itemsToReport, title: reportTitle });
  };

  const filteredReportItems = reportData?.items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode.includes(searchTerm) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl font-headline flex items-center">
                <FileText className="mr-3 h-8 w-8 text-primary" />
                Relatórios de Inventário
              </CardTitle>
              <CardDescription>
                Visualize e exporte o estado atual do seu inventário.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button onClick={() => generateReport('total')} className="w-full sm:w-auto" variant="default">
                Inventário Total
              </Button>
              <div className="flex gap-3 w-full sm:w-auto">
                <Select onValueChange={setSelectedSectorId} value={selectedSectorId}>
                  <SelectTrigger className="flex-1 min-w-[200px]" aria-label="Selecionar Setor">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => generateReport('bySector')} className="flex-initial" disabled={!selectedSectorId}>
                  Por Setor
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {reportData && (
        <Card className="shadow-md animate-in fade-in">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-xl">{reportData.title || "Relatório de Inventário"}</CardTitle>
              <Button variant="outline" size="sm" disabled={filteredReportItems.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </Button>
            </div>
            {filteredReportItems.length > 0 && (
              <div className="mt-4 relative w-full sm:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar no relatório..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredReportItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Equipamento</TableHead>
                      <TableHead>Código de Barras</TableHead>
                      {reportData.type === 'total' && <TableHead>Setor</TableHead>}
                      <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReportItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        {reportData.type === 'total' && <TableCell>{item.sectorName || 'N/A'}</TableCell>}
                        <TableCell className="hidden md:table-cell max-w-xs truncate">{item.description || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {reportData.items.length === 0 ? "Nenhum equipamento para exibir neste relatório." : "Nenhum equipamento corresponde à sua busca."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!reportData && (
         <div className="text-center py-12">
            <FileText className="mx-auto h-20 w-20 text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground">Selecione um tipo de relatório para começar.</p>
            <p className="text-sm text-muted-foreground">Você pode gerar um relatório do inventário total ou filtrar por um setor específico.</p>
        </div>
      )}
    </div>
  );
}
// Add a title property to ReportData interface if used directly
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    title?: string;
  }
}

