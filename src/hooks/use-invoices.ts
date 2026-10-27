import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/api/endpoints';
import type { InvoiceContent, InvoiceQuery } from '@/api/types';

const invoicesKey = ['invoices'] as const;

export function useInvoices(query: InvoiceQuery, enabled = true) {
  return useQuery({
    queryKey: [...invoicesKey, 'list', query],
    queryFn: () => invoicesApi.list(query),
    placeholderData: (previous) => previous, // keep the table while the next page loads
    enabled,
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: [...invoicesKey, 'detail', id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  });
}

export function useInvoiceSummary(year: number, profileId: string | undefined) {
  return useQuery({
    queryKey: [...invoicesKey, 'summary', year, profileId],
    queryFn: () => invoicesApi.summary(year, profileId),
    enabled: !!profileId,
  });
}

/** Every write changes lists, details and the summary, so they all refetch. */
function useInvoiceMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invoicesKey }),
  });
}

export const useCreateInvoice = () =>
  useInvoiceMutation((input: { profileId: string; invoice: InvoiceContent }) =>
    invoicesApi.create(input.profileId, input.invoice).then((created) => created.id));

export const useUpdateInvoice = () =>
  useInvoiceMutation((input: { id: string; invoice: InvoiceContent; version: number }) =>
    invoicesApi.update(input.id, input.invoice, input.version));

export const useDeleteInvoice = () => useInvoiceMutation((id: string) => invoicesApi.delete(id));

/** Issuing needs the current version; the details query is refetched first so a fresh draft can be issued at once. */
export const useIssueInvoice = () =>
  useInvoiceMutation(async (id: string) => {
    const current = await invoicesApi.get(id);
    await invoicesApi.issue(id, current.version);
  });

export const useMarkPaid = () =>
  useInvoiceMutation((input: { id: string; version: number; paidOn?: string }) =>
    invoicesApi.markPaid(input.id, input.version, input.paidOn));

export const useMarkUnpaid = () =>
  useInvoiceMutation((input: { id: string; version: number }) => invoicesApi.markUnpaid(input.id, input.version));
