
"use client";

import * as React from 'react';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
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
  DialogClose
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Sector, Equipment } from '@/lib/types';
import { mockSectors } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

const sectorFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome do setor deve ter pelo menos 2 caracteres.' }),
});

type SectorFormValues = z.infer<typeof sectorFormSchema>;

const SECTORS_STORAGE_KEY = 'localStorage_sectors';
const EQUIPMENTS_STORAGE_KEY = 'localStorage_equipments';


export default function SetoresPage() {
  const { toast } = useToast();
  const [sectors, setSectors] = React.useState<Sector[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingSector, setEditingSector] = React.useState<Sector | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const form = useForm<SectorFormValues>({
    resolver: zodResolver(sectorFormSchema),
    defaultValues: {
      name: '',
    },
  });

  React.useEffect(() => {
    const storedSectors = localStorage.getItem(SECTORS_STORAGE_KEY);
    if (storedSectors) {
      setSectors(JSON.parse(storedSectors));
    } else {
      setSectors(mockSectors);
      localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(mockSectors));
    }
  }, []);
  
  React.useEffect(() => {
    if (editingSector) {
      form.reset({ name: editingSector.name });
    } else {
      form.reset({ name: '' });
    }
  }, [editingSector, form, isDialogOpen]);


  const handleAddOrUpdateSector = (data: SectorFormValues) => {
    let updatedSectors: Sector[];
    if (editingSector) {
      updatedSectors = sectors.map(sec => (sec.id === editingSector.id ? { ...editingSector, ...data } : sec));
      toast({ title: 'Sucesso!', description: 'Setor atualizado.' });
    } else {
      const newSector: Sector = {
        id: `sector-${Date.now()}`,
        ...data,
      };
      updatedSectors = [newSector, ...sectors];
      toast({ title: 'Sucesso!', description: 'Setor adicionado.' });
    }
    setSectors(updatedSectors);
    localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(updatedSectors));
    setIsDialogOpen(false);
    setEditingSector(null);
  };

  const handleDeleteSector = (sectorId: string) => {
    const equipmentsData = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    const currentEquipments: Equipment[] = equipmentsData ? JSON.parse(equipmentsData) : [];
    
    const isSectorInUse = currentEquipments.some(eq => eq.sectorId === sectorId);

    if (isSectorInUse) {
      toast({
        variant: "destructive",
        title: "Erro ao Excluir Setor",
        description: "Este setor está atribuído a um ou mais equipamentos. Remova a atribuição antes de excluir.",
      });
      return;
    }
    
    const updatedSectors = sectors.filter(sec => sec.id !== sectorId);
    setSectors(updatedSectors);
    localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(updatedSectors));
    toast({ title: 'Sucesso!', description: 'Setor removido.' });
  };

  const openEditDialog = (sector: Sector) => {
    setEditingSector(sector);
    setIsDialogOpen(true);
  };

  const filteredSectors = React.useMemo(() => {
    return sectors
      .filter(sector =>
        sector.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [sectors, searchTerm]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <CardTitle className="text-2xl font-headline">Gerenciamento de Setores</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingSector(null); }}>
            <DialogTrigger asChild>
              <Button variant="default">
                <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Setor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingSector ? 'Editar Setor' : 'Adicionar Novo Setor'}</DialogTitle>
                <DialogDescription>
                 {editingSector ? 'Atualize o nome do setor.' : 'Insira o nome do novo setor.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddOrUpdateSector)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Setor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Departamento de TI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                     <DialogClose asChild>
                       <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">{editingSector ? 'Salvar Alterações' : 'Adicionar Setor'}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
         <div className="mt-4 relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar setor..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Setor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSectors.length > 0 ? filteredSectors.map(sector => (
                <TableRow key={sector.id}>
                  <TableCell className="font-medium">{sector.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(sector)} className="hover:text-primary">
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
                            Tem certeza que deseja excluir o setor "{sector.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSector(sector.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                  <TableCell colSpan={2} className="text-center h-24">
                    Nenhum setor encontrado.
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

    
