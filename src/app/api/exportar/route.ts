import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Cell = string | number | null;

// CSV con BOM para que Excel abra bien los acentos.
function toCsv(headers: string[], rows: Cell[][]): string {
  const escape = (value: Cell): string => {
    if (value === null) return "";
    const text = String(value);
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return (
    "﻿" +
    [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n")
  );
}

async function fetchData(userId: string) {
  const [workLogs, expenses] = await Promise.all([
    prisma.workLog.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      include: {
        route: { select: { name: true, company: { select: { name: true } } } },
        entries: true,
      },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "asc" },
      include: { category: { select: { name: true } } },
    }),
  ]);
  return { workLogs, expenses };
}

const REGISTROS_HEADERS = [
  "Fecha",
  "Empresa",
  "Ruta",
  "Paquetes",
  "Hora inicio",
  "Hora fin",
  "Minutos trabajados",
  "Millas",
  "Odómetro inicio",
  "Odómetro fin",
  "Total ($)",
  "Nota",
];

const DETALLE_HEADERS = [
  "Fecha",
  "Ruta",
  "Tarifa",
  "Valor ($)",
  "Cantidad",
  "Subtotal ($)",
];

const GASTOS_HEADERS = [
  "Fecha",
  "Categoría",
  "Monto ($)",
  "Nota",
  "Texto original",
];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(null, { status: 401 });
  }
  const userId = session.user.id;

  const url = new URL(request.url);
  const formato = url.searchParams.get("formato") ?? "xlsx";
  const tipo = url.searchParams.get("tipo") ?? "registros";

  const { workLogs, expenses } = await fetchData(userId);

  const fecha = (d: Date) => d.toISOString().slice(0, 10);
  const registrosRows: Cell[][] = workLogs.map((log) => [
    fecha(log.date),
    log.route.company.name,
    log.route.name,
    log.entries.reduce((acc, e) => acc + e.quantity, 0),
    log.startTime,
    log.endTime,
    log.workedMinutes,
    log.miles !== null ? Number(log.miles) : null,
    log.odometerStart !== null ? Number(log.odometerStart) : null,
    log.odometerEnd !== null ? Number(log.odometerEnd) : null,
    Number(log.totalEarned),
    log.note,
  ]);
  const detalleRows: Cell[][] = workLogs.flatMap((log) =>
    log.entries.map((entry) => [
      fecha(log.date),
      log.route.name,
      entry.nameSnapshot,
      Number(entry.amountSnapshot),
      entry.quantity,
      Number(entry.subtotal),
    ])
  );
  const gastosRows: Cell[][] = expenses.map((expense) => [
    fecha(expense.date),
    expense.category?.name ?? "",
    Number(expense.amount),
    expense.note,
    expense.originalFreeText,
  ]);

  if (formato === "csv") {
    const isGastos = tipo === "gastos";
    const csv = isGastos
      ? toCsv(GASTOS_HEADERS, gastosRows)
      : toCsv(REGISTROS_HEADERS, registrosRows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="salario-driver-${
          isGastos ? "gastos" : "registros"
        }.csv"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const addSheet = (name: string, headers: string[], rows: Cell[][]) => {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));
    sheet.columns.forEach((column, i) => {
      column.width = Math.max(12, headers[i].length + 2);
    });
  };
  addSheet("Registros", REGISTROS_HEADERS, registrosRows);
  addSheet("Detalle de tarifas", DETALLE_HEADERS, detalleRows);
  addSheet("Gastos", GASTOS_HEADERS, gastosRows);

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="salario-driver.xlsx"',
    },
  });
}
