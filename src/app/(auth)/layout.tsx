export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Calculadora de Salario Driver
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra tu trabajo y conoce tus ganancias
        </p>
      </div>
      {children}
    </main>
  );
}
