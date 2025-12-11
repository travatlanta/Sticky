import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, isError, error, isFetched } = useQuery({
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
