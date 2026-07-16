// Cola offline en localStorage (solo cliente): registros de trabajo
// guardados sin conexión que se envían al reconectar.

const STORAGE_KEY = "salario-driver-cola-offline";

export type QueuedWorkLog = {
  id: string;
  pairs: [string, string][]; // entradas del FormData, en orden
  savedAt: number;
};

export function readOfflineQueue(): QueuedWorkLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedWorkLog[]) : [];
  } catch {
    return [];
  }
}

export function enqueueWorkLog(formData: FormData): void {
  const pairs: [string, string][] = [];
  formData.forEach((value, key) => {
    if (typeof value === "string") pairs.push([key, value]);
  });
  const queue = readOfflineQueue();
  queue.push({ id: crypto.randomUUID(), pairs, savedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineQueue(id: string): void {
  const queue = readOfflineQueue().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

// Devuelve un elemento al frente de la cola (el envío falló por red).
export function requeueWorkLog(item: QueuedWorkLog): void {
  const queue = readOfflineQueue().filter((entry) => entry.id !== item.id);
  queue.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}
