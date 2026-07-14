import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RateEditor } from "@/components/routes/rate-editor";
import {
  RouteDeleteButton,
  RouteNameForm,
} from "@/components/routes/route-edit-form";

export const metadata: Metadata = { title: "Editar ruta" };

export default async function EditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const route = await prisma.route.findFirst({
    where: { id, company: { userId } },
    include: {
      company: { select: { name: true } },
      rateTypes: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!route) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Editar ruta</CardTitle>
          <CardDescription>{route.company.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RouteNameForm routeId={route.id} name={route.name} />
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Tarifas</h2>
            <RateEditor
              routeId={route.id}
              rates={route.rateTypes.map((rate) => ({
                id: rate.id,
                name: rate.name,
                amount: rate.amount.toFixed(2),
                isActive: rate.isActive,
              }))}
            />
          </div>
          <Separator />
          <RouteDeleteButton routeId={route.id} />
        </CardContent>
      </Card>
    </div>
  );
}
