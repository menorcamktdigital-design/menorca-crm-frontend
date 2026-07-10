# Visor Agente Menorca — Contexto para desarrollo en Next.js

> Este documento es el contexto completo para construir el dashboard.
> No es código final — es la especificación para que lo implementes tú
> (o lo pases a un agente de código como Claude Code).

---

## 1. Stack decidido

| Herramienta | Rol | Por qué |
|---|---|---|
| **Next.js 14** | Framework | App Router, SSR/CSR a elección, estructura limpia |
| **Tailwind CSS** | Estilos | Utility-first, sin CSS sucio |
| **Axios** | HTTP client | Interceptores, instancia con baseURL centralizada |
| **TanStack Query (React Query v5)** | Server state | Polling automático, caché, loading/error states |
| **Zustand** | Client state | UI state: tab activo, lead seleccionado, filtros |
| **TypeScript** | Tipado | Obligatorio — los shapes de la API deben estar tipados |

---

## 2. Crear el proyecto

```bash
npx create-next-app@latest visor-menorca \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd visor-menorca
npm install axios @tanstack/react-query zustand
npm install -D @tanstack/react-query-devtools
```

---

## 3. Estructura de carpetas

```
src/
├── app/
│   ├── layout.tsx          ← Providers globales (QueryClient, Zustand)
│   ├── page.tsx            ← Dashboard principal (layout sidebar + main)
│   └── globals.css         ← Solo imports de Tailwind
│
├── components/
│   ├── sidebar/
│   │   ├── Sidebar.tsx         ← Contenedor del sidebar
│   │   ├── StatsBar.tsx        ← Los 3 contadores (Leads / Conversando / Derivados)
│   │   ├── TabBar.tsx          ← Tabs Chats / Leads
│   │   ├── SearchInput.tsx     ← Input de búsqueda
│   │   └── ContactList.tsx     ← Lista con scroll infinito
│   │
│   ├── chat/
│   │   ├── ChatPanel.tsx       ← Panel derecho cuando hay chat abierto
│   │   ├── ChatHeader.tsx      ← Avatar + nombre + subinfo
│   │   ├── MessageList.tsx     ← Burbuja de mensajes con scroll infinito hacia arriba
│   │   └── MessageBubble.tsx   ← Burbuja individual (lead vs IA)
│   │
│   ├── leads/
│   │   ├── LeadsPanel.tsx      ← Panel derecho tab Leads
│   │   ├── FilterChips.tsx     ← Chips: Todos / Conversando / Derivados
│   │   └── LeadsTable.tsx      ← Tabla de leads
│   │
│   └── ui/
│       ├── Avatar.tsx          ← Círculo con inicial
│       ├── Badge.tsx           ← Estado del lead con color
│       ├── LiveDot.tsx         ← Punto verde animado
│       └── Placeholder.tsx     ← Pantalla vacía "selecciona un chat"
│
├── hooks/
│   ├── useStats.ts             ← useQuery para /api/stats
│   ├── useContactos.ts         ← useInfiniteQuery para /api/contactos
│   └── useConversacion.ts      ← useInfiniteQuery para /api/conversacion/:numero
│
├── lib/
│   ├── axios.ts                ← Instancia de axios con baseURL
│   └── queryClient.ts          ← Instancia de QueryClient con config global
│
├── store/
│   └── uiStore.ts              ← Zustand: tab, numeroActivo, filtroLead, búsqueda
│
└── types/
    └── index.ts                ← Tipos TypeScript de toda la app
```

---

## 4. Tipos TypeScript (`src/types/index.ts`)

```ts
export type EstadoLead =
  | 'nuevo'
  | 'en_conversacion'
  | 'derivado'
  | 'frio'
  | 'visita_agendada'
  | 'recontacto'; // fallback legacy — mapear a 'derivado' en UI

export interface Contacto {
  numero: string;
  nombre: string | null;
  estado: EstadoLead;
  proyecto_interes: string | null;
  ultimo_mensaje: string | null;
  ultima_actividad: string | null; // ISO date
  total_mensajes: number;
}

export interface Mensaje {
  id?: number;
  rol: 'user' | 'assistant';
  mensaje: string;
  fecha: string; // ISO date
}

export interface Stats {
  total: number;
  conversando: number;
  derivados: number;
}

export interface Visita {
  numero: string;
  nombre: string | null;
  proyecto: string | null;
  fecha_visita: string | null;
}

// Configuración de badge por estado
export const BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  en_conversacion: { label: 'Conversando', className: 'bg-amber-100 text-amber-800' },
  derivado:        { label: 'Derivado',    className: 'bg-green-100 text-green-800' },
  frio:            { label: 'Frío',        className: 'bg-slate-100 text-slate-600' },
  visita_agendada: { label: 'Visita',      className: 'bg-blue-100 text-blue-800'  },
  nuevo:           { label: 'Nuevo',       className: 'bg-slate-100 text-slate-600' },
  recontacto:      { label: 'Derivado',    className: 'bg-green-100 text-green-800' }, // legacy
};
```

