@AGENTS.md

# Calculadora de Salario Driver

PWA para conductores de reparto independientes: registran su trabajo diario
(paquetes entregados por tipo de tarifa, millas, horas) y la app calcula
ganancias y métricas con dashboard filtrable. Open source (AGPL-3.0).
UI en español; código (variables, funciones) en inglés. Preparada para i18n futura.

**Fuente de verdad:** `borrador-proyecto.md` en la raíz (especificación completa).

## Stack

Next.js 16 (App Router) + TypeScript · Tailwind v4 + shadcn/ui (estilo radix-vega,
CSS variables) · next-themes (claro/oscuro/sistema) · PWA con @serwist/next ·
PostgreSQL + Prisma 7 (cliente TS generado en `src/generated/prisma`, driver
adapter `@prisma/adapter-pg`) · Auth.js v5 beta (credenciales + bcryptjs) ·
Zod 4 · Recharts 3. Deploy objetivo: Vercel + Neon/Supabase.

## Comandos

- `npm run dev` — servidor de desarrollo (Turbopack)
- `npm run build` / `npm start` — build y servir producción
- `npm run lint` / `npm run format` — ESLint / Prettier
- `npx prisma migrate dev --name <nombre>` — crear/aplicar migración
- `npx prisma generate` — regenerar cliente (sale a `src/generated/prisma`, no se commitea)
- `npx prisma studio` — inspeccionar la base de datos
- BD local: PostgreSQL 17 vía Homebrew (`brew services start postgresql@17`),
  base `calculadoradriver`. Alternativa para otros devs: `docker compose up -d`.

## Estructura

- `src/app/(auth)/` — login y registro (público)
- `src/app/(app)/` — dashboard, registros, rutas, empresas, configuración (requiere sesión)
- `src/components/ui/` — shadcn (no editar a mano salvo necesidad)
- `src/lib/` — prisma, auth, `validations/` (Zod compartido), `dates/` (semana personalizada)
- `src/server/actions/` — Server Actions por módulo
- `prisma/schema.prisma` + `prisma.config.ts` (Prisma 7: el CLI carga .env vía dotenv aquí)

## Reglas de negocio críticas (NO negociables)

1. **Snapshots de tarifas**: `WorkLogEntry` guarda nombre y valor de la tarifa al
   momento del registro. Editar un `RateType` jamás altera registros pasados.
2. **Millas/horas opcionales**: si no se ingresan → `null` en BD y "—" o
   "No registrado" en UI. NUNCA 0 por defecto (contamina promedios $/milla, $/hora).
3. **Horas**: usuario ingresa inicio y fin; la app calcula duración y soporta
   turnos que cruzan medianoche.
4. **Semana de pago personalizada**: el usuario elige el día de inicio de su semana;
   TODOS los cálculos y gráficos semanales la respetan.
5. **Registros editables**: los registros pasados se editan y los totales se recalculan.
6. **Texto libre sin normalizar**: empresas/categorías escritas en "Otra: ___" se
   guardan tal cual (`CompanySuggestion`, `texto_libre_original` en gastos).
7. **Multi-empresa**: varias empresas por usuario a lo largo del tiempo, una activa,
   historial completo, filtros por empresa en dashboard.
8. **Rutas con tarifas flexibles**: cada ruta pertenece a una empresa y tiene tarifas
   definidas por el usuario; al crear una ruta se sugieren "Tarifa completa" y "Tarifa doble".
9. **Flujo guiado**: no se puede crear un registro de trabajo sin al menos una ruta;
   guiar al usuario a crearla primero.
10. **Contraseña**: mínimo 8 caracteres, una mayúscula y un número, con confirmación.

## Decisiones tomadas

- Fase 1 (MVP) solamente en UI: auth, empresas/rutas, registro diario, edición,
  semana personalizada, dashboard básico, PWA + modo oscuro. El esquema Prisma
  completo (incl. Expense, ExpenseCategory, Goal) se define desde el inicio.
- Gastos (/gastos): categorías predefinidas como filas GLOBALES en
  ExpenseCategory (userId null, se crean bajo demanda); "Otra: ___" crea
  categoría propia del usuario y guarda el texto crudo en
  Expense.originalFreeText (regla 6). Los gastos NO se filtran por empresa.
- Dashboard: selector de período (día/semana/mes/trimestre/año + navegación
  ← →) vía searchParams `periodo` y `fecha`; tarjetas Ingresos/Gastos/Neto/
  Promedios. Helpers de período en src/lib/dates/week.ts (getPeriodRange/
  shiftPeriod). Todo cálculo monetario agrega en centavos (Math.round(x*100)).
- Zona horaria: cookie `tz` (IANA) mantenida por <TimezoneSync/> en el layout;
  el servidor calcula "hoy" con todayForUser() (src/lib/dates/server.ts).
  NUNCA usar todayAsBusinessDate() en código de servidor (en Vercel es UTC).
- Metas: modelo Goal, una por período (DAILY/WEEKLY/MONTHLY/YEARLY), se editan
  en /configuracion; barra de progreso sobre Ingresos en el dashboard.
- Promedios $/h y $/milla: solo con registros que SÍ tienen horas/millas
  (regla 2) — cada promedio usa el ingreso de sus propios registros.
- Guía de inicio en /guia (checklist con progreso real), enlazada desde
  /configuracion. No se muestra automáticamente.
- Rate limiting por IP en memoria (src/lib/rate-limit.ts): login 10/15 min,
  registro y recuperación 5/h. En serverless es por instancia (parcial).
