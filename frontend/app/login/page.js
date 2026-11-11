"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Footer from "@/components/Footer";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await api("/auth/login", "POST", form);
      localStorage.setItem("token", token);
      sessionStorage.setItem("showAlerts", "1"); // dashboard shows target reminders once per login
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <img src="/logo-text.jpg" alt="PrepTrek" />
        <h1>Welcome back</h1>
        {error && <div className="error">{error}</div>}

        <div>
          <label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        <button className="btn" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
        <p>New here? <Link href="/register">Create an account</Link></p>
      </form>
      <Footer />
    </div>
  );
}
