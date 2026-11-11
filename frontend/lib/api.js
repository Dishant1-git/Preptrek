const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Tiny fetch wrapper: adds the token, sends JSON, throws the server's message on error
export async function api(path, method = "GET", body) {
  const token = localStorage.getItem("token");
  const res = await fetch(API_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => {
    throw new Error("Cannot reach the server. Is the backend running on " + API_URL + "?");
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