---

## 5. Axios — instancia centralizada (`src/lib/axios.ts`)

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  // En producción NEXT_PUBLIC_API_URL = '' (mismo dominio, nginx redirige /api/)
  // En desarrollo NEXT_PUBLIC_API_URL = '' también, pero Next rewrites hace proxy
});

export default api;
```

### Variables de entorno (`.env.local`)

```env
NEXT_PUBLIC_API_URL=
# Vacío en desarrollo — Next rewrite hace de proxy
# En producción también vacío — nginx maneja /api/
```

### Proxy en Next.js (`next.config.ts`)

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://n8n.menorca.pe/api/:path*',
        // Solo aplica en desarrollo local.
        // En producción el nginx del server ya redirige /api/ a donde corresponde.
      },
    ];
  },
};

export default nextConfig;
```

> **Nota:** los rewrites de Next solo corren en el servidor de Next (dev o producción con `next start`).
> Si sirves el build estático (`next export`), el proxy no funciona — en ese caso usa el proxy de nginx directamente en el servidor.

---

## 6. QueryClient (`src/lib/queryClient.ts`)

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 4_000,      // datos frescos por 4s
      refetchInterval: 5_000, // polling cada 5s (igual que el setInterval actual)
      retry: 1,
    },
  },
});
```

---

## 7. Zustand store (`src/store/uiStore.ts`)

```ts
import { create } from 'zustand';

type Tab = 'chats' | 'leads';

interface UIState {
  tab: Tab;
  setTab: (tab: Tab) => void;

  numeroActivo: string | null;
  setNumeroActivo: (numero: string | null) => void;

  filtroLead: string; // 'todos' | 'en_conversacion' | 'derivado'
  setFiltroLead: (filtro: string) => void;

  busqueda: string;
  setBusqueda: (q: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  tab: 'chats',
  setTab: (tab) => set({ tab }),

  numeroActivo: null,
  setNumeroActivo: (numeroActivo) => set({ numeroActivo }),

  filtroLead: 'todos',
  setFiltroLead: (filtroLead) => set({ filtroLead }),

  busqueda: '',
  setBusqueda: (busqueda) => set({ busqueda }),
}));
```

---

## 8. Hooks (`src/hooks/`)

### `useStats.ts`
```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Stats } from '@/types';

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => api.get('/api/stats').then(r => r.data),
  });
}
```

### `useContactos.ts`
```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Contacto } from '@/types';

const PAGE = 60;

export function useContactos() {
  return useInfiniteQuery<Contacto[]>({
    queryKey: ['contactos'],
    queryFn: ({ pageParam = 0 }) =>
      api.get('/api/contactos', { params: { limit: PAGE, offset: pageParam } })
        .then(r => {
          const d = r.data;
          return Array.isArray(d) ? d : Object.values(d).find(Array.isArray) || [];
        }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE) return undefined; // fin
      return allPages.flat().length;
    },
    initialPageParam: 0,
  });
}

// Helper para aplanar las páginas y deduplicar por número
export function flatContactos(pages: Contacto[][] = []): Contacto[] {
  const map = new Map<string, Contacto>();
  for (const page of pages)
    for (const c of page)
      map.set(c.numero, c);
  return [...map.values()].sort(
    (a, b) => new Date(b.ultima_actividad||0).getTime() - new Date(a.ultima_actividad||0).getTime()
  );
}
```

### `useConversacion.ts`
```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Mensaje } from '@/types';

