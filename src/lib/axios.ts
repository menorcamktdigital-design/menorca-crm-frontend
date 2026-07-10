import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  // En producción NEXT_PUBLIC_API_URL = '' (mismo dominio, nginx redirige /api/)
  // En desarrollo NEXT_PUBLIC_API_URL = '' también, pero Next rewrites hace proxy
});

export default api;
