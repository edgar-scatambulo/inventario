
"use client";

import * as React from 'react';
import { PlusCircle, Edit, Trash2, Search, Filter, FileDown, ClipboardX } from 'lucide-react';
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
import { mockEquipment, mockSectors } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const equipmentTypes = ['Gabinete', 'Impressora', 'Notebook', 'Monitor', 'Switch'];

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

export default function EquipamentosPage() {
  const { toast } = useToast();
  const [equipments, setEquipments] = React.useState<Equipment[]>([]);
  const [sectors, setSectors] = React.useState<Sector[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterSector, setFilterSector] = React.useState<string | undefined>(undefined);

  const [isMarkUncheckedDialogOpen, setIsMarkUncheckedDialogOpen] = React.useState(false);
  const [sectorToMarkUnchecked, setSectorToMarkUnchecked] = React.useState<string | undefined>(undefined);


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
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    if (storedEquipments) {
      setEquipments(JSON.parse(storedEquipments));
    } else {
      setEquipments(mockEquipment);
      localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(mockEquipment));
    }

    const storedSectors = localStorage.getItem(SECTORS_STORAGE_KEY);
    if (storedSectors) {
      setSectors(JSON.parse(storedSectors));
    } else {
      setSectors(mockSectors);
      localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(mockSectors));
    }
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

  const handleAddOrUpdateEquipment = (data: EquipmentFormValues) => {
    const finalSectorId = (data.sectorId === NO_SECTOR_VALUE || data.sectorId === '')
                            ? undefined
                            : data.sectorId;

    const sectorName = sectors.find(s => s.id === finalSectorId)?.name;
    let updatedEquipments: Equipment[];

    if (editingEquipment) {
      updatedEquipments = equipments.map(eq =>
        eq.id === editingEquipment.id 
        ? { ...editingEquipment, 
            type: data.type,
            name: data.name,
            model: data.model,
            serialNumber: data.serialNumber,
            description: data.description, 
            barcode: data.barcode, 
            sectorId: finalSectorId, 
            sectorName 
          } 
        : eq
      );
      toast({ title: 'Sucesso!', description: 'Equipamento atualizado.' });
    } else {
      const newEquipment: Equipment = {
        id: `equip-${Date.now()}`,
        type: data.type,
        name: data.name,
        model: data.model,
        serialNumber: data.serialNumber,
        description: data.description,
        barcode: data.barcode,
        sectorId: finalSectorId,
        sectorName,
      };
      updatedEquipments = [newEquipment, ...equipments];
      toast({ title: 'Sucesso!', description: 'Equipamento adicionado.' });
    }
    setEquipments(updatedEquipments);
    localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(updatedEquipments));
    setIsFormDialogOpen(false);
    setEditingEquipment(null);
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    const updatedEquipments = equipments.filter(eq => eq.id !== equipmentId);
    setEquipments(updatedEquipments);
    localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(updatedEquipments));
    toast({ title: 'Sucesso!', description: 'Equipamento removido.' });
  };

  const openEditDialog = (equipment: Equipment) => {
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
    // Usando um caractere Unicode alto para empurrar valores indefinidos/nulos para o final
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

  const handleExportClick = () => {
    toast({
      title: "Exportação Indisponível",
      description: "A funcionalidade de exportar dados ainda está em desenvolvimento.",
      variant: "default", 
    });
  };

  const handleConfirmMarkAsNotChecked = () => {
    if (!sectorToMarkUnchecked) {
      toast({
        variant: 'destructive',
        title: 'Seleção Necessária',
        description: 'Por favor, selecione um setor ou "Todos os Setores".'
      });
      return;
    }

    const updatedEquipments = equipments.map(eq => {
      if (sectorToMarkUnchecked === ALL_SECTORS_VALUE) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { lastCheckedTimestamp, ...rest } = eq;
        return rest;
      }
      if (eq.sectorId === sectorToMarkUnchecked) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { lastCheckedTimestamp, ...rest } = eq;
        return rest;
      }
      return eq;
    });

    setEquipments(updatedEquipments);
    localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(updatedEquipments));
    
    const sectorName = sectorToMarkUnchecked === ALL_SECTORS_VALUE 
      ? "todos os setores" 
      : sectors.find(s => s.id === sectorToMarkUnchecked)?.name || "setor selecionado";
    
    toast({
      title: 'Sucesso!',
      description: `Equipamentos de ${sectorName} marcados como não conferidos.`
    });
    setIsMarkUncheckedDialogOpen(false);
    setSectorToMarkUnchecked(undefined); 
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <CardTitle className="text-2xl font-headline">Gerenciamento de Equipamentos</CardTitle>
          <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if (!open) setEditingEquipment(null); }}>
            <DialogTrigger asChild>
              <Button variant="default">
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
                            {sectors.map(sector => (
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
              {sectors.map(sector => (
                <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportClick} className="w-full sm:flex-1">
            <FileDown className="mr-2 h-4 w-4" /> Exportar
          </Button>
           <AlertDialog open={isMarkUncheckedDialogOpen} onOpenChange={setIsMarkUncheckedDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:flex-1" onClick={() => { setSectorToMarkUnchecked(undefined); setIsMarkUncheckedDialogOpen(true); }}>
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
                    {sectors.map(sector => (
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
                <TableHead>Tipo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead className="hidden sm:table-cell">Modelo</TableHead>
                <TableHead className="hidden md:table-cell">Nº de Série</TableHead>
                <TableHead>Patrimônio</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="hidden lg:table-cell">Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipments.length > 0 ? filteredEquipments.map(equipment => (
                <TableRow
                  key={equipment.id}
                  className={cn(
                    !equipment.lastCheckedTimestamp && 'bg-destructive/10 hover:bg-destructive/15 dark:bg-destructive/20 dark:hover:bg-destructive/25'
                  )}
                >
                  <TableCell>{equipment.type || 'N/A'}</TableCell>
                  <TableCell className="font-medium">{equipment.name}</TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[150px] truncate">{equipment.model || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[150px] truncate">{equipment.serialNumber || 'N/A'}</TableCell>
                  <TableCell>{equipment.barcode}</TableCell>
                  <TableCell>{equipment.sectorName || 'N/A'}</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-xs truncate">{equipment.description || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(equipment)} className="hover:text-primary">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-destructive">
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
                  <TableCell colSpan={8} className="text-center h-24">
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

