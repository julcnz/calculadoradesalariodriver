import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyCreateDialog } from "@/components/companies/company-create-dialog";
import { CompanyActions } from "@/components/companies/company-actions";

export const metadata: Metadata = { title: "Empresas" };

export default async function CompaniesPage() {
  const userId = await requireUserId();

  const companies = await prisma.company.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { routes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            La empresa activa es con la que trabajas actualmente.
          </p>
        </div>
        <CompanyCreateDialog />
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún no tienes empresas</CardTitle>
            <CardDescription>
              Agrega la empresa para la que repartes. Después podrás crear tus
              rutas con sus tarifas.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{company.name}</CardTitle>
                  {company.isActive ? (
                    <Badge>Activa</Badge>
                  ) : (
                    <Badge variant="secondary">Historial</Badge>
                  )}
                </div>
                <CardDescription>
                  {company._count.routes}{" "}
                  {company._count.routes === 1 ? "ruta" : "rutas"}
                  {company.startedAt &&
                    ` · desde ${formatDate(company.startedAt)}`}
                  {company.endedAt && ` · hasta ${formatDate(company.endedAt)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompanyActions
                  companyId={company.id}
                  isActive={company.isActive}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
