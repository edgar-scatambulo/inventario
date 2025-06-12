
"use client";

import * as React from 'react';
import { FileText, Download, Filter, Search, Building, ListX, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Equipment, Sector } from '@/lib/types';
import { mockEquipment, mockSectors } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

type ReportType = 'total' | 'bySector' | 'notConferenced';

interface ReportData {
  type: ReportType;
  sector?: Sector;
  items: Equipment[];
  title?: string; 
}

const EQUIPMENTS_STORAGE_KEY = 'localStorage_equipments';
const SECTORS_STORAGE_KEY = 'localStorage_sectors';

export default function RelatoriosPage() {
  const { toast } = useToast();
  const [reportData, setReportData] = React.useState<ReportData | null>(null);
  const [selectedSectorId, setSelectedSectorId] = React.useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sectors, setSectors] = React.useState<Sector[]>([]);
  const [allEquipment, setAllEquipment] = React.useState<Equipment[]>([]);

  React.useEffect(() => {
    const storedSectors = localStorage.getItem(SECTORS_STORAGE_KEY);
    if (storedSectors) {
      setSectors(JSON.parse(storedSectors));
    } else {
      setSectors(mockSectors); 
      localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(mockSectors));
    }

    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    if (storedEquipments) {
      setAllEquipment(JSON.parse(storedEquipments));
    } else {
      setAllEquipment(mockEquipment); 
      localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(mockEquipment));
    }
  }, []);

  const generateReport = (type: ReportType) => {
    let itemsToReport: Equipment[] = [];
    let reportTitle = '';
    let reportSector: Sector | undefined = undefined;

    if (type === 'total') {
      itemsToReport = allEquipment;
      reportTitle = 'Relatório de Inventário Total';
    } else if (type === 'bySector' && selectedSectorId) {
      const sector = sectors.find(s => s.id === selectedSectorId);
      if (sector) {
        reportSector = sector;
        itemsToReport = allEquipment.filter(eq => eq.sectorId === selectedSectorId);
        reportTitle = `Relatório de Inventário - Setor: ${sector.name}`;
      } else {
        setReportData(null); 
        return;
      }
    } else if (type === 'bySector' && !selectedSectorId) {
       setReportData({ type, items: [], title: "Selecione um setor para gerar o relatório." });
       return;
    } else if (type === 'notConferenced') {
      itemsToReport = allEquipment.filter(eq => !eq.lastCheckedTimestamp);
      reportTitle = 'Relatório de Equipamentos Não Conferidos';
    }
     setReportData({ type, sector: reportSector, items: itemsToReport, title: reportTitle });
     setSearchTerm(''); 
  };

  const filteredReportItems = reportData?.items.filter(item => 
    (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode.includes(searchTerm) ||
    (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleExportClick = () => {
    if (filteredReportItems.length === 0) {
      toast({
        title: "Exportação Indisponível",
        description: "Não há dados para exportar neste relatório.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Exportação Indisponível",
      description: "A funcionalidade de exportar dados CSV ainda está em desenvolvimento.",
      variant: "default",
    });
  };

  const handlePrintClick = () => {
    if (filteredReportItems.length === 0) {
       toast({
        title: "Impressão Indisponível",
        description: "Não há dados para imprimir neste relatório.",
        variant: "destructive",
      });
      return;
    }
    window.print();
  };

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
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-wrap justify-end">
              <Button onClick={() => generateReport('total')} className="w-full sm:w-auto" variant="default">
                Inventário Total
              </Button>
              <Button onClick={() => generateReport('notConferenced')} className="w-full sm:w-auto" variant="outline">
                <ListX className="mr-2 h-4 w-4" />
                Não Conferidos
              </Button>
              <div className="flex gap-3 w-full sm:w-auto">
                <Select onValueChange={setSelectedSectorId} value={selectedSectorId}>
                  <SelectTrigger className="flex-1 min-w-[180px] sm:min-w-[200px]" aria-label="Selecionar Setor">
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
        <Card className="shadow-md animate-in fade-in print:shadow-none print:border-none">
          <CardHeader className="print:hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-xl">{reportData.title || "Relatório de Inventário"}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportClick} disabled={filteredReportItems.length === 0}>
                  <Download className="mr-2 h-4 w-4" /> Exportar CSV
                </Button>
                 <Button variant="outline" size="sm" onClick={handlePrintClick} disabled={filteredReportItems.length === 0}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
              </div>
            </div>
            {reportData.items.length > 0 && ( 
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
                <div className="mb-4 hidden print:block">
                  <h2 className="text-2xl font-semibold">{reportData.title || "Relatório de Inventário"}</h2>
                  <p className="text-sm text-muted-foreground">Gerado em: {new Date().toLocaleString()}</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead className="hidden sm:table-cell print:table-cell">Modelo</TableHead>
                      <TableHead className="hidden md:table-cell print:table-cell">Nº de Série</TableHead>
                      <TableHead>Patrimônio</TableHead>
                      {(reportData.type === 'total' || reportData.type === 'notConferenced') && <TableHead>Setor</TableHead>}
                      <TableHead className="hidden lg:table-cell print:table-cell">Descrição</TableHead>
                       <TableHead className="hidden sm:table-cell print:table-cell">Última Conferência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReportItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.type || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="hidden sm:table-cell print:table-cell max-w-[150px] truncate">{item.model || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell print:table-cell max-w-[150px] truncate">{item.serialNumber || 'N/A'}</TableCell>
                        <TableCell>{item.barcode}</TableCell>
                        {(reportData.type === 'total' || reportData.type === 'notConferenced') && <TableCell>{item.sectorName || 'N/A'}</TableCell>}
                        <TableCell className="hidden lg:table-cell print:table-cell max-w-xs truncate">{item.description || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell print:table-cell">
                          {item.lastCheckedTimestamp 
                            ? new Date(item.lastCheckedTimestamp).toLocaleString() 
                            : <span className="text-muted-foreground italic">Não conferido</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {reportData.items.length === 0 && reportData.type === 'notConferenced' ?
                  "Nenhum equipamento não conferido encontrado." :
                reportData.items.length === 0 && reportData.type === 'bySector' && reportData.sector ? 
                  `Nenhum equipamento encontrado para o setor "${reportData.sector.name}".` : 
                reportData.items.length === 0 ? 
                  "Nenhum equipamento para exibir neste relatório." : 
                  "Nenhum equipamento corresponde à sua busca."}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!reportData && (
         <div className="text-center py-12 print:hidden">
            <FileText className="mx-auto h-20 w-20 text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground">Selecione um tipo de relatório para começar.</p>
            <p className="text-sm text-muted-foreground">Você pode gerar um relatório do inventário total, por setor ou listar os não conferidos.</p>
        </div>
      )}
    </div>
  );
}

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    title?: string;
  }
}

