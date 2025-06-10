
"use client";

import * as React from 'react';
import { ScanBarcode, CheckCircle2, XCircle, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Equipment } from '@/lib/types';
import { mockEquipment } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

const EQUIPMENTS_STORAGE_KEY = 'localStorage_equipments';

export default function ConferenciaPage() {
  const { toast } = useToast();
  const [allEquipment, setAllEquipment] = React.useState<Equipment[]>([]);
  const [barcode, setBarcode] = React.useState('');
  const [checkedEquipment, setCheckedEquipment] = React.useState<Equipment | null | 'not_found'>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    if (storedEquipments) {
      setAllEquipment(JSON.parse(storedEquipments));
    } else {
      setAllEquipment(mockEquipment);
      localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(mockEquipment));
    }
  }, []);

  const handleCheckBarcode = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!barcode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Entrada Inválida',
        description: 'Por favor, insira um código de barras.',
      });
      return;
    }

    setIsLoading(true);
    setCheckedEquipment(null);
    await new Promise(resolve => setTimeout(resolve, 700));

    const foundEquipment = allEquipment.find(eq => eq.barcode === barcode.trim());

    if (foundEquipment) {
      const now = Date.now();
      const updatedEquipments = allEquipment.map(eq =>
        eq.id === foundEquipment.id
          ? { ...eq, lastCheckedTimestamp: now }
          : eq
      );
      setAllEquipment(updatedEquipments);
      localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(updatedEquipments));

      setCheckedEquipment({ ...foundEquipment, lastCheckedTimestamp: now });
      toast({
        title: 'Equipamento Conferido!',
        description: `${foundEquipment.name} localizado no setor ${foundEquipment.sectorName || 'N/A'}. Conferência registrada.`,
        className: 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
      });
    } else {
      setCheckedEquipment('not_found');
      toast({
        variant: 'destructive',
        title: 'Não Encontrado',
        description: 'Nenhum equipamento encontrado com este código de barras.',
      });
    }
    setIsLoading(false);
    setBarcode(''); 
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setBarcode('');
    setCheckedEquipment(null);
    setIsLoading(false);
    inputRef.current?.focus();
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <ScanBarcode className="mx-auto h-16 w-16 text-primary mb-2" />
          <CardTitle className="text-3xl font-headline">Conferência de Inventário</CardTitle>
          <CardDescription>
            Use um leitor de código de barras ou digite o código para verificar um equipamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCheckBarcode} className="flex flex-col sm:flex-row items-start gap-3">
            <div className="w-full flex-grow">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ler ou digitar código de barras..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="h-12 text-lg focus:ring-2 focus:ring-primary"
                aria-label="Código de Barras"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto h-12 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RotateCcw className="mr-2 h-5 w-5 animate-spin" /> Verificando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" /> Conferir
                </>
              )}
            </Button>
          </form>

          {isLoading && (
            <div className="text-center p-6">
              <RotateCcw className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Procurando equipamento...</p>
            </div>
          )}
          
          {checkedEquipment && !isLoading && (
            <Card 
              className={`mt-6 p-6 transition-all duration-300 ease-in-out transform animate-in fade-in zoom-in-95
                ${checkedEquipment === 'not_found' ? 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700' 
                                                   : 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700'}`}
            >
              {checkedEquipment === 'not_found' ? (
                <div className="flex flex-col items-center text-center text-red-600 dark:text-red-400">
                  <XCircle className="h-12 w-12 mb-3" />
                  <h3 className="text-xl font-semibold">Equipamento Não Encontrado</h3>
                  <p className="text-sm">Verifique o código de barras e tente novamente.</p>
                </div>
              ) : (
                <div className="space-y-3 text-green-700 dark:text-green-300">
                   <div className="flex flex-col items-center text-center">
                    <CheckCircle2 className="h-12 w-12 mb-3" />
                    <h3 className="text-xl font-semibold">Equipamento Encontrado e Conferido!</h3>
                  </div>
                  <div><strong>Nome:</strong> {checkedEquipment.name}</div>
                  <div><strong>Descrição:</strong> {checkedEquipment.description || 'N/A'}</div>
                  <div><strong>Código de Barras:</strong> {checkedEquipment.barcode}</div>
                  <div><strong>Setor:</strong> {checkedEquipment.sectorName || 'Não atribuído'}</div>
                  {checkedEquipment.lastCheckedTimestamp && (
                     <div><strong>Última Conferência:</strong> {new Date(checkedEquipment.lastCheckedTimestamp).toLocaleString()}</div>
                  )}
                </div>
              )}
               <Button onClick={handleReset} variant="outline" className="w-full mt-6">
                <RotateCcw className="mr-2 h-4 w-4" /> Nova Conferência
              </Button>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
