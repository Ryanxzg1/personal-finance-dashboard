export const TECHNICAL_CATEGORIES = ["Transfer", "Penyesuaian Saldo", "Initial Balance"];

export function isTechnicalTransaction(category: string): boolean {
  return TECHNICAL_CATEGORIES.includes(category);
}

export function isReportableTransaction(category: string): boolean {
  return !isTechnicalTransaction(category);
}
