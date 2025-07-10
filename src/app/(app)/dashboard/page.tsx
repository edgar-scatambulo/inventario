
"use client";
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, ScanBarcode, FileText, ArrowRight, PieChart as PieChartIcon, AlertTriangle, BarChartBig } from "lucide-react";
import type { Equipment, Sector } from '@/lib/types';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'; 
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase-config';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(app);

const quickAccessItems = [
  { title: "Cadastrar Equipamento", href: "/equipamentos", icon: Package, description: "Adicione novos itens." },
  { title: "Conferir Inventário", href: "/conferencia", icon: ScanBarcode, description: "Realizar conferência." },
  { title: "Ver Relatórios", href: "/relatorios", icon: FileText, description: "Visualizar relatório completo." },
];

const conferenceChartConfig = {
  conferidos: { 
    label: "Conferidos",
    theme: {
      light: "hsl(220, 70%, 50%)", 
      dark: "hsl(220, 70%, 65%)",  
    },
  },
  naoConferidos: { 
    label: "Não Conferidos",
    theme: {
      light: "hsl(0, 80%, 60%)",   
      dark: "hsl(0, 75%, 55%)",    
    },
  },
} satisfies ChartConfig;

const equipmentsBySectorChartConfig = {
  conferidos: {
    label: "Conferidos",
    theme: {
      light: "hsl(220, 70%, 50%)", 
      dark: "hsl(220, 70%, 65%)",
    },
  },
  naoConferidos: {
    label: "Não Conferidos",
    theme: {
      light: "hsl(0, 80%, 60%)",   
      dark: "hsl(0, 75%, 55%)",
    },
  },
} satisfies ChartConfig;

