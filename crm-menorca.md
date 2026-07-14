# CRM Menorca — Frontend · Contexto del proyecto

> Visor/CRM de leads del agente IA de WhatsApp (Menorca). Next.js 15 (App Router) + React Query + Zustand + Tailwind. El backend real es n8n.

---

## 1. Estructura del proyecto

```
src/
├─ app/                          ← App Router: cada carpeta = una URL
│  ├─ (app)/                     ← grupo de rutas (los paréntesis NO afectan la URL)
│  │  ├─ page.tsx                ← "/"               → Dashboard (gráficas, KPIs)
│  │  ├─ conversaciones/page.tsx ← "/conversaciones" → Chats + tabla de Leads
│  │  └─ layout.tsx              ← envoltura común: guard de sesión client-side + estructura
│  ├─ api/crm/[...path]/route.ts ← "/api/crm/*" → PROXY server-side hacia n8n (ver §2)
│  ├─ login/page.tsx             ← "/login" (por ahora login falso, ver §5)
│  ├─ layout.tsx                 ← raíz (html, fuentes)
│  ├─ providers.tsx              ← monta React Query (caché de datos)
│  └─ globals.css
├─ components/
│  ├─ dashboard/                 ← StatTiles, EstadoDonut, PlazaBar, ActividadChart, PlazaFilter...
│  ├─ leads/                     ← LeadsPanel (paginación), LeadsTable, LeadsExport (CSV), FilterChips
│  ├─ chat/                      ← panel de conversación
│  ├─ sidebar/                   ← lista de contactos (scroll infinito)
│  └─ ui/                        ← piezas genéricas: Avatar, Badge, SearchSelect (select con buscador)...
├─ hooks/
│  ├─ useContactos.ts            ← lista paginada (scroll infinito p/ chats + useContactosPagina p/ tabla)
│  └─ useTodosContactos.ts       ← descarga la base COMPLETA (dashboard y export CSV)
├─ lib/
│  ├─ axios.ts                   ← cliente HTTP; baseURL vacío = mismo dominio (ver §3)
│  ├─ proyectos.ts               ← lista OFICIAL de proyectos + normalización de texto libre (ver §6)
│  ├─ csv.ts                     ← generación/descarga de CSV
│  └─ queryClient.ts
├─ store/                        ← estado global (zustand)
│  ├─ authStore.ts               ← sesión (por ahora solo UI, ver §5)
│  └─ uiStore.ts                 ← tab activa, chat abierto, filtros
├─ types/                        ← tipos TypeScript compartidos (Contacto, EstadoLead...)
└─ proxy.ts                      ← middleware: sin cookie de sesión redirige a /login
```

---

## 2. Flujo de datos: el proxy `/api/crm`

**El navegador NUNCA habla directo con n8n.** El flujo es:

```
Navegador → GET /api/crm/contactos            (mismo dominio, sin token)
          → route.ts verifica cookie de sesión
          → agrega "Authorization: Bearer CRM_API_TOKEN"  (server-side)
          → reenvía a  CRM_API_URL/contactos   (n8n)
          → devuelve la respuesta al navegador
```

¿Por qué? El token del CRM vive solo en el servidor (`.env.local`). Si el
navegador llamara a n8n directo, cualquiera vería el token en DevTools y
podría descargar toda la base de leads. Además el proxy exige la cookie de
sesión: sin login no hay datos.

Archivo: `src/app/api/crm/[...path]/route.ts`. El `[...path]` es un
catch-all: `/api/crm/contactos`, `/api/crm/mensajes/123`, etc. — todo pasa
por ahí.

---

## 3. Variables de entorno (`.env.local`)

```
CRM_API_URL=https://n8n.menorca.pe/api/crm/v1    ← a dónde apunta el proxy
CRM_API_TOKEN=<token>                            ← secreto, solo server
```

Reglas clave de Next.js:

- **Sin prefijo `NEXT_PUBLIC_`** → la variable solo existe en el servidor. Segura.
- **Con `NEXT_PUBLIC_`** → se incrusta en el JS del navegador **al hacer build**.
  Cualquiera la ve en DevTools. **NUNCA poner el token con este prefijo.**
- Las env se leen en build/arranque: si cambias el `.env.local` hay que
  volver a hacer `npm run build` (reiniciar pm2 no basta).

`lib/axios.ts` tiene `baseURL: process.env.NEXT_PUBLIC_API_URL || ""` — en
la práctica la variable **no se define nunca** y el baseURL queda vacío:
las llamadas van al mismo dominio (`/api/crm/...`), o sea al proxy.

---

## 4. Deploy en el servidor

```bash
# .env.local del server = IDÉNTICO al local, sin ninguna NEXT_PUBLIC_
cat > /ruta/de/la/app/.env.local << 'EOF'
CRM_API_URL=https://n8n.menorca.pe/api/crm/v1
CRM_API_TOKEN=<token>
EOF

cd /ruta/de/la/app
npm run build        # obligatorio tras cambiar env
pm2 restart crm
```

