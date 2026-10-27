import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/api/endpoints';
import type { CompanyData } from '@/api/types';

const companiesKey = ['companies'] as const;

export function useCompanies(search?: string) {
  return useQuery({
    queryKey: [...companiesKey, 'list', search ?? ''],
    queryFn: () => companiesApi.list(search),
    select: (page) => page.items,
    placeholderData: (previous) => previous,
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: [...companiesKey, id],
    queryFn: () => companiesApi.get(id!),
    enabled: !!id,
  });
}

export function useSaveCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; company: CompanyData; version?: number }) =>
      input.id
        ? companiesApi.update(input.id, input.company, input.version!)
        : companiesApi.create(input.company).then(() => undefined),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companiesKey }),
  });
}

export function useArchiveCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.archive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companiesKey }),
  });
}
