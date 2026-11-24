const base = import.meta.env.VITE_API_URL || "/api";
export async function api(path, options = {}) {
  const response = await fetch(base + path, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response
    .json()
    .catch(() => ({
      message: "El servidor devolvió una respuesta no válida.",
    }));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(data.message || "No se pudo completar la solicitud.");
  }
  return data;
}
export const write = (path, body, method = "POST") =>
  api(path, { method, body: JSON.stringify(body) });
export const remove = (path) => api(path, { method: "DELETE" });
