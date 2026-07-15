import { z } from "zod";
import { moneyStringSchema } from "@/lib/validations/route";

const optionalMoney = moneyStringSchema.optional().or(z.literal(""));

// Un monto por período; vacío = sin meta para ese período.
export const goalsSchema = z.object({
  daily: optionalMoney,
  weekly: optionalMoney,
  monthly: optionalMoney,
  yearly: optionalMoney,
});

export type GoalsInput = z.infer<typeof goalsSchema>;
