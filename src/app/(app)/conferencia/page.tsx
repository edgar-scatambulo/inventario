
"use client";

import * as React from 'react';
import { ScanBarcode, CheckCircle2, XCircle, Search, RotateCcw, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Equipment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, getDoc, writeBatch, serverTimestamp, Timestamp, collection, onSnapshot } from "firebase/firestore";
import { app } from '@/lib/firebase-config';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const EQUIPMENTS_STORAGE_KEY = 'localStorage_equipments';
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

export default function ConferenciaPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [allEquipment, setAllEquipment] = React.useState<Equipment[]>([]);
  const [barcode, setBarcode] = React.useState('');
  const [checkedEquipment, setCheckedEquipment] = React.useState<Equipment | null | 'not_found'>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // This now listens for real-time updates from Firestore
    const q = collection(db, "equipments");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
        // Also update localStorage for quick lookups
        localStorage.setItem(EQUIPMENTS_STORAGE_KEY, JSON.stringify(equipmentsData));
    }, (error) => {
        console.error("Error fetching real-time equipments for conference: ", error);
        toast({
            variant: "destructive",
            title: "Erro de Conexão",
            description: "Não foi possível carregar os equipamentos do banco de dados.",
        });
    });

    return () => unsubscribe();
  }, [toast]);


  const handleCheckBarcode = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem permissão para realizar esta ação.' });
      return;
    }
    if (!barcode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Entrada Inválida',
        description: 'Por favor, insira um código de barras.',
      });
      return;
    }
    if (!user) {
        toast({
        variant: 'destructive',
        title: 'Usuário não autenticado',
        description: 'Por favor, faça login para conferir equipamentos.',
      });
      return;
    }

    setIsLoading(true);
    setCheckedEquipment(null);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency

    const foundEquipmentInCache = allEquipment.find(eq => eq.barcode === barcode.trim());

    if (foundEquipmentInCache) {
      try {
        const batch = writeBatch(db);
        const conferenceTimestamp = Timestamp.now();

        // 1. Update the equipment document
        const equipmentRef = doc(db, "equipments", foundEquipmentInCache.id);
        batch.update(equipmentRef, { lastCheckedTimestamp: conferenceTimestamp });

        // 2. Create a new document in the 'conferences' collection
        const conferenceRef = doc(collection(db, "conferences"));
        batch.set(conferenceRef, {
          equipmentId: foundEquipmentInCache.id,
          barcode: foundEquipmentInCache.barcode,
          equipmentName: foundEquipmentInCache.name,
          equipmentType: foundEquipmentInCache.type || 'N/A',
          sectorId: foundEquipmentInCache.sectorId || null,
          sectorName: foundEquipmentInCache.sectorName || 'Não atribuído',
          userId: user.uid,
          userEmail: user.email,
          timestamp: conferenceTimestamp,
        });

        await batch.commit();
        
        // No need to update local state manually, onSnapshot will do it.
        const updatedEquipmentFromState = { ...foundEquipmentInCache, lastCheckedTimestamp: conferenceTimestamp.toMillis() };
        setCheckedEquipment(updatedEquipmentFromState);
        
        toast({
          title: 'Equipamento Conferido!',
          description: `${foundEquipmentInCache.type || ''} ${foundEquipmentInCache.name} localizado no setor ${foundEquipmentInCache.sectorName || 'N/A'}. Conferência registrada com sucesso.`,
          className: 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
        });

      } catch (error) {
        console.error("Error committing conference to Firestore: ", error);
        toast({
          variant: 'destructive',
          title: 'Erro no Servidor',
          description: 'Não foi possível registrar a conferência. Verifique sua conexão e as permissões do Firestore.',
        });
      }

    } else {
      setCheckedEquipment('not_found');
      toast({
        variant: 'destructive',
        title: 'Não Encontrado',
        description: 'Nenhum equipamento encontrado com este código de barras no cache local.',
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
            Use um leitor ou digite o código do Patrimônio para conferir equipamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isAdmin && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle>Acesso Restrito</AlertTitle>
              <AlertDescription>
                Apenas administradores podem registrar conferências de inventário.
              </AlertDescription>
            </Alert>
          )}
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
                disabled={!isAdmin}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto h-12 text-base" disabled={isLoading || !user || !isAdmin}>
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
              <p className="mt-2 text-muted-foreground">Procurando equipamento e registrando...</p>
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
                  <div><strong>Tipo:</strong> {checkedEquipment.type || 'N/A'}</div>
                  <div><strong>Marca:</strong> {checkedEquipment.name}</div>
                  <div><strong>Modelo:</strong> {checkedEquipment.model || 'N/A'}</div>
                  <div><strong>Nº de Série:</strong> {checkedEquipment.serialNumber || 'N/A'}</div>
                  <div><strong>Descrição:</strong> {checkedEquipment.description || 'N/A'}</div>
                  <div><strong>Patrimônio:</strong> {checkedEquipment.barcode}</div>
                  <div><strong>Setor:</strong> {checkedEquipment.sectorName || 'Não atribuído'}</div>
                  {checkedEquipment.lastCheckedTimestamp && (
                     <div>
                        <strong>Última Conferência:</strong> {(() => {
                           const date = toSafeDate(checkedEquipment.lastCheckedTimestamp);
                           return date ? date.toLocaleString() : 'N/A';
                        })()}
                     </div>
                  )}
                </div>
              )}
               <Button onClick={handleReset} variant="outline" className="w-full mt-6" disabled={!isAdmin}>
                <RotateCcw className="mr-2 h-4 w-4" /> Nova Conferência
              </Button>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
