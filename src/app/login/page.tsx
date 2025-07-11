"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const loginFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      // O redirecionamento será tratado pelo useEffect
      toast({
        title: 'Login bem-sucedido!',
        description: `Bem-vindo, ${data.email}! Redirecionando...`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: 'Usuário ou senha inválidos.',
      });
      setIsSubmitting(false);
    }
  }

  // Se já estiver logado, não mostra o form, espera o redirect do useEffect
  if (loading || user) {
     return (
       <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background p-8">
         <Logo className="h-16 w-16 animate-pulse text-primary" />
         <p className="text-lg font-medium text-foreground">
           {loading ? 'Verificando autenticação...' : 'Redirecionando para o painel...'}
         </p>
       </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center text-center">
          <Logo className="mb-4 h-12 w-12" />
          <CardTitle className="text-3xl font-headline">Controle de Inventário</CardTitle>
          <CardDescription>Acesse sua conta para gerenciar o inventário.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="seu.usuario@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
