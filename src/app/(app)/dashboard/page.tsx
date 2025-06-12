
"use client";
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, ScanBarcode, FileText, ArrowRight, PieChart as PieChartIcon, AlertTriangle, BarChartHorizontalBig } from "lucide-react";
import type { Equipment, Sector } from '@/lib/types';
import { mockEquipment, mockSectors } from '@/lib/mock-data'; 

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'; 
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";

const quickAccessItems = [
  { title: "Cadastrar Equipamento", href: "/equipamentos", icon: Package, description: "Adicione novos itens ao inventário." },
  { title: "Conferir Inventário", href: "/conferencia", icon: ScanBarcode, description: "Realize a checagem rápida de itens." },
  { title: "Ver Relatórios", href: "/relatorios", icon: FileText, description: "Visualizar relatório completo." },
];

const EQUIPMENTS_STORAGE_KEY = 'localStorage_equipments';
const SECTORS_STORAGE_KEY = 'localStorage_sectors';

const conferenceChartConfig = {
  conferidos: { 
    label: "Conferidos",
    theme: {
      light: "hsl(220, 70%, 50%)", // Azul
      dark: "hsl(220, 70%, 65%)",  // Azul mais claro para modo escuro
    },
  },
  naoConferidos: { 
    label: "Não Conferidos",
    theme: {
      light: "hsl(0, 80%, 60%)",   // Vermelho
      dark: "hsl(0, 75%, 55%)",    // Vermelho mais claro para modo escuro
    },
  },
} satisfies ChartConfig;

const equipmentsBySectorChartConfig = {
  count: {
    label: "Equipamentos",
    theme: {
      light: "hsl(var(--chart-1))", // Using a predefined theme color
      dark: "hsl(var(--chart-1))",
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
  const [allEquipments, setAllEquipmentsLocal] = React.useState<Equipment[]>([]);
  const [totalEquipments, setTotalEquipments] = React.useState<number>(0);
  const [totalSectors, setTotalSectors] = React.useState<number>(0);
  const [itemsCheckedTodayCount, setItemsCheckedTodayCount] = React.useState<number>(0);
  const [itemsNotCheckedCount, setItemsNotCheckedCount] = React.useState<number>(0);
  const [conferenceChartData, setConferenceChartData] = React.useState<Array<{ category: keyof typeof conferenceChartConfig; value: number; fill: string }>>([]);
  const [equipmentsBySectorData, setEquipmentsBySectorData] = React.useState<Array<{ name: string; count: number }>>([]);

  React.useEffect(() => {
    let equipments: Equipment[] = [];
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    if (storedEquipments) {
      try {
        equipments = JSON.parse(storedEquipments);
      } catch (e) {
        console.error("Failed to parse equipments from localStorage", e);
        equipments = mockEquipment; 
      }
    } else {
      equipments = mockEquipment; 
    }
    setAllEquipmentsLocal(equipments);
    setTotalEquipments(equipments.length);

    let checkedToday = 0;
    let totalConferenced = 0;
    let totalNotConferencedInEffect = 0;

    equipments.forEach(eq => {
      if (eq.lastCheckedTimestamp) {
        totalConferenced++;
        if (isTimestampToday(eq.lastCheckedTimestamp)) {
          checkedToday++;
        }
      } else {
        totalNotConferencedInEffect++;
      }
    });
    setItemsCheckedTodayCount(checkedToday);
    setItemsNotCheckedCount(totalNotConferencedInEffect);
    
    setConferenceChartData([
      { category: "conferidos", value: totalConferenced, fill: 'var(--color-conferidos)' },
      { category: "naoConferidos", value: totalNotConferencedInEffect, fill: 'var(--color-naoConferidos)' },
    ]);

    const sectorCounts: { [key: string]: number } = {};
    equipments.forEach(eq => {
      const sectorName = eq.sectorName || "Não Atribuído";
      sectorCounts[sectorName] = (sectorCounts[sectorName] || 0) + 1;
    });

    const bySectorData = Object.entries(sectorCounts).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count); 
    setEquipmentsBySectorData(bySectorData);


    const storedSectors = localStorage.getItem(SECTORS_STORAGE_KEY);
    if (storedSectors) {
      try {
        const sectors: Sector[] = JSON.parse(storedSectors);
        setTotalSectors(sectors.length);
      } catch (e) {
        console.error("Failed to parse sectors from localStorage", e);
        setTotalSectors(mockSectors.length); 
      }
    } else {
      setTotalSectors(mockSectors.length); 
    }
  }, []);

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
          {/* Image removed from here */}
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
              <span className="font-medium">Total de Equipamentos:</span>
              <span className="text-xl font-bold text-primary">{totalEquipments}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium">Total de Setores:</span>
              <span className="text-xl font-bold text-primary">{totalSectors}</span>
            </div>
             <div className="flex justify-between items-center p-3 bg-accent/10 rounded-md border border-accent">
              <span className="font-medium text-accent-foreground">Itens Conferidos Hoje:</span>
              <span className="text-xl font-bold text-accent-foreground">{itemsCheckedTodayCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-md border border-destructive/50">
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive/80" />
                <span className="font-medium text-foreground">Não Conferidos:</span>
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
            <CardDescription>Equipamentos conferidos vs. não conferidos no inventário total.</CardDescription>
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
                <p className="text-sm text-muted-foreground">Adicione equipamentos para ver o status da conferência.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartHorizontalBig className="mr-2 h-6 w-6 text-primary" />
              Equipamentos por Setor
            </CardTitle>
            <CardDescription>Quantitativo de equipamentos em cada setor.</CardDescription>
          </CardHeader>
          <CardContent>
            {equipmentsBySectorData.length > 0 ? (
              <ChartContainer config={equipmentsBySectorChartConfig} className="mx-auto aspect-square max-h-[280px] sm:max-h-[300px]">
                <BarChart data={equipmentsBySectorData} layout="vertical" margin={{ top: 5, right: 20, left: 25, bottom: 5 }}>
                  <CartesianGrid horizontal={false} vertical={true} strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="count" tickFormatter={(value) => value.toString()} allowDecimals={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80} 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                    interval={0} 
                  />
                  <ChartTooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent 
                                formatter={(value, nameKey, entry) => { // value is count, entry.payload.name is sector name
                                    return [`${value} itens`, `Setor: ${entry.payload.name}`];
                                }}
                                indicator="dot" 
                             />}
                  />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-center">
                <BarChartHorizontalBig className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum equipamento para exibir.</p>
                <p className="text-sm text-muted-foreground">Cadastre equipamentos e atribua-os a setores.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    