const isTimestampToday = (timestamp?: number): boolean => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [totalEquipments, setTotalEquipments] = React.useState<number>(0);
  const [totalSectors, setTotalSectors] = React.useState<number>(0);
  const [itemsCheckedTodayCount, setItemsCheckedTodayCount] = React.useState<number>(0);
  const [itemsNotCheckedCount, setItemsNotCheckedCount] = React.useState<number>(0);
  const [conferenceChartData, setConferenceChartData] = React.useState<Array<{ category: keyof typeof conferenceChartConfig; value: number; fill: string }>>([]);
  const [equipmentsBySectorData, setEquipmentsBySectorData] = React.useState<Array<{ name: string; conferidos: number; naoConferidos: number }>>([]);

  React.useEffect(() => {
    // Listen for sectors
    const qSectors = collection(db, "sectors");
    const unsubscribeSectors = onSnapshot(qSectors, (querySnapshot) => {
        setTotalSectors(querySnapshot.size);
    }, (error) => {
        console.error("Error fetching sectors count: ", error);
        toast({ variant: 'destructive', title: 'Erro de Conexão', description: 'Não foi possível buscar os dados de setores.' });
    });

    // Listen for equipments and compute all stats
    const qEquipments = collection(db, "equipments");
    const unsubscribeEquipments = onSnapshot(qEquipments, (querySnapshot) => {
        const equipments: Equipment[] = [];
        querySnapshot.forEach((doc) => {
            equipments.push({ id: doc.id, ...doc.data() } as Equipment);
        });
        
        setTotalEquipments(equipments.length);

        let checkedToday = 0;
        let totalOverallConferenced = 0;
        let totalOverallNotConferenced = 0;

        equipments.forEach(eq => {
            if (eq.lastCheckedTimestamp) {
                totalOverallConferenced++;
                // Firestore Timestamps are objects, so we need to convert to milliseconds
                const timestampInMillis = typeof eq.lastCheckedTimestamp === 'object' && eq.lastCheckedTimestamp.toMillis ? eq.lastCheckedTimestamp.toMillis() : eq.lastCheckedTimestamp;
                if (isTimestampToday(timestampInMillis)) {
                    checkedToday++;
                }
            } else {
                totalOverallNotConferenced++;
            }
        });
        setItemsCheckedTodayCount(checkedToday);
        setItemsNotCheckedCount(totalOverallNotConferenced);

        setConferenceChartData([
            { category: "conferidos", value: totalOverallConferenced, fill: 'var(--color-conferidos)' },
            { category: "naoConferidos", value: totalOverallNotConferenced, fill: 'var(--color-naoConferidos)' },
        ]);

        const sectorAggregates: { [key: string]: { conferidos: number; naoConferidos: number } } = {};
        equipments.forEach(eq => {
            const sectorName = eq.sectorName || "Não Atribuído";
            if (!sectorAggregates[sectorName]) {
                sectorAggregates[sectorName] = { conferidos: 0, naoConferidos: 0 };
            }
            if (eq.lastCheckedTimestamp) {
                sectorAggregates[sectorName].conferidos++;
            } else {
                sectorAggregates[sectorName].naoConferidos++;
            }
        });

        const bySectorData = Object.entries(sectorAggregates)
            .map(([name, counts]) => ({
                name,
                conferidos: counts.conferidos,
                naoConferidos: counts.naoConferidos,
            }))
            .sort((a, b) => (b.conferidos + b.naoConferidos) - (a.conferidos + a.naoConferidos)); 
        setEquipmentsBySectorData(bySectorData);

    }, (error) => {
        console.error("Error fetching equipments: ", error);
        toast({ variant: 'destructive', title: 'Erro de Conexão', description: 'Não foi possível buscar os dados de equipamentos.' });
    });

    return () => {
        unsubscribeSectors();
        unsubscribeEquipments();
    };
  }, [toast]);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Bem-vindo ao Controle de Inventário!</CardTitle>
          <CardDescription className="text-lg">
            Sua solução completa para gerenciamento de inventário. Comece organizando seus equipamentos e setores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Image removed */}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-6 text-2xl font-semibold text-foreground">Acesso Rápido</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickAccessItems.map((item) => (
            <Card key={item.title} className="transform transition-all hover:scale-105 hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-medium">{item.title}</CardTitle>
                <item.icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={item.href}>
                    Acessar <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle>Resumo do Inventário</CardTitle>
            <CardDescription>Visão geral dos seus ativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium text-foreground">Total de Equipamentos:</span>
              <span className="text-xl font-bold text-foreground">{totalEquipments}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium text-foreground">Total de Setores:</span>
              <span className="text-xl font-bold text-foreground">{totalSectors}</span>
            </div>
             <div className="flex justify-between items-center p-3 bg-accent/10 rounded-md border border-accent">
              <span className="font-medium text-accent-foreground">Itens Conferidos Hoje:</span>
              <span className="text-xl font-bold text-accent-foreground">{itemsCheckedTodayCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-md border border-destructive/50">
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive/80" />
                <span className="font-medium text-foreground">Não Conferidos (Total):</span>
              </div>
              <span className="text-xl font-bold text-foreground">{itemsNotCheckedCount}</span>
            </div>
             <Button asChild className="w-full mt-4">
              <Link href="/equipamentos">Ver Inventário Completo</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="mr-2 h-6 w-6 text-primary" />
              Status da Conferência
            </CardTitle>
            <CardDescription>Total de equipamentos conferidos vs. não conferidos.</CardDescription>
          </CardHeader>
          <CardContent>
            {totalEquipments > 0 ? (
               <ChartContainer config={conferenceChartConfig} className="mx-auto aspect-square max-h-[280px] sm:max-h-[300px]">
                <PieChart>
                  <ChartTooltip
                    cursor={true} 
                    content={<ChartTooltipContent 
                                formatter={(value, name) => {
                                  const configEntry = conferenceChartConfig[name as keyof typeof conferenceChartConfig];
                                  return [`${value}`, configEntry.label]; 
                                }}
                                indicator="dot" 
                             />}
                  />
                  <Pie
                    data={conferenceChartData}
                    dataKey="value"
                    nameKey="category" 
                    innerRadius={60} 
                    outerRadius={100} 
                    strokeWidth={2}
                    labelLine={false}
                    label={({ value, percent, x, y, midAngle, name, cx, cy, innerRadius: pieInnerRadius, outerRadius: pieOuterRadius }) => {
                       if (value === 0) return null; 
                       const nonZeroSlices = conferenceChartData.filter(d => d.value > 0).length;
                       if (percent < 0.08 && nonZeroSlices > 1) return null; 
                       
                       return (
                        <text
                          x={x} 
                          y={y} 
                          fill="hsl(var(--card-foreground))" 
                          textAnchor="middle" 
                          dominantBaseline="central"
                          className="text-sm font-semibold"
                        >
                          {`${value}`}
                        </text>
                      );
                    }}
                  >
                    {conferenceChartData.map((entry) => (
                      <Cell key={`cell-${entry.category}`} fill={entry.fill} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-center">
                <PieChartIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum equipamento cadastrado.</p>
                <p className="text-sm text-muted-foreground">Adicione equipamentos para ver o status.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartBig className="mr-2 h-6 w-6 text-primary" />
              Equipamentos por Setor
            </CardTitle>
            <CardDescription>Conferidos vs. Não Conferidos por setor.</CardDescription>
          </CardHeader>
          <CardContent>
            {equipmentsBySectorData.length > 0 ? (
              <ChartContainer config={equipmentsBySectorChartConfig} className="mx-auto w-full h-[360px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={equipmentsBySectorData} 
                    margin={{ top: 5, right: 20, left: -10, bottom: equipmentsBySectorData.length > 4 ? 60 : 25 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                      interval={0} 
                      angle={equipmentsBySectorData.length > 4 ? -35 : 0}
                      textAnchor={equipmentsBySectorData.length > 4 ? "end" : "middle"}
                      height={equipmentsBySectorData.length > 4 ? 50 : 30}
                    />
                    <YAxis 
                      type="number" 
                      allowDecimals={false}
                      tickFormatter={(value) => value.toString()}
                      width={40}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2.5 shadow-sm min-w-[180px]">
                              <p className="mb-1.5 text-center font-medium">{label}</p>
                              {payload.map((entry, index) => (
                                <div key={`item-${index}`} className="flex justify-between items-center text-sm mb-0.5">
                                  <span style={{ color: entry.color }}>
                                    {equipmentsBySectorChartConfig[entry.dataKey as keyof typeof equipmentsBySectorChartConfig]?.label || entry.name}:
                                  </span>
                                  <span className="font-semibold ml-2">{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="conferidos" stackId="a" fill="var(--color-conferidos)" radius={[4, 4, 0, 0]} barSize={equipmentsBySectorData.length > 8 ? 20 : 30} />
                    <Bar dataKey="naoConferidos" stackId="a" fill="var(--color-naoConferidos)" radius={[4, 4, 0, 0]} barSize={equipmentsBySectorData.length > 8 ? 20 : 30} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[360px] sm:h-[400px] text-center">
                <BarChartBig className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum equipamento para exibir.</p>
                <p className="text-sm text-muted-foreground">Cadastre equipamentos, atribua-os a setores e confira-os.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
    
