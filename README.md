# Calculadora de Salario Driver

Aplicación web progresiva (PWA) para conductores de reparto independientes.
Registra tu trabajo diario —paquetes entregados por tipo de tarifa, millas y
horas— y obtén tus ganancias y métricas en un dashboard filtrable por día,
semana personalizada, mes, trimestre y año.

Proyecto open source bajo licencia [AGPL-3.0](LICENSE).

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) — mobile-first, modo claro/oscuro/sistema
- PWA instalable con [Serwist](https://serwist.pages.dev)
- PostgreSQL + [Prisma](https://www.prisma.io) 7
- [Auth.js](https://authjs.dev) v5 (credenciales: email + contraseña con bcryptjs)
- Zod (validación compartida cliente/servidor) · Recharts (gráficos)

## Requisitos

- Node.js 20 LTS o superior
- PostgreSQL 15+ (local, Docker, o una base gratuita en [Neon](https://neon.tech)/[Supabase](https://supabase.com))

## Instalación

```bash
git clone <url-del-repo>
cd calculadoradesalariodriver
npm install
```

### 1. Variables de entorno

Copia la plantilla y rellena los valores (cada variable está documentada dentro):

```bash
cp .env.example .env
```

| Variable         | Descripción                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Connection string de PostgreSQL                                                           |
| `AUTH_SECRET`    | Secreto de sesión. Genera uno con `openssl rand -base64 32`                                |
| `AUTH_URL`       | (Opcional) URL pública de la app; en local se autodetecta                                  |
| `RESEND_API_KEY` | (Opcional) API key de [Resend](https://resend.com) para los correos de recuperación de contraseña. Sin ella, los correos se imprimen en la consola del servidor (útil en desarrollo) |
| `EMAIL_FROM`     | (Opcional) Remitente de los correos, ej. `Salario Driver <no-reply@tudominio.com>`         |

### 2. Base de datos

Con Docker:

```bash
docker compose up -d
```

O con PostgreSQL local (ej. Homebrew en macOS):

```bash
brew install postgresql@17
brew services start postgresql@17
createdb calculadoradriver
```

Aplica las migraciones:

```bash
npx prisma migrate dev
```

### 3. Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Comandos útiles

| Comando                                | Descripción                       |
| -------------------------------------- | --------------------------------- |
| `npm run dev`                           | Servidor de desarrollo            |
| `npm run build` / `npm start`           | Build y servidor de producción    |
| `npm run lint`                          | ESLint                            |
| `npm run format`                        | Prettier                          |
| `npx prisma migrate dev --name <nombre>`| Crear y aplicar una migración     |
| `npx prisma studio`                     | Explorar la base de datos         |

## Despliegue

Pensada para [Vercel](https://vercel.com) con una base PostgreSQL gestionada
(Neon o Supabase). Define `DATABASE_URL` y `AUTH_SECRET` en las variables de
entorno del proyecto y despliega.

## Licencia

[GNU Affero General Public License v3.0](LICENSE)
