"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Footer from "@/components/Footer";
import { EXAMS } from "@/lib/exams";

export default function Register() {
  const [form, setForm] = useState({
    name: "", email: "", domain: "", gender: "", phone: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const { token } = await api("/auth/register", "POST", form);
      localStorage.setItem("token", token);
      router.push("/trackers"); // new users start by adding what they want to track
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <img src="/logo-text.jpg" alt="PrepTrek" />
        <h1>Start your prep journey</h1>
        {error && <div className="error">{error}</div>}

        <div>
          <label>Full name</label>
          <input required value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label>Email</label>
          <input type="email" required value={form.email} onChange={set("email")} />
        </div>

        <div className="row-2">
          <div>
            <label>Exam you're preparing for</label>
            <select required value={form.domain} onChange={set("domain")}>
              <option value="">Select…</option>
              {Object.entries(EXAMS).map(([group, exams]) => (
                <optgroup key={group} label={group}>
                  {exams.map((exam) => <option key={exam}>{exam}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label>Gender</label>
            <select required value={form.gender} onChange={set("gender")}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label>Phone number</label>
          <input type="tel" required value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
        </div>

        <div className="row-2">
          <div>
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={set("password")} />
          </div>
          <div>
            <label>Confirm password</label>
            <input type="password" required value={form.confirmPassword} onChange={set("confirmPassword")} />
          </div>
        </div>

        <button className="btn" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
        <p>Already registered? <Link href="/login">Log in</Link></p>
      </form>
      <Footer />
    </div>
  );
}
