import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin: boolean;
}

export function useAuth() {
  const { data: user, isLoading, isError, error, isFetched } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: Infinity,
  });

  return {
    user: user || null,
    isLoading: !isFetched,
    isAuthenticated: !!user && !isError,
    error,
  };
}
