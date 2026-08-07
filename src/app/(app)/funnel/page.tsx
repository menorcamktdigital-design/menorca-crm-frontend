"use client";

import { useMemo, useState } from "react";
import {
  useFunnelCampanas,
  useFunnelPlazas,
  useFunnelResumen,
  useFunnelSinPlaza,
  useFunnelWeb,
} from "@/hooks/useFunnel";
import { totales } from "@/lib/funnel";
import PlazaFilter from "@/components/dashboard/PlazaFilter";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import EmbudoCard from "@/components/funnel/EmbudoCard";
import TablaPlazas from "@/components/funnel/TablaPlazas";
import TablaMeses from "@/components/funnel/TablaMeses";
import CampanasTabla from "@/components/funnel/CampanasTabla";
import WebCard from "@/components/funnel/WebCard";
import SinPlazaAlerta from "@/components/funnel/SinPlazaAlerta";
import type { RangoFechas } from "@/types";

// Funnel de inversión publicitaria por plaza.
//
// A diferencia del resto del CRM, las plazas NO salen de la lista de Notion sino
// de lo que realmente trae la data: los workflows de n8n descubren plazas que aún
// no están dadas de alta (proyectos históricos, landings nuevas), y filtrar contra
// una lista fija las escondería justo cuando hay que verlas.
export default function FunnelPage() {
  const [plazas, setPlazas] = useState<string[]>([]);
  const [rango, setRango] = useState<RangoFechas>({});

  const plaza = plazas.length > 0 ? plazas.join(",") : undefined;

  // Sin filtro de plaza: da la lista completa para poblar el selector.
  const todasLasPlazas = useFunnelPlazas(undefined, rango);
  const porPlaza = useFunnelPlazas(plaza, rango);
  const porMes = useFunnelResumen(plaza, rango);
  const campanas = useFunnelCampanas(plaza, rango);
  const sinPlaza = useFunnelSinPlaza(rango);
  // El tráfico web no se filtra por plaza: la pregunta es cómo le va al sitio entero.
  const web = useFunnelWeb(rango);

  const opcionesPlaza = useMemo(
    () => (todasLasPlazas.data ?? []).map((p) => p.plaza).sort((a, b) => a.localeCompare(b, "es")),
    [todasLasPlazas.data]
  );

  const total = useMemo(() => totales(porMes.data ?? []), [porMes.data]);

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Funnel</h1>
            <p className="text-sm text-gray-500">
              Inversión en Google Ads y tráfico del sitio, por plaza
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter valor={rango} onChange={setRango} />
            <PlazaFilter plazas={opcionesPlaza} valores={plazas} onChange={setPlazas} />
          </div>
        </div>

        <div className="space-y-4">
          <SinPlazaAlerta datos={sinPlaza.data} />

          <EmbudoCard total={total} cargando={porMes.isLoading} />

          <WebCard web={web.data} cargando={web.isLoading} error={web.isError} />

          <TablaPlazas
            plazas={porPlaza.data ?? []}
            cargando={porPlaza.isLoading}
            error={porPlaza.isError}
          />

          <TablaMeses
            meses={porMes.data ?? []}
            cargando={porMes.isLoading}
            error={porMes.isError}
          />

          <CampanasTabla
            campanas={campanas.data ?? []}
            cargando={campanas.isLoading}
            error={campanas.isError}
          />
        </div>
      </div>
    </main>
  );
}
