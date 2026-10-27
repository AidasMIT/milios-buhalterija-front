import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/api/endpoints';
import type { ProfileData } from '@/api/types';

const profilesKey = ['profiles'] as const;

export function useProfiles() {
  return useQuery({ queryKey: profilesKey, queryFn: profilesApi.list, select: (page) => page.items });
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: [...profilesKey, id],
    queryFn: () => profilesApi.get(id!),
    enabled: !!id,
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; details: ProfileData; version?: number; lastInvoiceSequence?: number }) =>
      input.id
        ? profilesApi.update(input.id, input.details, input.version!).then(() => input.id!)
        : profilesApi.create(input.details, input.lastInvoiceSequence ?? 0).then((created) => created.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profilesKey }),
  });
}
