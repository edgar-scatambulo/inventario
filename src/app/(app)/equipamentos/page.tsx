
"use client";

import * as React from 'react';
import { PlusCircle, Edit, Trash2, Search, Filter, FileDown } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import type { Equipment, Sector } from '@/lib/types';
import { mockEquipment, mockSectors } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

const equipmentFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().optional(),
  barcode: z.string().min(5, { message: 'Código de barras deve ter pelo menos 5 caracteres.' }),
  sectorId: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

const EQUIPMENTS_STORAGE_KEY = 'localStorage_equipments';
const SECTORS_STORAGE_KEY = 'localStorage_sectors';

export default function EquipamentosPage() {
  const { toast } = useToast();
  const [equipments, setEquipments] = React.useState<Equipment[]>([]);
  const [sectors, setSectors] = React.useState<Sector[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingEquipment, setEditingEquipment] = React.useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterSector, setFilterSector] = React.useState<string | undefined>(undefined);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: '',
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
      // Initialize sectors from mock if not in localStorage,
      // assuming setores/page.tsx is the main place to manage/initialize them.
      setSectors(mockSectors);
      localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(mockSectors));
    }
  }, []);

  React.useEffect(() => {
    if (editingEquipment) {
      form.reset({
        name: editingEquipment.name,
        description: editingEquipment.description,
        barcode: editingEquipment.barcode,
        sectorId: editingEquipment.sectorId,
      });
    } else {
      form.reset({ name: '', description: '', barcode: '', sectorId: '' });
    }
  }, [editingEquipment, form, isDialogOpen]);

  const handleAddOrUpdateEquipment = (data: EquipmentFormValues) => {
    const sectorName = sectors.find(s => s.id === data.sectorId)?.name;
    let updatedEquipments: Equipment[];

    if (editingEquipment) {
      updatedEquipments = equipments.map(eq =>
        eq.id === editingEquipment.id ? { ...editingEquipment, ...data, sectorName } : eq
      );
      toast({ title: 'Sucesso!', description: 'Equipamento atualizado.' });
    } else {
      const newEquipment: Equipment = {
        id: `equip-${Date.now()}`,
        ...data,
        sectorName,
      };
      updatedEquipments = [newEquipment, ...equipments];
      toast({ title: 'Sucesso!', description: 'Equipamento adicionado.' });
    }
    setEquipments(updatedEquipments);
    localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(updatedEquipments));
    setIsDialogOpen(false);
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
    setIsDialogOpen(true);
  };
  
  const filteredEquipments = equipments.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          eq.barcode.includes(searchTerm) ||
                          (eq.description && eq.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSector = (filterSector && filterSector !== 'all') ? eq.sectorId === filterSector : true;
    return matchesSearch && matchesSector;
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <CardTitle className="text-2xl font-headline">Gerenciamento de Equipamentos</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEquipment(null); }}>
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Equipamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Notebook Dell XPS 15" {...field} />
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
                        <FormLabel>Descrição (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ex: i7, 16GB RAM, 512GB SSD, Placa de vídeo RTX 3050" {...field} />
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
                        <FormLabel>Código de Barras</FormLabel>
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
                        <FormLabel>Setor (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um setor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhum setor</SelectItem>
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
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, código de barras..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterSector} onValueChange={(value) => setFilterSector(value === "all" ? undefined : value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código de Barras</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipments.length > 0 ? filteredEquipments.map(equipment => (
                <TableRow key={equipment.id}>
                  <TableCell className="font-medium">{equipment.name}</TableCell>
                  <TableCell>{equipment.barcode}</TableCell>
                  <TableCell>{equipment.sectorName || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">{equipment.description || 'N/A'}</TableCell>
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
                            Tem certeza que deseja excluir o equipamento "{equipment.name}"? Esta ação não pode ser desfeita.
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
                  <TableCell colSpan={5} className="text-center h-24">
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

    