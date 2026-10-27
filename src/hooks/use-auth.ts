import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';
import { authApi } from '@/api/endpoints';

export const meKey = ['me'] as const;

/** The signed-in user; `data` is null when there is no session (401). */
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * May the user do `permission` (in `profileId`, or anywhere when omitted)? The API enforces the same rules;
 * this only hides buttons that would end in 403.
 */
export function useCan() {
  const { data: me } = useMe();
  return (permission: string, profileId?: string) => {
    const grant = me?.permissions.find((p) => p.permission === permission);
    if (!grant) return false;
    return grant.allProfiles || profileId === undefined || grant.profileIds.includes(profileId);
  };
}

/** Global actions (creating a business profile) need the permission in every profile, not just in one. */
export function useCanEverywhere() {
  const { data: me } = useMe();
  return (permission: string) => me?.permissions.some((p) => p.permission === permission && p.allProfiles) ?? false;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; rememberMe: boolean }) =>
      authApi.login(input.email, input.password, input.rememberMe),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKey }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    // Drop every cached business query: the next user must not see the previous user's data.
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(meKey, null);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(input.currentPassword, input.newPassword),
  });
}
