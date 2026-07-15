import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { FichaContacto } from "@/types";

export function useFichaContacto(numero: string | null) {
  return useQuery<FichaContacto>({
    queryKey: ["ficha-contacto", numero],
    enabled: !!numero,
    queryFn: () =>
      api.get(`/api/crm/contactos/${numero}/ficha`).then((r) => r.data),
  });
}
