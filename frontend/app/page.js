import Link from "next/link";
import Footer from "@/components/Footer";
import GhostAd from "@/components/GhostAd";

export default function Home() {
  return (
    <div className="landing">
      <img src="/logo-text.jpg" alt="PrepTrek" />
      <p>
        Your preparation, in one place. Track your syllabus, time every study session,
        set targets and watch your progress grow — month by month.
      </p>

      <div className="features">
        <div>📚 Syllabus trackers</div>
        <div>📊 Custom dashboard</div>
        <div>⏱️ Study timer</div>
        <div>🎯 Targets & reminders</div>
        <div>🏆 Badges & levels</div>
      </div>

      <div className="actions">
        <Link href="/register" className="btn">Get started</Link>
        <Link href="/login" className="btn-ghost">I have an account</Link>
      </div>
      <div style={{ width: 260 }}><GhostAd /></div>
      <Footer />
    </div>
  );
}
