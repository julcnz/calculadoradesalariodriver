import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { WorkLogEditForm } from "@/components/worklogs/worklog-edit-form";

export const metadata: Metadata = { title: "Editar registro" };

export default async function EditWorkLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const workLog = await prisma.workLog.findFirst({
    where: { id, userId },
    include: {
      route: { select: { name: true, company: { select: { name: true } } } },
      entries: { orderBy: { id: "asc" } },
    },
  });
  if (!workLog) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <WorkLogEditForm
        workLog={{
          id: workLog.id,
          routeName: workLog.route.name,
          companyName: workLog.route.company.name,
          date: workLog.date.toISOString().slice(0, 10),
          startTime: workLog.startTime ?? "",
          endTime: workLog.endTime ?? "",
          miles: workLog.miles !== null ? String(Number(workLog.miles)) : "",
          odometerStart:
            workLog.odometerStart !== null
              ? String(Number(workLog.odometerStart))
              : "",
          odometerEnd:
            workLog.odometerEnd !== null
              ? String(Number(workLog.odometerEnd))
              : "",
          note: workLog.note ?? "",
          entries: workLog.entries.map((entry) => ({
            id: entry.id,
            nameSnapshot: entry.nameSnapshot,
            amountSnapshot: entry.amountSnapshot.toFixed(2),
            quantity: entry.quantity,
          })),
        }}
      />
    </div>
  );
}
