"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/auth/field-error";
import { calculateWorkedMinutes, TIME_REGEX } from "@/lib/dates/time";
import { formatMinutes } from "@/lib/format";

// Campos comunes a crear/editar: fecha, horas (opcionales), millas (opcionales) y nota.
export function WorkLogCommonFields({
  defaults,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  errors,
}: {
  defaults: {
    date: string;
    miles: string;
    note: string;
  };
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  errors?: Record<string, string[]>;
}) {
  const bothTimes =
    TIME_REGEX.test(startTime) && TIME_REGEX.test(endTime);
  const workedMinutes = bothTimes
    ? calculateWorkedMinutes(startTime, endTime)
    : null;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="wl-date">Fecha</Label>
        <Input
          id="wl-date"
          name="date"
          type="date"
          defaultValue={defaults.date}
          required
          className="w-fit"
        />
        <FieldError errors={errors?.date} />
      </div>

      <div className="space-y-2">
        <Label>Horas trabajadas (opcional)</Label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Inicio</span>
            <Input
              name="startTime"
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-fit"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Fin</span>
            <Input
              name="endTime"
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-fit"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {workedMinutes !== null
            ? `Duración: ${formatMinutes(workedMinutes)}${
                endTime <= startTime ? " (cruza medianoche)" : ""
              }`
            : "Si las dejas vacías se mostrará “No registrado”."}
        </p>
        <FieldError errors={errors?.startTime} />
        <FieldError errors={errors?.endTime} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wl-miles">Millas (opcional)</Label>
        <Input
          id="wl-miles"
          name="miles"
          inputMode="decimal"
          placeholder="Ej. 120.5"
          defaultValue={defaults.miles}
          className="w-32"
        />
        <FieldError errors={errors?.miles} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wl-note">Nota (opcional)</Label>
        <Textarea
          id="wl-note"
          name="note"
          placeholder="Algo que quieras recordar de este día…"
          defaultValue={defaults.note}
          rows={2}
        />
        <FieldError errors={errors?.note} />
      </div>
    </>
  );
}
