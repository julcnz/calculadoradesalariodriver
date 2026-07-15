// Categorías de gasto predeterminadas (globales, userId null en la BD).
// El usuario también puede escribir la suya en "Otra: ___" — se guarda tal
// cual en Expense.originalFreeText (regla 6) y se crea una categoría propia.
export const PREDEFINED_EXPENSE_CATEGORIES = [
  "Gasolina",
  "Mantenimiento",
  "Seguro",
  "Teléfono",
  "Peajes",
  "Estacionamiento",
  "Lavado de auto",
  "Comida",
] as const;

export const OTHER_CATEGORY_OPTION = "__other__";
