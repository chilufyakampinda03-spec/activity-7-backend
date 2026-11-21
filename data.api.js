// OPTIONAL (Activity 8): replace your data.js with this file (rename it to data.js).
// Then set backendBaseUrl in config.js, e.g. "https://your-backend.onrender.com" (no trailing slash).
import { config } from "./config.js";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(config.backendBaseUrl + path, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
  } catch {
    throw new Error("Could not reach the server. It may be starting up; try again shortly.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Request failed.");
  return body;
}

export const recordService = {
  list: () => request("/api/records"),
  get: (id) => request(`/api/records/${id}`),
  create: (record) => request("/api/records", { method: "POST", body: JSON.stringify(record) }),
  update: (id, record) => request(`/api/records/${id}`, { method: "PUT", body: JSON.stringify(record) }),
  remove: (id) => request(`/api/records/${id}`, { method: "DELETE" })
};
