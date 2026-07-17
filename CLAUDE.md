@AGENTS.md

# Calculadora de Salario Driver

## 1. Resumen del proyecto

PWA para **conductores de reparto independientes** (les pagan por paquete, con
tarifas distintas por tipo de entrega). Registran su trabajo diario y gastos;
la app calcula ganancia neta real, promedios y métricas en un dashboard
filtrable por día/semana personalizada/mes/trimestre/año. Open source
(**AGPL-3.0**), UI en español, código en inglés, preparada para i18n futura.

**EN PRODUCCIÓN**: https://calculadoradesalariodriver.vercel.app ·
Repo: https://github.com/julcnz/calculadoradesalariodriver (usuario: julcnz)

## 2. Stack y arquitectura

Next.js 16 (App Router, Turbopack) + TypeScript · Tailwind v4 + shadcn/ui
(estilo radix-vega, monocromo, CSS variables) · next-themes · PWA con
`@serwist/turbopack` · PostgreSQL + Prisma 7 (cliente TS generado en
`src/generated/prisma`, adapter `@prisma/adapter-pg`) · Auth.js v5 beta
(credenciales + bcryptjs, sesión JWT sin adapter) · Zod 4 · Recharts 3 ·
exceljs. Producción: **Vercel + Neon (us-east-1) + Resend**.

- `src/app/page.tsx` — landing pública en `/` (sin sesión: landing; con
  sesión: redirect a /dashboard — chequeo en proxy Y en página). Mockup con
  datos ficticios en `src/components/landing/`. OG en `public/og.png`.
- `src/app/(auth)/` — login, registro, recuperar, restablecer/[token],
  verificar/[token] (públicas en el proxy)
- `src/app/(app)/` — dashboard, registros, rutas, empresas, gastos, guia,
  configuracion, perfil (protegidas; cada sección tiene `loading.tsx` con
  skeleton a medida)
- `src/app/api/` — auth, avatar/[userId], exportar, salir, cron/limpieza
- `src/components/ui/` — shadcn (no editar a mano salvo necesidad)
- `src/lib/` — prisma, auth, rate-limit, email, offline-queue,
  `validations/` (Zod compartido), `dates/` (semana personalizada + tz)
- `src/server/actions/` — Server Actions por módulo
- `src/proxy.ts` — Next 16 renombró middleware→proxy; chequeo optimista
- `prisma/schema.prisma` + `prisma.config.ts` (Prisma 7 carga .env aquí)

## 3. Reglas de negocio (NO negociables) y decisiones técnicas

**Reglas de negocio:**
1. **Snapshots de tarifas**: `WorkLogEntry` guarda nombre y valor al momento
   del registro. Editar un `RateType` jamás altera registros pasados; editar
   un registro recalcula con SU snapshot, no la tarifa vigente.
2. **Millas/horas opcionales**: null en BD y "—"/"No registrado" en UI.
   NUNCA 0 (contamina $/milla y $/hora; cada promedio usa solo el ingreso de
   registros que sí tienen ese dato).
3. **Horas**: inicio y fin; la duración soporta cruce de medianoche.
4. **Semana de pago personalizada** (User.weekStartDay): TODOS los cálculos
   semanales la respetan (helpers en `src/lib/dates/week.ts`).
5. Registros pasados editables con recálculo de totales.
6. **Texto libre sin normalizar**: "Otra: ___" de empresas/categorías se
   guarda tal cual (CompanySuggestion.rawText, Expense.originalFreeText).
7. Multi-empresa: una activa, historial completo, filtro en dashboard.
8. Rutas con tarifas flexibles; al crear se sugieren "Tarifa completa" $1.45
   y "Tarifa doble" $0.50.
9. Flujo guiado: sin ruta no hay registro de trabajo.
10. Contraseña: mínimo 8, una mayúscula, un número, con confirmación.

**Decisiones técnicas críticas (con su porqué):**
- **Zona horaria**: cookie `tz` (IANA) mantenida por `<TimezoneSync/>`; el
  servidor calcula "hoy" con `todayForUser()` (src/lib/dates/server.ts).
  NUNCA `todayAsBusinessDate()` en servidor (Vercel es UTC). Fechas de
  negocio = fecha pura @db.Date (medianoche UTC); week.ts opera en UTC.