export function useConversacion(numero: string | null) {
  return useInfiniteQuery<Mensaje[]>({
    queryKey: ['conversacion', numero],
    enabled: !!numero,
    queryFn: ({ pageParam = 0 }) =>
      api.get(`/api/conversacion/${numero}`, { params: { offset: pageParam } })
        .then(r => {
          const d = r.data;
          return Array.isArray(d) ? d : Object.values(d).find(Array.isArray) || [];
        }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 30) return undefined;
      return allPages.flat().length;
    },
    initialPageParam: 0,
    refetchInterval: 5_000, // polling mensajes del chat activo
  });
}
```

---

## 9. Providers (`src/app/layout.tsx`)

```tsx
'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

---

## 10. Endpoints que consume la app

| Método | Ruta | Respuesta | Notas |
|---|---|---|---|
| GET | `/api/stats` | `{ total, conversando, derivados }` | Polling cada 5s |
| GET | `/api/contactos?limit=60&offset=N` | `Contacto[]` | Scroll infinito |
| GET | `/api/conversacion/:numero?offset=N` | `Mensaje[]` | Scroll infinito + polling |
| GET | `/api/visitas` | `Visita[]` | Solo en tab visitas |

---

## 11. Comportamiento clave a implementar

### Sidebar — ContactList
- Scroll infinito: cuando el usuario llega al final, llamar `fetchNextPage()`
- Filtrar por `busqueda` (nombre o número) sobre los datos ya cargados
- Si no hay resultados locales y `busqueda` no está vacía → cargar todas las páginas hasta encontrar
- Al hacer click en un item: `setNumeroActivo(numero)` + `setTab('chats')`

### Chat — MessageList
- Los mensajes llegan en orden ASC (antiguos primero) dentro de cada página
- Al abrir un chat: scroll automático al fondo
- Scroll infinito hacia **arriba**: cuando `scrollTop < 60`, cargar página anterior (`fetchNextPage()`)
- Mantener la posición de scroll al cargar mensajes antiguos (guardar `scrollHeight` antes, restaurar después)
- Polling cada 5s solo para el `numeroActivo`

### Panel Leads
- Chips de filtro: `Todos`, `Conversando`, `Derivados` (sin Recontactos)
- Filtrar sobre `flatContactos()` ya cargados
- Al hacer click en un nombre → `setNumeroActivo()` + `setTab('chats')`

### Badge
- `recontacto` se mapea visualmente a `Derivado` (verde) — hay registros legacy en la BD
- Nunca mostrar el label "Recontacto" en la UI

### Responsive
- En móvil (`< md` en Tailwind = `< 768px`): sidebar ocupa 100% del ancho
- El panel derecho se oculta en móvil (`hidden md:flex`)
- Stats en grilla de 3 columnas

---

## 12. Paleta de colores (equivalencias Tailwind del diseño original)

| Elemento | Color original | Tailwind |
|---|---|---|
| Verde principal (accent) | `#00a884` | `emerald-500` / custom `[#00a884]` |
| Fondo app | `#f0f2f5` | `gray-100` |
| Fondo burbujas IA | `#d9fdd3` | `green-100` |
| Fondo burbujas lead | `#ffffff` | `white` |
| Fondo chat | `#efeae2` | `[#efeae2]` custom |
| Texto principal | `#111b21` | `gray-900` |
| Texto secundario | `#667781` | `gray-500` |
| Borde | `#e9edef` | `gray-200` |

---

## 13. Checklist de implementación

- [ ] `npx create-next-app@latest` con las flags indicadas
- [ ] Instalar dependencias: `axios @tanstack/react-query zustand`
- [ ] Crear `next.config.ts` con rewrite proxy
- [ ] Crear `.env.local`
- [ ] Crear `src/types/index.ts`
- [ ] Crear `src/lib/axios.ts` y `src/lib/queryClient.ts`
- [ ] Crear `src/store/uiStore.ts`
- [ ] Crear los 3 hooks en `src/hooks/`
- [ ] Envolver `layout.tsx` con `QueryClientProvider`
- [ ] Implementar componentes en orden: `Sidebar` → `StatsBar` → `ContactList` → `ChatPanel` → `LeadsPanel`
- [ ] Verificar polling (stats + mensajes activos cada 5s)
- [ ] Verificar scroll infinito en lista y en mensajes
- [ ] Verificar responsive mobile
- [ ] `npm run build` → subir `dist/` al servidor
- [ ] Migrar registros legacy: `UPDATE contactos SET estado='derivado' WHERE estado='recontacto';`
