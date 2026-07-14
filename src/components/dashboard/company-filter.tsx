"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function CompanyFilter({
  companies,
  selected,
}: {
  companies: { id: string; name: string }[];
  selected?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) {
      params.delete("empresa");
    } else {
      params.set("empresa", value);
    }
    startTransition(() => {
      router.replace(`/dashboard?${params.toString()}`);
    });
  }

  return (
    <Select
      value={selected ?? ALL}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por empresa">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todas las empresas</SelectItem>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