- Sesiones huérfanas (usuario borrado/suspendido): el layout de (app)
  redirige a /api/salir para LIMPIAR la cookie — redirigir a /login directo
  crea un bucle infinito con el proxy.
- CI: .github/workflows/ci.yml (lint + tsc + build). El build NO necesita
  BD (verificado con PostgreSQL apagado).
- Sesiones por dispositivo: UserSession (user-agent, IP, lastActiveAt con
  throttle de 10 min, revokedAt). authorize() crea la fila y el id viaja en
  el JWT; el layout de (app) expulsa sesiones revocadas. Cambiar contraseña
  revoca las demás; restablecer y suspender revocan todas. Sesiones viejas
  sin sessionId → /api/salir (re-login único tras el deploy de esta feature).
- Odómetro: WorkLog.odometerStart/End; si ambos existen, miles = fin −
  inicio (calculado en servidor, en décimas). El campo de millas manual se
  deshabilita en el formulario cuando se usa odómetro.
- Verificación de email: emailVerifiedAt + EmailVerificationToken (24 h,
  un solo uso). Se envía al registrarse y al cambiar el email; banner con
  reenvío (3/h) en el layout. /verificar/[token] es pública y NO redirige
  con sesión iniciada. No bloquea el uso de la app.
- Suspensión: a los 90 días (SUSPENSION_GRACE_MS) la cuenta se elimina — al
  intentar login vencido, o vía /api/cron/limpieza (Bearer CRON_SECRET,
  programada en vercel.json a diario; también purga tokens/sesiones viejas).
- Exportación: /api/exportar (xlsx con exceljs: hojas Registros/Detalle de
  tarifas/Gastos; csv con BOM por tipo). Botones en /perfil.
- Filtros con <form method="GET"> nativo (sin JS) + paginación de 20 en
  /registros y /gastos; searchParams validados en el servidor.
- Dashboard: comparativa vs período anterior, racha de días consecutivos,
  mejor día/semana históricos y desglose de gastos por categoría.
- Deducción por milla: User.mileageRate (default 0.70, editable en
  /configuracion); el dashboard muestra millas del período × tarifa.
- Proyección: solo período EN CURSO (nunca "día"): ingresos × díasTotales /
  díasTranscurridos.
- Calendario de constancia: ActivityCalendar (server component, 12 semanas,
  intensidad por ganancia diaria, respeta weekStartDay) dentro de la card
  Constancia junto a racha/récords.
- PWA: shortcuts del manifest → /registros/nuevo y /gastos/nuevo.
- Modo offline: si no hay conexión al guardar un registro, se encola en
  localStorage (src/lib/offline-queue.ts) y <OfflineSyncer/> lo reenvía al
  reconectar vía syncOfflineWorkLog (persistWorkLog compartido, sin redirect).
  Anti-duplicados: candado a nivel de módulo + retirar de la cola ANTES de
  enviar (re-encolando si falla la red). El aviso de sincronización persiste
  al router.refresh() vía sessionStorage. OJO: en dev, el HMR puede dejar
  listeners viejos y duplicar envíos — probar siempre con recarga en frío.
- bcryptjs (JS puro) en lugar de bcrypt/argon2 nativos: evita problemas de
  binarios en Vercel.
- PWA con `@serwist/turbopack` (NO `@serwist/next`: Next 16 compila con
  Turbopack). SW en `src/app/sw.ts` servido por `src/app/serwist/[path]/route.ts`;
  registro vía `SerwistProvider` en el layout raíz. Manifest en `src/app/manifest.ts`,
  iconos en `public/icons/`. Página offline en `/~offline`.
- Modo oscuro: next-themes (`attribute="class"`) + toggle en el header.
- El matcher de `src/proxy.ts` debe excluir `serwist/`, `~offline`, `icons/` y
  `manifest.webmanifest` o la PWA deja de instalar.
- Perfil (`/perfil`): foto guardada como Bytes en la BD (recorte/reescalado a
  256px en el cliente, ~3-30 KB), servida por `/api/avatar/[userId]` con caché
  y `?v=timestamp`. El layout de (app) lee al usuario fresco de la BD: refleja
  ediciones al instante y expulsa sesiones suspendidas en cualquier dispositivo.
- Suspensión de cuenta: `suspendedAt` en User; NO borra datos, cierra sesión y
  se reactiva automáticamente al volver a iniciar sesión (estilo "desactivar").
- Contraseñas: cambio desde /perfil (verifica la actual) y recuperación por
  correo en /recuperar → /restablecer/[token]. Token sha256 de un solo uso,
  expira en 1 h; respuesta genérica anti-enumeración. Correos vía Resend
  (`RESEND_API_KEY` + `EMAIL_FROM`); sin API key se imprimen en la consola
  del servidor (src/lib/email.ts). /recuperar y /restablecer son públicas
  en el proxy.
- Next.js 16: consultar `node_modules/next/dist/docs/` antes de usar APIs que
  puedan haber cambiado (p. ej. `proxy.ts` reemplaza a `middleware.ts`).
- Prisma 7: `migrate dev` NO regenera el cliente — correr `npx prisma generate`
  y reiniciar `npm run dev` tras cambiar el esquema.
- Auth: sesión JWT (requerida por Credentials), sin adapter de BD. `src/proxy.ts`
  hace el chequeo optimista; el real está en `(app)/layout.tsx` y las actions.
- Formularios: Server Actions + `useActionState` (sin react-hook-form);
  errores de Zod con `z.flattenError(...).fieldErrors`.
