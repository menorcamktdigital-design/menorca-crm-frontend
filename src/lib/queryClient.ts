import { QueryClient } from "@tanstack/react-query";

// Sin refetchInterval global: cada hook define su propio polling.
// Un interval global en queries infinitas re-pide TODAS las páginas
// cargadas en cada tick — con la lista de leads eso era una ráfaga
// de requests cada 5s.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