- **Dinero**: agregaciones en centavos (`Math.round(x*100)`); Decimal en BD.
- **theme-color de iOS**: `<ThemeColorSync/>` mantiene UN meta PROPIO
  (data-theme-color-sync) que sigue el tema DE LA APP (next-themes), no el
  del sistema. `viewport.themeColor` NO se declara y JAMÁS mutar/borrar
  metas renderizados por Next: React 19 los gestiona y crashea el commit de
  cada navegación (removeChild sobre null) — ese era el bug del doble toque
  en la nav.
- **Safe areas iOS (PWA)**: `viewportFit: "cover"` es OBLIGATORIO (sin él
  env(safe-area-inset-*)=0 y el home indicator tapa la nav inferior).
  statusBarStyle black-translucent. Insets aplicados en headers, nav
  inferior, main, footer, auth layout y aviso offline.
- **Emails**: en HTML con botón (`emailLayout` en src/lib/email.ts) — el
  texto plano PARTE URLs largas (bug real: Gmail truncó un token). Los
  tokens se consumen con BOTÓN (server action), nunca al cargar la página
  (los escáneres de Gmail/Outlook visitan los enlaces). Sin RESEND_API_KEY
  los correos se imprimen en la consola del servidor.
- **Sesiones por dispositivo**: UserSession (UA, IP, lastActiveAt con
  throttle 10 min, revokedAt); el id viaja en el JWT; el layout de (app)
  expulsa revocadas/suspendidas vía `/api/salir` (redirigir directo a /login
  crea bucle infinito con el proxy). Cambiar contraseña revoca las demás;
  restablecer/suspender revocan todas.
- **Suspensión**: reactivable al iniciar sesión; a los 90 días
  (SUSPENSION_GRACE_MS) la cuenta se elimina (al intentar login o vía
  /api/cron/limpieza con Bearer CRON_SECRET, cron diario en vercel.json).
- **Modo offline**: cola en localStorage (src/lib/offline-queue.ts) +
  `<OfflineSyncer/>` reenvía al reconectar vía `syncOfflineWorkLog`
  (persistWorkLog compartido sin redirect). Anti-duplicados: candado a
  nivel de módulo + retirar de la cola ANTES de enviar (re-encolar si falla
  la red). OJO: el HMR de dev deja listeners viejos que duplican — probar
  con recarga en frío.
- **Loading**: `loading.tsx` por sección (skeletons), sin spinner en la
  nav (decisión de UX). El bug del doble toque NO era el spinner: era
  ThemeColorSync mutando metas de React (ver theme-color de iOS).