**Error ya vivido (2026-07-13):** en el server se definió
`NEXT_PUBLIC_API_URL=https://n8n.menorca.pe/api/crm/v1`. El navegador
entonces se saltó el proxy y llamó directo a n8n sin token →
`401 Unauthorized` y URL duplicada (`.../api/crm/v1/api/crm/contactos`).
Solución: borrar toda variable `NEXT_PUBLIC_*`, dejar solo las 2 de arriba
y rebuild.

**Pendiente de deploy:** hoy se entra por IP y HTTP plano
(`http://165.22.187.203:3001`, "No es seguro"). Falta: dominio + nginx como
reverse proxy + certificado SSL (Let's Encrypt, gratis).

---

## 5. Login

### Estado actual (login FALSO — solo para desarrollo)

- `src/app/login/page.tsx`: **cualquier usuario/contraseña entra**. No hay
  verificación contra ningún backend.
- Al "entrar" se guarda el nombre en localStorage (`store/authStore.ts`,
  zustand persist) y se crea la cookie `menorca_session=1`.
- Esa cookie la revisan `src/proxy.ts` (protege las páginas) y
  `route.ts` (protege la API), pero es **solo una bandera, no un token
  verificable**: alguien con conocimientos técnicos puede crearla a mano.
- Conclusión: sirve para desarrollo, **no es seguridad real para producción**.

### Plan: login con AD (Active Directory / Microsoft Entra ID)

AD = el directorio de usuarios de la empresa (las mismas credenciales del
correo corporativo / Windows). Flujo objetivo:

1. La pantalla de login pasa a un botón **"Iniciar sesión con Microsoft"**.
2. Redirige a la página de Microsoft → correo corporativo + contraseña (+ MFA).
3. Microsoft verifica la identidad y devuelve un token firmado.
4. El servidor crea una cookie de sesión REAL (httpOnly, firmada, no falsificable).

Ventajas: la app no gestiona contraseñas; si dan de baja a alguien en la
empresa pierde acceso automático; se puede restringir por grupo de AD
(ej. solo ventas).

### Qué falta para implementarlo

| # | Tarea | Quién |
|---|-------|-------|
| 1 | Registrar la app en Azure (Microsoft Entra ID) y obtener `AUTH_MICROSOFT_ENTRA_ID_ID` (client id), `..._SECRET` (client secret) y `..._ISSUER` (tenant id) | TI de la empresa |
| 2 | Instalar y configurar **Auth.js (NextAuth)** con el provider Microsoft Entra ID | dev |
| 3 | Reemplazar la pantalla de login por el botón de Microsoft | dev |
| 4 | Reemplazar `authStore.login()` falso por la sesión real de Auth.js | dev |
| 5 | En `src/proxy.ts` y `route.ts`: validar la sesión real de Auth.js en vez de la cookie-bandera `menorca_session` | dev |
| 6 | (Opcional) Restringir acceso por grupo/rol de AD | dev + TI |

El resto de la app (dashboard, chats, leads, export) **no se toca** — la
estructura ya quedó preparada para este cambio.

---

## 6. Proyectos / plazas (`lib/proyectos.ts`)

- `proyecto_interes` en la BD es **texto libre** que escribe el agente IA →
  llega con variantes ("Costalinda", "Condominio Caleta San Antonio",
  typos, varios proyectos en un campo: "A, B", "Olivar 2 y 3").
- Existe una **lista oficial de 22 proyectos** (fuente: Notion) en la
  constante `PROYECTOS`. Los filtros muestran SOLO esa lista.
- Todo texto libre se normaliza y se mapea contra la lista oficial
  (ignorando acentos, guiones, mayúsculas; por contención de nombre).
- Categorías especiales:
  - **"Sin proyecto"** = el lead escribió pero nunca declaró proyecto (campo vacío).
  - **"Otros"** = declaró algo que no coincide con la lista oficial
    (ej. "Praderas El Olivar" sin número, ambiguo entre 2 y 3). En la
    gráfica del dashboard "Otros" también acumula lo que queda fuera del top 8.
- Si mañana hay un proyecto nuevo: agregarlo al array `PROYECTOS`.

---

## 7. Decisiones de UI recientes (2026-07-12)

- **Tabla de leads con paginación clásica de 50** (`useContactosPagina`,
  pide 51 filas para saber si hay página siguiente — la API no devuelve
  total). El scroll infinito se mantiene solo en el sidebar de chats.
- **Clic solo en el NOMBRE abre el chat** — el resto de la fila (número,
  proyecto) es seleccionable; el número se selecciona completo con un clic
  (`select-all`) para copiarlo.
- **`SearchSelect`** (`components/ui/`): select propio con buscador
  (ignora acentos), teclado (flechas/Enter/Esc) y check en la opción
  activa. Se usa en el filtro de plazas del dashboard y en el export.
- **Export CSV** (`LeadsExport`): filtros de estado, proyecto (lista
  oficial) y rango de fechas; el nombre del archivo refleja los filtros.
- Estado `recontacto` en BD es legacy → se cuenta como `derivado`.
