
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Warehouse, ScanBarcode, FileText, ArrowRight } from "lucide-react";
import Image from "next/image";

const quickAccessItems = [
  { title: "Cadastrar Equipamento", href: "/equipamentos", icon: Package, description: "Adicione novos itens ao inventário." },
  { title: "Gerenciar Setores", href: "/setores", icon: Warehouse, description: "Equipamentos por setor." },
  { title: "Conferir Inventário", href: "/conferencia", icon: ScanBarcode, description: "Realize a checagem rápida de itens." },
  { title: "Ver Relatórios", href: "/relatorios", icon: FileText, description: "Visualizar relatório completo." },
];

export default function DashboardPage() {
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Resumo do Inventário</CardTitle>
            <CardDescription>Visão geral dos seus ativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium">Total de Equipamentos:</span>
              <span className="text-xl font-bold text-primary">152</span> {/* Mock Data */}
            </div>
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-md">
              <span className="font-medium">Total de Setores:</span>
              <span className="text-xl font-bold text-primary">12</span> {/* Mock Data */}
            </div>
             <div className="flex justify-between items-center p-3 bg-accent/10 rounded-md border border-accent">
              <span className="font-medium text-accent-foreground">Itens Conferidos Hoje:</span>
              <span className="text-xl font-bold text-accent-foreground">25</span> {/* Mock Data */}
            </div>
             <Button className="w-full mt-4">
              Ver Inventário Completo
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-md">
           <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas movimentações e conferências.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center justify-between text-sm">
                <div><span className="font-medium">Notebook Dell XPS</span> adicionado ao setor <span className="text-primary">TI</span>.</div>
                <div className="text-muted-foreground">Agora mesmo</div>
              </li>
              <li className="flex items-center justify-between text-sm">
                <div><span className="font-medium">Conferência</span> realizada no setor <span className="text-primary">Marketing</span>.</div>
                <div className="text-muted-foreground">Há 2 horas</div>
              </li>
               <li className="flex items-center justify-between text-sm">
                <div><span className="font-medium">Projetor Epson</span> movido para <span className="text-primary">Sala de Reuniões A</span>.</div>
                <div className="text-muted-foreground">Ontem</div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