- **Proxy matcher**: debe excluir api, estáticos, `serwist/`, `~offline`,
  `icons/`, manifest y cualquier archivo con extensión (og.png devolvía 307
  al login). Rutas públicas: /, /login, /registro, /recuperar,
  /restablecer/*, /verificar/* (esta última NO redirige con sesión).
- **Prisma 7**: `migrate dev` NO regenera el cliente — correr
  `npx prisma generate` y REINICIAR `npm run dev` tras cambiar el esquema.
- **PWA**: `@serwist/turbopack` (NO @serwist/next; Next 16 = Turbopack).
  SW en src/app/sw.ts servido por src/app/serwist/[path]/route.ts; registro
  con SerwistProvider; shortcuts del manifest → /registros/nuevo y
  /gastos/nuevo. En iOS, statusBarStyle se hornea al instalar.
- **CI**: Node 24 en ci.yml — npm 10 (Node 22) valida el lockfile distinto
  que npm 11 que lo genera (EUSAGE Missing @swc/helpers). El build NO
  necesita BD. bcryptjs (JS puro) evita binarios nativos en Vercel.
- **Rate limiting**: por IP en memoria (src/lib/rate-limit.ts): login 10/15
  min, registro/recuperación 5/h, reenvío verificación 3/h. En serverless
  es por instancia (parcial) — Redis/Upstash si crece.
- Deducción por milla: User.mileageRate (default 0.70, editable en Ajustes).
- Proyección solo del período EN CURSO (nunca "día").
- Foto de perfil: Bytes en BD (recorte cliente a 256px), servida por
  /api/avatar/[userId] con caché + ?v=timestamp.
- Formularios: Server Actions + `useActionState` (sin react-hook-form);
  errores Zod con `z.flattenError(...).fieldErrors`.

## 4. Convenciones

- UI en **español**, código (variables/funciones/commits descriptivos) en
  inglés técnico con mensajes de commit en español.
- Íconos: lucide (SVG), no emojis como íconos (los emojis solo como acento
  de texto: racha 🔥).
- **Marca**: pin de ubicación + moneda $ — verde #4ade80 sobre #0a0a0a,
  wordmark "SalarioDriver" en Archivo ExtraBold (--font-archivo, solo para
  la marca). Componentes en `src/components/brand/brand-logo.tsx`
  (BrandMark/BrandWordmark/BrandLogo); en claro "Driver" usa green-600 por
  contraste. Assets: public/icons (manifest), src/app/icon.svg + favicon.ico
  + apple-icon.png. El ícono de la PWA instalada solo cambia al reinstalar.
- Diseño: monocromo radix-vega; acento esmeralda SOLO en cifras de dinero
  positivas; skill de diseño de referencia: plugin `ui-ux-pro-max`.
- Mobile-first; nav inferior en móvil (6 ítems), header en desktop.
- Server components por defecto; "use client" solo cuando hace falta.
- Verificación: typecheck + lint + prueba real en navegador antes de cada
  commit; commits por módulo/feature.

## 5. Funcionalidades implementadas (todas verificadas)

Auth completo (registro, login, logout, recuperación por correo,
verificación de email con banner y reenvío, rate limiting, sesiones por
dispositivo con revocación) · Empresas multi + "Otra" · Rutas con tarifas
flexibles · Registro diario (snapshots, odómetro inicio/fin, medianoche,
total en vivo, edición/eliminación) · Gastos por categorías · Dashboard
(períodos con navegación ← →, Ingresos/Gastos/Neto/Promedios $/h y $/milla,
meta con progreso, proyección, comparativa vs período anterior, racha,
récords, calendario de constancia 12 semanas, gráfico por ruta, desglose de
gastos, filtro por empresa, deducción por milla) · Metas por período ·
Filtros avanzados + paginación en registros/gastos · Exportación Excel/CSV ·
Perfil (foto, datos, contraseña, dispositivos, exportar, suspensión con
borrado a 90 días) · Guía de inicio (/guia desde Ajustes) · PWA instalable
con atajos y modo offline con sincronización · Modo claro/oscuro/sistema ·
Landing pública con SEO/OG · Skeletons por sección · Safe areas
iOS · Crédito "Hecho por Julián" + Buy Me a Coffee (julcnzs) en Ajustes.

## 6. Pendientes y próximos pasos

- **Rotar secretos** expuestos en la conversación de lanzamiento: password
  de Neon y API key de Resend; actualizar en Vercel y en los archivos
  locales `.env.neon` / `.env.produccion` (gitignoreados, sin valores aquí).
- **Dominio propio** + verificarlo en Resend (sin él, los correos solo
  llegan al email del dueño) + fijar AUTH_URL/EMAIL_FROM en Vercel.
- **Tests (Vitest)** de la lógica crítica: snapshots, medianoche, semanas,
  centavos, odómetro, rate limiter, borrado 90 días.
- **Sentry** (errores en producción).
- Ideas discutidas no implementadas: reporte de impuestos (PDF), gráfico de
  evolución temporal, "repetir ayer", foto de recibos en gastos, eliminar
  cuenta inmediata, importar CSV, i18n, rate limit con Redis, y reducir la
  nav a 5 pestañas (HIG recomienda ≤5; mover Empresas a Ajustes).
- `prompt-claude-code.md` en la raíz está sin trackear a propósito.

## 7. Comandos útiles

- `npm run dev` — desarrollo (Turbopack). BD local: PostgreSQL 17 Homebrew
  (`brew services start postgresql@17`), base `calculadoradriver`; otros
  devs: `docker compose up -d`.
- `npm run build` / `npm start` · `npm run lint` / `npm run format`
- `npx prisma migrate dev --name <n>` + `npx prisma generate` + reiniciar dev
- `npx prisma studio` — inspeccionar BD
- Migrar PRODUCCIÓN (Neon): `set -a && source .env.neon && set +a &&
  npx prisma migrate deploy`
- Deploy: `git push` → Vercel auto-deploya y corre el CI (GitHub Actions,
  Node 24). La PWA instalada adopta la versión nueva al segundo arranque.
- Probar cron: `curl -H "Authorization: Bearer $CRON_SECRET"
  https://calculadoradesalariodriver.vercel.app/api/cron/limpieza`
- gh CLI: autenticado en la terminal DEL USUARIO (el sandbox de Claude no
  puede leer el keyring) — los push los ejecuta el usuario.
