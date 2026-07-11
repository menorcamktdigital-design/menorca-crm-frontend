import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Stats } from "@/types";

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => api.get("/api/crm/stats").then((r) => r.data),
    refetchInterval: 30_000,
  });
}
