import type { InvoiceStatus, UnitOfMeasure } from '@/api/types';

/** What the user sees: the stored status, or "overdue" for a sent invoice past its due date (decided by the API). */
export type DisplayStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export function displayStatus(invoice: { status: InvoiceStatus; isOverdue: boolean }): DisplayStatus {
  if (invoice.isOverdue) return 'overdue';
  return invoice.status.toLowerCase() as DisplayStatus;
}

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  draft: 'Juodraštis',
  sent: 'Išsiųsta',
  paid: 'Apmokėta',
  overdue: 'Vėluoja',
};

export const STATUS_BADGES: Record<DisplayStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  draft: 'secondary',
  sent: 'warning',
  paid: 'success',
  overdue: 'destructive',
};

export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  Piece: 'vnt.',
  Month: 'mėn.',
  Hour: 'val.',
  Page: 'psl.',
  Set: 'kompl.',
};

/** Drafts have no number until they are issued. */
export function invoiceTitle(invoice: { series: string; number: string | null }): string {
  return invoice.number ? `${invoice.series} ${invoice.number}` : `Juodraštis (${invoice.series})`;
}
