
"use client";
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Warehouse, ScanBarcode, FileText, ArrowRight } from "lucide-react";
import Image from "next/image";
import type { Equipment, Sector } from '@/lib/types';
import { mockEquipment, mockSectors } from '@/lib/mock-data'; // Fallback data

const quickAccessItems = [
  { title: "Cadastrar Equipamento", href: "/equipamentos", icon: Package, description: "Adicione novos itens ao inventário." },
  { title: "Gerenciar Setores", href: "/setores", icon: Warehouse, description: "Equipamentos por setor." },
  { title: "Conferir Inventário", href: "/conferencia", icon: ScanBarcode, description: "Realize a checagem rápida de itens." },
  { title: "Ver Relatórios", href: "/relatorios", icon: FileText, description: "Visualizar relatório completo." },
];

const EQUIPMENTS_STORAGE_KEY = 'localStorage_equipments';
const SECTORS_STORAGE_KEY = 'localStorage_sectors';

export default function DashboardPage() {
  const [totalEquipments, setTotalEquipments] = React.useState<number>(0);
  const [totalSectors, setTotalSectors] = React.useState<number>(0);

  React.useEffect(() => {
    const storedEquipments = localStorage.getItem(EQUIPMENTS_STORAGE_KEY);
    if (storedEquipments) {
      try {
        const equipments: Equipment[] = JSON.parse(storedEquipments);
        setTotalEquipments(equipments.length);
      } catch (e) {
        console.error("Failed to parse equipments from localStorage", e);
        setTotalEquipments(mockEquipment.length); // Fallback
      }
    } else {
      setTotalEquipments(mockEquipment.length); // Fallback if nothing in localStorage
    }

    const storedSectors = localStorage.getItem(SECTORS_STORAGE_KEY);
    if (storedSectors) {
      try {
        const sectors: Sector[] = JSON.parse(storedSectors);
        setTotalSectors(sectors.length);
      } catch (e) {
        console.error("Failed to parse sectors from localStorage", e);
        setTotalSectors(mockSectors.length); // Fallback
      }
    } else {
      setTotalSectors(mockSectors.length); // Fallback if nothing in localStorage
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
          <Image
            src="https://placehold.co/1200x400.png"
            alt="Painel de inventário com gráficos e listas"
            width={1200}
            height={400}
            className="w-full rounded-lg object-cover"
            data-ai-hint="inventory dashboard charts"
          />
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-6 text-2xl font-semibold text-foreground">Acesso Rápido</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      <section className="grid grid-cols-1 gap-6">
        <Card className="shadow-md">
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
              {/* TODO: Implement dynamic count for items checked today */}
              <span className="text-xl font-bold text-accent-foreground">25</span> {/* Static Mock Data */}
            </div>
             <Button asChild className="w-full mt-4">
              <Link href="/equipamentos">Ver Inventário Completo</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
