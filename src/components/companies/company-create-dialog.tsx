"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  createCompany,
  type CompanyFormState,
} from "@/server/actions/companies";
import { PREDEFINED_COMPANIES, OTHER_COMPANY_OPTION } from "@/lib/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/auth/field-error";

export function CompanyCreateDialog() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [state, setState] = useState<CompanyFormState>(null);
  const [isPending, startTransition] = useTransition();

  const isOther = selected === OTHER_COMPANY_OPTION;

  function handleSubmit(formData: FormData) {
    // Si eligió una del listado, el nombre viene del select.
    if (!isOther) formData.set("name", selected);
    formData.set("isCustom", isOther ? "true" : "false");

    startTransition(async () => {
      const result = await createCompany(null, formData);
      if (result?.success) {
        setOpen(false);
        setSelected("");
        setState(null);
      } else {
        setState(result);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelected("");
          setState(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Agregar empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>
            La nueva empresa pasará a ser tu empresa actual.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elige una empresa" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_COMPANIES.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_COMPANY_OPTION}>Otra…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isOther && (
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la empresa</Label>
              <Input
                id="company-name"
                name="name"
                placeholder="Escribe el nombre"
                autoFocus
              />
            </div>
          )}
          <FieldError errors={state?.errors?.name} />
          {state?.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || !selected}
              className="w-full sm:w-auto"
            >
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
