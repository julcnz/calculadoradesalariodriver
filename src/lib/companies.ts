// Listado predeterminado de empresas de reparto.
// El usuario también puede escribir la suya en "Otra: ___" (se guarda tal cual,
// sin normalizar, y se registra en CompanySuggestion para análisis posterior).
export const PREDEFINED_COMPANIES = [
  "Amazon Flex",
  "Amazon DSP",
  "FedEx Ground",
  "UPS",
  "OnTrac",
  "Veho",
  "Spark Driver (Walmart)",
  "GoPuff",
  "DoorDash",
  "Uber Eats",
] as const;

export const OTHER_COMPANY_OPTION = "__other__";
