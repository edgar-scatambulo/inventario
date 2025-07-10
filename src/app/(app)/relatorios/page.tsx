
"use client";

import * as React from 'react';
import { FileText, Download, Filter, Search, Building, ListX, Printer, Sigma } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Equipment, Sector } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


type ReportType = 'total' | 'bySector' | 'notConferenced';

interface ReportData {
  type: ReportType;
  sector?: Sector;
  items: Equipment[];
  title?: string; 
}

const db = getFirestore(app);

// Helper function to safely convert a Firestore Timestamp or a number to a Date
const toSafeDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (typeof timestamp.toMillis === 'function') { // It's a Firestore Timestamp
    return new Date(timestamp.toMillis());
  }
  if (typeof timestamp === 'number') { // It's a number from localStorage
    return new Date(timestamp);
  }
  if (timestamp instanceof Date) { // It's already a Date object
      return timestamp;
  }
  // Try to parse from object { seconds, nanoseconds } if it comes from stringified JSON
  if (typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  return null; // Or handle as an error
};

export default function RelatoriosPage() {
  const { toast } = useToast();
  const [reportData, setReportData] = React.useState<ReportData | null>(null);
  const [selectedSectorId, setSelectedSectorId] = React.useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sectors, setSectors] = React.useState<Sector[]>([]);
  const [allEquipment, setAllEquipment] = React.useState<Equipment[]>([]);
  const [showNotConferencedOnly, setShowNotConferencedOnly] = React.useState(false);

  React.useEffect(() => {
    // Listen to Sectors
    const qSectors = collection(db, "sectors");
    const unsubscribeSectors = onSnapshot(qSectors, (querySnapshot) => {
        const sectorsData: Sector[] = [];
        querySnapshot.forEach((doc) => {
            sectorsData.push({ id: doc.id, ...doc.data() } as Sector);
        });
        setSectors(sectorsData);
    }, (error) => console.error("Error fetching sectors: ", error));

    // Listen to Equipments
    const qEquipments = collection(db, "equipments");
    const unsubscribeEquipments = onSnapshot(qEquipments, (querySnapshot) => {
        const equipmentsData: Equipment[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
            equipmentsData.push({ 
                id: doc.id, 
                ...data,
                // Ensure timestamps are numbers for JSON serialization
                createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt,
                lastCheckedTimestamp: data.lastCheckedTimestamp?.toMillis ? data.lastCheckedTimestamp.toMillis() : data.lastCheckedTimestamp,
            } as Equipment);
        });
        setAllEquipment(equipmentsData);
    }, (error) => console.error("Error fetching equipments: ", error));

    return () => {
        unsubscribeSectors();
        unsubscribeEquipments();
    };
  }, []);

  const generateReport = (type: ReportType) => {
    let itemsToReport: Equipment[] = [];
    let reportTitle = '';
    let reportSector: Sector | undefined = undefined;

    if (type === 'total') {
      itemsToReport = [...allEquipment];
      reportTitle = 'Relatório de Inventário Total';
    } else if (type === 'bySector') {
      if (selectedSectorId) {
        const sector = sectors.find(s => s.id === selectedSectorId);
        if (sector) {
          reportSector = sector;
          itemsToReport = allEquipment.filter(eq => eq.sectorId === selectedSectorId);
          reportTitle = `Relatório de Inventário - Setor: ${sector.name}`;
        } else {
          setReportData(null);
          return;
        }
      } else {
        setReportData({ type, items: [], title: "Selecione um setor para gerar o relatório." });
        return;
      }
    }
    
    if (showNotConferencedOnly) {
      itemsToReport = itemsToReport.filter(eq => !eq.lastCheckedTimestamp);
      reportTitle += ' (Apenas Não Conferidos)';
    }

    // Sort items: first by sectorName, then by type
    itemsToReport.sort((a, b) => {
      const sectorNameA = a.sectorName || '\uffff'; 
      const sectorNameB = b.sectorName || '\uffff';
      const typeA = a.type || '\uffff';
      const typeB = b.type || '\uffff';

      const sectorCompare = sectorNameA.localeCompare(sectorNameB);
      if (sectorCompare !== 0) {
        return sectorCompare;
      }
      return typeA.localeCompare(typeB);
    });

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

  const summaryByType = React.useMemo(() => {
    if (filteredReportItems.length === 0) {
      return {};
    }
    const summary = filteredReportItems.reduce((acc, item) => {
      const type = item.type || 'Não Especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort the summary object by type name
    return Object.keys(summary).sort().reduce(
      (obj, key) => { 
        obj[key] = summary[key]; 
        return obj;
      }, 
      {} as Record<string, number>
    );

  }, [filteredReportItems]);

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

  const sortedSectors = React.useMemo(() => {
    return [...sectors].sort((a, b) => a.name.localeCompare(b.name));
  }, [sectors]);

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
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-wrap justify-end items-center">
               <div className="flex items-center space-x-2">
                <Switch 
                  id="not-conferenced-switch" 
                  checked={showNotConferencedOnly}
                  onCheckedChange={setShowNotConferencedOnly}
                />
                <Label htmlFor="not-conferenced-switch" className="cursor-pointer">Apenas não conferidos</Label>
              </div>
              <Button onClick={() => generateReport('total')} className="w-full sm:w-auto" variant="default">
                Inventário Total
              </Button>
              <div className="flex gap-3 w-full sm:w-auto">
                <Select onValueChange={setSelectedSectorId} value={selectedSectorId}>
                  <SelectTrigger className="flex-1 min-w-[180px] sm:min-w-[200px]" aria-label="Selecionar Setor">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedSectors.map(sector => (
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
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead className="hidden sm:table-cell print:table-cell">Modelo</TableHead>
                        <TableHead className="hidden md:table-cell print:table-cell">Nº de Série</TableHead>
                        <TableHead>Patrimônio</TableHead>
                        <TableHead>Setor</TableHead>
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
                          <TableCell>{item.sectorName || 'N/A'}</TableCell>
                          <TableCell className="hidden lg:table-cell print:table-cell max-w-xs truncate">{item.description || 'N/A'}</TableCell>
                          <TableCell className="hidden sm:table-cell print:table-cell">
                            {(() => {
                              const date = toSafeDate(item.lastCheckedTimestamp);
                              return date ? date.toLocaleString() : <span className="text-muted-foreground italic">Não conferido</span>;
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Sigma className="mr-2 h-5 w-5" />
                      Resumo do Relatório
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-base border-b pb-2">
                        <span>Total Geral de Equipamentos:</span>
                        <span>{filteredReportItems.length}</span>
                      </div>
                      <div className="space-y-1 pt-2">
                        <h4 className="font-semibold text-md mb-1">Totais por Tipo:</h4>
                        {Object.entries(summaryByType).map(([type, count]) => (
                          <div key={type} className="flex justify-between text-sm pl-4">
                            <span className="text-muted-foreground">{type}:</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {reportData.items.length === 0 && showNotConferencedOnly ?
                  "Nenhum equipamento não conferido encontrado para este filtro." :
                reportData.items.length === 0 && reportData.type === 'bySector' && reportData.sector ? 
                  `Nenhum equipamento encontrado para o setor "${reportData.sector.name}".` : 
                reportData.items.length === 0 && reportData.title === "Selecione um setor para gerar o relatório." ?
                   reportData.title :
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
            <p className="text-sm text-muted-foreground">Você pode gerar um relatório do inventário total ou por setor.</p>
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

    