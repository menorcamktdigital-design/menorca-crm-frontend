import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Visita } from "@/types";

export function useVisitas() {
  return useQuery<Visita[]>({
    queryKey: ["visitas"],
    queryFn: () =>
      api.get("/api/visitas").then((r) => {
        const d = r.data;
        return Array.isArray(d)
          ? d
          : (Object.values(d).find(Array.isArray) as Visita[]) || [];
      }),
    refetchInterval: 60_000,
  });
}
