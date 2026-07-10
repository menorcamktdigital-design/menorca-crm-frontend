import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 4_000, // datos frescos por 4s
      refetchInterval: 5_000, // polling cada 5s
      retry: 1,
    },
  },
});
