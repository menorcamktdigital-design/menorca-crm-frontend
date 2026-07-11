import type { NextConfig } from "next";

// El acceso a la API de n8n va por el route handler /api/crm/[...path],
// que inyecta el token server-side y exige sesión. Ya no se usan rewrites.
const nextConfig: NextConfig = {};

export default nextConfig;
