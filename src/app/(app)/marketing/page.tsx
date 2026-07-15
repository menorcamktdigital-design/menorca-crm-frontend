"use client";

import { useState } from "react";
import {
  useStatsAnuncios,
  useStatsCampanas,
  useStatsCreativos,
  useStatsFuentes,
  useStatsMultitouch,
} from "@/hooks/useStatsMarketing";
import { PROYECTOS, SIN_PROYECTO } from "@/lib/proyectos";
import PlazaFilter from "@/components/dashboard/PlazaFilter";
import DateRangeFilter from "@/components/ui/DateRangeFilter";
import KpisMarketing from "@/components/marketing/KpisMarketing";
import FuentesCard from "@/components/marketing/FuentesCard";
import MultitouchCard from "@/components/marketing/MultitouchCard";
import CampanasFunnel from "@/components/marketing/CampanasFunnel";
import CreativosGrid from "@/components/marketing/CreativosGrid";
import type { RangoFechas } from "@/types";

// Mismo criterio que el dashboard: el filtro del backend matchea contra el
// texto del proyecto, "Otros" no es expresable
const PLAZAS = [...PROYECTOS, SIN_PROYECTO];

// Vista de atribución de marketing: de dónde vienen los leads (fuentes),
// qué campaña/anuncio/creativo los genera y cuántos toques necesitaron.
// Todos los endpoints filtran en el backend (?proyecto=&desde=&hasta=).
export default function MarketingPage() {
  const [plazas, setPlazas] = useState<string[]>([]);
  const [rango, setRango] = useState<RangoFechas>({});
  // El backend acepta ?proyecto= con varios valores separados por coma
  const proyecto = plazas.length > 0 ? plazas.join(",") : undefined;

  const fuentes = useStatsFuentes(proyecto, rango);
  const multitouch = useStatsMultitouch(proyecto, rango);
  const campanas = useStatsCampanas(proyecto, rango);
  const anuncios = useStatsAnuncios(proyecto, rango);
  const creativos = useStatsCreativos(proyecto, rango);

  return (
    <main className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Marketing</h1>
            <p className="text-sm text-gray-500">
              Atribución de leads: fuentes, campañas y creativos de Meta Ads
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter valor={rango} onChange={setRango} />
            <PlazaFilter plazas={PLAZAS} valores={plazas} onChange={setPlazas} />
          </div>
        </div>

        <KpisMarketing
          fuentes={fuentes.data ?? []}
          multitouch={multitouch.data ?? []}
          cargando={fuentes.isLoading || multitouch.isLoading}
        />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FuentesCard
            fuentes={fuentes.data ?? []}
            cargando={fuentes.isLoading}
            error={fuentes.isError}
          />
          <MultitouchCard
            grupos={multitouch.data ?? []}
            cargando={multitouch.isLoading}
            error={multitouch.isError}
          />
        </div>

        <div className="mt-4">
          <CampanasFunnel
            campanas={campanas.data ?? []}
            anuncios={anuncios.data ?? []}
            rango={rango}
            proyecto={proyecto}
            cargando={campanas.isLoading || anuncios.isLoading}
            error={campanas.isError}
          />
        </div>

        <div className="mt-4">
          <CreativosGrid
            creativos={creativos.data ?? []}
            rango={rango}
            proyecto={proyecto}
            cargando={creativos.isLoading}
            error={creativos.isError}
          />
        </div>
      </div>
    </main>
  );
}
