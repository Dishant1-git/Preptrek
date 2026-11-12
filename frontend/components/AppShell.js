"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Footer from "./Footer";
import GhostAd from "./GhostAd";

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/trackers", label: "Trackers", icon: "📚" },
  { href: "/mcq", label: "MCQ Practice", icon: "📝" },
  { href: "/flashcards", label: "Flashcards", icon: "🧠" },
  { href: "/timeline", label: "Timeline", icon: "🗓️" },
  { href: "/timer", label: "Study Timer", icon: "⏱️" },
  { href: "/targets", label: "Targets", icon: "🎯" },
  { href: "/rewards", label: "Rewards", icon: "🏆" },
];

// Wraps every logged-in page: checks the token, loads the user, draws the sidebar
export default function AppShell({ children }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) return router.replace("/login");
    api("/auth/me").then(setUser).catch(() => router.replace("/login"));
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  if (!user) return <div className="loading">Loading your prep…</div>;

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <div className="shell">
        <aside className="sidebar">
          <img src="/logo-text.jpg" alt="PrepTrek" className="sidebar-logo" />
          <p className="today">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <nav>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
                <span>{l.icon}</span> {l.label}
              </Link>
            ))}
          </nav>
          <GhostAd />
          <div className="sidebar-user">
            <div className="avatar">{user.name[0].toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.domain}</small>
            </div>
          </div>
          <button className="btn-ghost" onClick={logout}>Log out</button>
        </aside>
        <main className="content">
          {children}
          <Footer />
        </main>
      </div>
    </UserContext.Provider>
  );
}
