import axios from "axios";

const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
const apiUrl = env.VITE_API_URL?.trim().replace(/^["']|["']$/g, "");
const baseURL = apiUrl ? `${apiUrl.replace(/\/$/, "")}/api` : "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
