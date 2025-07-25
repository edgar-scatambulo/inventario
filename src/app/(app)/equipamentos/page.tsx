
"use client";

import * as React from 'react';
import { PlusCircle, Edit, Trash2, Search, Filter, FileDown, ClipboardX, FileUp, CalendarDays, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Equipment, Sector } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getFirestore, writeBatch, doc, updateDoc, deleteDoc, addDoc, collection, onSnapshot, getDoc, query, where, getDocs, deleteField, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';
import { useAuth } from '@/hooks/use-auth';
import { Checkbox } from '@/components/ui/checkbox';

const db = getFirestore(app);

const equipmentTypes = ['Celular', 'Gabinete', 'Impressora', 'Monitor', 'Notebook', 'Switch'];

const equipmentFormSchema = z.object({
  type: z.string().min(1, { message: 'Selecione um tipo.' }),
  name: z.string().min(2, { message: 'Marca deve ter pelo menos 2 caracteres.' }),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  description: z.string().optional(),
  barcode: z.string().min(5, { message: 'Patrimônio deve ter pelo menos 5 caracteres.' }),
  sectorId: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

const EQUIPMENTS_STORAGE_KEY = 'localStorage_equipments';
const SECTORS_STORAGE_KEY = 'localStorage_sectors';
const NO_SECTOR_VALUE = "NO_SECTOR_ASSIGNED_VALUE";
const ALL_SECTORS_VALUE = "--ALL_SECTORS--";

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

export default function EquipamentosPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [equipments, setEquipments] = React.useState<Equipment[]>([]);
  const [sectors, setSectors] = React.useState<Sector[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterSector, setFilterSector] = React.useState<string | undefined>(undefined);
  const [selectedEquipments, setSelectedEquipments] = React.useState<string[]>([]);

  const [isMarkUncheckedDialogOpen, setIsMarkUncheckedDialogOpen] = React.useState(false);
  const [sectorToMarkUnchecked, setSectorToMarkUnchecked] = React.useState<string | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      type: '',
      name: '',
      model: '',
      serialNumber: '',
      description: '',
      barcode: '',
      sectorId: '',
    },
  });

  React.useEffect(() => {
    // Fetch Sectors
    const qSectors = collection(db, "sectors");
    const unsubscribeSectors = onSnapshot(qSectors, (querySnapshot) => {
        const sectorsData: Sector[] = [];
        querySnapshot.forEach((doc) => {
            sectorsData.push({ id: doc.id, ...doc.data() } as Sector);
        });
        setSectors(sectorsData);
        localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(sectorsData));
    }, (error) => console.error("Error fetching sectors: ", error));

    // Fetch Equipments
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
        setEquipments(equipmentsData);
        localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(equipmentsData));
    }, (error) => console.error("Error fetching equipments: ", error));

    return () => {
        unsubscribeSectors();
        unsubscribeEquipments();
    };
  }, []);

  React.useEffect(() => {
    if (editingEquipment) {
      form.reset({
        type: editingEquipment.type || '',
        name: editingEquipment.name,
        model: editingEquipment.model || '',
        serialNumber: editingEquipment.serialNumber || '',
        description: editingEquipment.description || '',
        barcode: editingEquipment.barcode,
        sectorId: editingEquipment.sectorId || NO_SECTOR_VALUE,
      });
    } else {
      form.reset({ type: '', name: '', model: '', serialNumber: '', description: '', barcode: '', sectorId: NO_SECTOR_VALUE });
    }
  }, [editingEquipment, form, isFormDialogOpen]);
  
  React.useEffect(() => {
    setSelectedEquipments([]);
  }, [searchTerm, filterSector]);

  const handleAddOrUpdateEquipment = async (data: EquipmentFormValues) => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para realizar esta ação.' });
      return;
    }

    const finalSectorId = (data.sectorId === NO_SECTOR_VALUE || data.sectorId === '')
                            ? undefined
                            : data.sectorId;

    const sector = sectors.find(s => s.id === finalSectorId);

    const equipmentData = {
      ...data,
      sectorId: finalSectorId || null,
      sectorName: sector?.name || null,
      model: data.model || null,
      serialNumber: data.serialNumber || null,
      description: data.description || null,
    };
    
    try {
        if (editingEquipment) {
            const equipmentRef = doc(db, "equipments", editingEquipment.id);
            await updateDoc(equipmentRef, {
                ...equipmentData
            });
            toast({ title: 'Sucesso!', description: 'Equipamento atualizado.' });
        } else {
            const q = query(collection(db, "equipments"), where("barcode", "==", data.barcode));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Adicionar',
                    description: `Equipamento com patrimônio ${data.barcode} já existe.`,
                });
                return;
            }
            await addDoc(collection(db, "equipments"), {
              ...equipmentData,
              createdAt: Timestamp.now()
            });
            toast({ title: 'Sucesso!', description: 'Equipamento adicionado.' });
        }
        setIsFormDialogOpen(false);
        setEditingEquipment(null);
    } catch (error) {
        console.error("Error saving equipment: ", error);
        toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar os dados do equipamento.' });
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para realizar esta ação.' });
      return;
    }
    try {
        await deleteDoc(doc(db, "equipments", equipmentId));
        toast({ title: 'Sucesso!', description: 'Equipamento removido.' });
    } catch (error) {
        console.error("Error deleting equipment: ", error);
        toast({ variant: 'destructive', title: 'Erro ao Remover', description: 'Não foi possível remover o equipamento.' });
    }
  };

  const handleDeleteSelectedEquipments = async () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para realizar esta ação.' });
      return;
    }
    if (selectedEquipments.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum equipamento selecionado', description: 'Selecione pelo menos um equipamento para excluir.' });
      return;
    }

    const batch = writeBatch(db);
    selectedEquipments.forEach(id => {
      const equipRef = doc(db, "equipments", id);
      batch.delete(equipRef);
    });

    try {
      await batch.commit();
      toast({ title: 'Sucesso!', description: `${selectedEquipments.length} equipamento(s) removido(s).` });
      setSelectedEquipments([]);
    } catch (error) {
      console.error("Error deleting selected equipments: ", error);
      toast({ variant: 'destructive', title: 'Erro ao Remover', description: 'Não foi possível remover os equipamentos selecionados.' });
    }
  };

  const openEditDialog = (equipment: Equipment) => {
    if (!isAdmin) return;
    setEditingEquipment(equipment);
    setIsFormDialogOpen(true);
  };

  const filteredEquipments = equipments.filter(eq => {
    const matchesSearch = (eq.type && eq.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.barcode.includes(searchTerm) ||
                          (eq.model && eq.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (eq.serialNumber && eq.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (eq.description && eq.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSector = (filterSector && filterSector !== 'all') ? eq.sectorId === filterSector : true;
    return matchesSearch && matchesSector;
  }).sort((a, b) => {
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEquipments(filteredEquipments.map(eq => eq.id));
    } else {
      setSelectedEquipments([]);
    }
  };
  
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEquipments(prev => [...prev, id]);
    } else {
      setSelectedEquipments(prev => prev.filter(eqId => eqId !== id));
    }
  };

  const handleExportClick = () => {
    toast({
      title: "Exportação Indisponível",
      description: "A funcionalidade de exportar dados ainda está em desenvolvimento.",
      variant: "default",
    });
  };

  const handleConfirmMarkAsNotChecked = async () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para realizar esta ação.' });
      setIsMarkUncheckedDialogOpen(false);
      return;
    }
    if (!sectorToMarkUnchecked) {
      toast({ variant: 'destructive', title: 'Seleção Necessária', description: 'Por favor, selecione um setor.' });
      return;
    }
  
    const equipmentsToUpdate = equipments.filter(eq => {
      if (sectorToMarkUnchecked === ALL_SECTORS_VALUE) {
        return !!eq.lastCheckedTimestamp; 
      }
      return eq.sectorId === sectorToMarkUnchecked && !!eq.lastCheckedTimestamp;
    });
  
    if (equipmentsToUpdate.length === 0) {
      toast({ title: 'Nenhuma Alteração', description: 'Nenhum equipamento conferido para limpar no setor selecionado.' });
      setIsMarkUncheckedDialogOpen(false);
      return;
    }
  
    const batch = writeBatch(db);
    equipmentsToUpdate.forEach(eq => {
      const equipRef = doc(db, "equipments", eq.id);
      batch.update(equipRef, { lastCheckedTimestamp: deleteField() });
    });
  
    try {
      await batch.commit();
  
      // Local state will be updated automatically by onSnapshot
  
      const sectorName = sectorToMarkUnchecked === ALL_SECTORS_VALUE
        ? "todos os setores"
        : sectors.find(s => s.id === sectorToMarkUnchecked)?.name || "setor selecionado";
  
      toast({
        title: 'Sucesso!',
        description: `Conferência de ${equipmentsToUpdate.length} equipamento(s) de ${sectorName} foi limpa.`,
      });
    } catch (error) {
      console.error("Error clearing conference status: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Limpar Conferências',
        description: 'Ocorreu um problema ao se comunicar com o banco de dados.',
      });
    } finally {
      setIsMarkUncheckedDialogOpen(false);
      setSectorToMarkUnchecked(undefined);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para realizar esta ação.' });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text) {
            toast({ variant: "destructive", title: "Erro ao ler arquivo", description: "Não foi possível ler o conteúdo do arquivo CSV." });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length <= 1) {
            toast({ variant: "destructive", title: "Arquivo CSV Vazio ou Inválido", description: "O arquivo CSV não contém dados ou possui apenas o cabeçalho." });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        
        const headerLine = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const expectedHeaders = ['type', 'name', 'model', 'serialnumber', 'description', 'barcode', 'sectorname'];
        const headerMap: { [key: string]: number } = {};

        headerLine.forEach((header, index) => {
          const normalizedHeader = header.replace(/\s+/g, ''); // Remove spaces for better matching
          if (expectedHeaders.includes(normalizedHeader)) {
            headerMap[normalizedHeader] = index;
          }
        });

        if (headerMap['type'] === undefined || headerMap['name'] === undefined || headerMap['barcode'] === undefined) {
            toast({
                variant: "destructive",
                title: "Cabeçalho CSV Inválido",
                description: <pre className="whitespace-pre-wrap text-xs">O cabeçalho do arquivo CSV deve conter no mínimo as colunas: type, name, barcode.</pre>,
                duration: 10000,
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const dataLines = lines.slice(1);
        const errors: string[] = [];
        let importedCount = 0;
        let duplicateCount = 0;
        const batch = writeBatch(db);
        const allBarcodesInDB = new Set(equipments.map(eq => eq.barcode));
        const allSectorsByName = new Map(sectors.map(s => [s.name.toLowerCase(), s]));

        for (const [index, line] of dataLines.entries()) {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            
            const sectorNameRaw = values[headerMap['sectorname']];
            const sectorName = (sectorNameRaw || '').trim();

            let sectorId: string | undefined = undefined;
            let actualSectorNameForEquipment: string | undefined = undefined;

            if (sectorName) {
                const foundSector = allSectorsByName.get(sectorName.toLowerCase());
                if (foundSector) {
                    sectorId = foundSector.id;
                    actualSectorNameForEquipment = foundSector.name;
                } else {
                    errors.push(`Linha ${index + 2}: Setor '${sectorName}' não encontrado. O equipamento será adicionado sem setor.`);
                }
            }
            
            const parsedData = {
                type: values[headerMap['type']] || '',
                name: values[headerMap['name']] || '',
                model: values[headerMap['model']] || undefined,
                serialNumber: values[headerMap['serialnumber']] || undefined,
                description: values[headerMap['description']] || undefined,
                barcode: values[headerMap['barcode']] || '',
                sectorId: sectorId,
            };

            const validationResult = equipmentFormSchema.safeParse(parsedData);

            if (validationResult.success) {
                if (allBarcodesInDB.has(validationResult.data.barcode)) {
                    errors.push(`Linha ${index + 2}: Patrimônio '${validationResult.data.barcode}' já existe e foi ignorado.`);
                    duplicateCount++;
                } else {
                    const newEquipmentData = {
                        ...validationResult.data,
                        sectorName: actualSectorNameForEquipment || null,
                        createdAt: Timestamp.now(),
                        sectorId: sectorId || null,
                        model: validationResult.data.model || null,
                        serialNumber: validationResult.data.serialNumber || null,
                        description: validationResult.data.description || null,
                    };
                    const newDocRef = doc(collection(db, "equipments"));
                    batch.set(newDocRef, newEquipmentData);
                    allBarcodesInDB.add(validationResult.data.barcode); // Avoid duplicating within the same file
                    importedCount++;
                }
            } else {
                const errorMessages = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                errors.push(`Linha ${index + 2}: ${errorMessages}`);
            }
        };

        if (importedCount > 0) {
            try {
                await batch.commit();
                toast({ title: 'Importação Concluída!', description: `${importedCount} equipamento(s) importado(s) com sucesso.` });
            } catch (error) {
                console.error("Error committing batch import: ", error);
                toast({ variant: "destructive", title: "Erro na Importação", description: `Ocorreu um erro ao salvar os dados no banco: ${error instanceof Error ? error.message : String(error)}` });
            }
        } else if (errors.length === 0 && duplicateCount > 0) {
            toast({ title: 'Importação Finalizada', description: 'Nenhum novo equipamento foi adicionado pois todos já existiam.' });
        } else if (errors.length > 0 && importedCount === 0) {
             toast({ variant: "destructive", title: 'Importação Falhou', description: 'Nenhum equipamento válido foi encontrado no arquivo. Verifique os erros.' });
        } else {
            toast({ title: 'Importação Finalizada', description: 'Nenhum dado novo para importar.' });
        }

        if (errors.length > 0) {
            const displayedErrors = errors.slice(0, 5);
            const additionalErrorCount = errors.length - displayedErrors.length;
            let errorDescription = displayedErrors.join('\n');
            if (additionalErrorCount > 0) {
                errorDescription += `\nE mais ${additionalErrorCount} outros erros/avisos.`;
            }
            toast({
                variant: "destructive",
                title: `Erros/Avisos na Importação (${errors.length})`,
                description: <pre className="whitespace-pre-wrap text-xs max-h-40 overflow-y-auto">{errorDescription}</pre>,
                duration: 15000,
            });
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.readAsText(file, 'UTF-8');
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-2xl font-headline flex-1">Gerenciamento de Equipamentos</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
             <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full sm:w-auto"
                disabled={!isAdmin}
                title={!isAdmin ? 'Ação disponível apenas para administradores' : 'Importar arquivo CSV'}
              >
                 {!isAdmin && <Lock className="mr-2 h-4 w-4" />}
                <FileUp className="mr-2 h-5 w-5" /> Importar CSV
              </Button>
              <Input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportCSV} 
                accept=".csv" 
                className="hidden" 
              />
            <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if (!open) setEditingEquipment(null); }}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="w-full sm:w-auto"
                  disabled={!isAdmin}
                  title={!isAdmin ? 'Ação disponível apenas para administradores' : 'Adicionar Equipamento'}
                >
                  {!isAdmin && <Lock className="mr-2 h-4 w-4" />}
                  <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Equipamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>{editingEquipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}</DialogTitle>
                  <DialogDescription>
                    {editingEquipment ? 'Atualize os detalhes do equipamento.' : 'Preencha as informações do novo equipamento.'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddOrUpdateEquipment)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {equipmentTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Dell, HP, Apple" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: XPS 15 9520, LaserJet M428fdw" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Série</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: ABC123XYZ" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Ex: i7, 16GB RAM, 512GB SSD, Cor Prata" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patrimônio</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 1234567890123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sectorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || NO_SECTOR_VALUE}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um setor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={NO_SECTOR_VALUE}>Nenhum setor</SelectItem>
                              {sectors.sort((a,b) => a.name.localeCompare(b.name)).map(sector => (
                                <SelectItem key={sector.id} value={sector.id}>
                                  {sector.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                         <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit">{editingEquipment ? 'Salvar Alterações' : 'Adicionar Equipamento'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
          <div className="relative w-full sm:flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por tipo, marca, modelo, serial..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterSector || "all"} onValueChange={(value) => setFilterSector(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full sm:flex-1 sm:min-w-0">
               <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              {sectors.sort((a,b) => a.name.localeCompare(b.name)).map(sector => (
                <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           {selectedEquipments.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full sm:flex-1 sm:min-w-0" 
                  disabled={!isAdmin || selectedEquipments.length === 0}
                  title={!isAdmin ? 'Ação disponível apenas para administradores' : 'Excluir Equipamentos Selecionados'}
                >
                  {!isAdmin && <Lock className="mr-2 h-4 w-4" />}
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir ({selectedEquipments.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão Múltipla</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {selectedEquipments.length} equipamento(s) selecionado(s)? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelectedEquipments} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
           <AlertDialog open={isMarkUncheckedDialogOpen} onOpenChange={setIsMarkUncheckedDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full sm:flex-1 sm:min-w-0" 
                onClick={() => { setSectorToMarkUnchecked(undefined); setIsMarkUncheckedDialogOpen(true); }}
                disabled={!isAdmin}
                title={!isAdmin ? 'Ação disponível apenas para administradores' : 'Limpar Conferências'}
              >
                 {!isAdmin && <Lock className="mr-2 h-4 w-4" />}
                <ClipboardX className="mr-2 h-4 w-4" /> Limpar Conferências
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar Status de Conferência</AlertDialogTitle>
                <AlertDialogDescription>
                  Selecione um setor para marcar seus equipamentos como não conferidos, ou "Todos os Setores" para limpar de todos. Esta ação removerá o registro da última conferência.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4 space-y-2">
                <Label htmlFor="select-sector-uncheck">Setor Alvo</Label>
                <Select
                  value={sectorToMarkUnchecked}
                  onValueChange={setSectorToMarkUnchecked}
                >
                  <SelectTrigger id="select-sector-uncheck">
                    <SelectValue placeholder="Selecione um setor ou todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SECTORS_VALUE}>Todos os Setores</SelectItem>
                    {sectors.sort((a,b) => a.name.localeCompare(b.name)).map(sector => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSectorToMarkUnchecked(undefined)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmMarkAsNotChecked}
                  disabled={!sectorToMarkUnchecked}
                  className={cn(!sectorToMarkUnchecked && "bg-destructive/50 hover:bg-destructive/50")}
                >
                  Confirmar Limpeza
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[40px] px-2">
                  {isAdmin && (
                    <Checkbox
                      checked={selectedEquipments.length > 0 && selectedEquipments.length === filteredEquipments.length}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                      aria-label="Selecionar todos"
                      disabled={filteredEquipments.length === 0}
                    />
                  )}
                </TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="hidden sm:table-cell">Modelo</TableHead>
                <TableHead className="hidden md:table-cell">Nº de Série</TableHead>
                <TableHead>Patrimônio</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="hidden lg:table-cell">Data Cadastro</TableHead>
                <TableHead className="hidden lg:table-cell">Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipments.length > 0 ? filteredEquipments.map(equipment => (
                <TableRow
                  key={equipment.id}
                  data-state={selectedEquipments.includes(equipment.id) && "selected"}
                  className={cn(
                    !equipment.lastCheckedTimestamp && 'bg-destructive/10 hover:bg-destructive/15 dark:bg-destructive/20 dark:hover:bg-destructive/25'
                  )}
                >
                  <TableCell className="px-2">
                    {isAdmin && (
                       <Checkbox
                        checked={selectedEquipments.includes(equipment.id)}
                        onCheckedChange={(checked) => handleSelectOne(equipment.id, Boolean(checked))}
                        aria-label={`Selecionar ${equipment.name}`}
                      />
                    )}
                  </TableCell>
                  <TableCell>{equipment.type || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{equipment.name}</TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[150px] truncate">{equipment.model || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[150px] truncate">{equipment.serialNumber || 'N/A'}</TableCell>
                  <TableCell>{equipment.barcode}</TableCell>
                  <TableCell>{equipment.sectorName || 'N/A'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {(() => {
                      const date = toSafeDate(equipment.createdAt);
                      return date ? format(date, 'dd/MM/yyyy') : 'N/A';
                    })()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-xs truncate">{equipment.description || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(equipment)} 
                      className="hover:text-primary"
                      disabled={!isAdmin}
                      title={!isAdmin ? 'Ação disponível apenas para administradores' : 'Editar Equipamento'}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:text-destructive"
                          disabled={!isAdmin}
                          title={!isAdmin ? 'Ação disponível apenas para administradores' : 'Excluir Equipamento'}
                        >
                          <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Excluir</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o equipamento "{equipment.name} ({equipment.type})"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEquipment(equipment.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24">
                    Nenhum equipamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

    
