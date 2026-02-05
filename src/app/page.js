import Link from "next/link";
import { Brain, BookOpen, BarChart3, ArrowRight, CheckCircle2, Sparkles, Target, Zap, ShieldCheck, GraduationCap } from "lucide-react";
import "./landing.css";

export default function Home() {
  return (
    <div className="page-wrapper" style={{ background: "#F8FAFC" }}>
      {/* Premium Floating Navbar */}
      <nav className="landing-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ padding: "8px", background: "var(--color-primary)", borderRadius: "12px", color: "white" }}>
            <Sparkles size={20} fill="white" />
          </div>
          <span className="brand-name" style={{ fontWeight: 900, fontSize: "1.25rem", letterSpacing: "-0.03em", color: "#1E293B" }}>
            NEETMentor<span style={{ color: "var(--color-primary)" }}>.AI</span>
          </span>
        </div>
        <div className="nav-links-desktop">
          <Link href="/login" className="sign-in-link">Sign In</Link>
          <Link href="/login" className="btn btn-primary get-started-btn">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Modern Hero Section */}
      <header className="hero-section">
        {/* Decorative Background Elements */}
        <div style={{ position: "absolute", top: "10%", left: "5%", opacity: 0.1 }} className="hidden-mobile"><Brain size={120} /></div>
        <div style={{ position: "absolute", bottom: "10%", right: "5%", opacity: 0.1 }} className="hidden-mobile"><Target size={120} /></div>

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "8px 16px", background: "white", borderRadius: "99px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)", marginBottom: "2rem",
            border: "1px solid #E2E8F0"
          }}>
            <Zap size={16} color="#F59E0B" fill="#F59E0B" />
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Smartest Way to Crack NEET 2026
            </span>
          </div>

          <h1 className="hero-title">
            Study <span style={{ color: "var(--color-primary)" }}>Smarter</span>,<br />
            Not Just Harder.
          </h1>

          <p className="hero-subtitle">
            The first AI-powered dashboard designed exclusively for NEET aspirants.
            Automated schedules, deep analytics, and 1-on-1 AI mentorship.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn btn-primary" style={{ padding: "1.2rem 2.5rem", fontSize: "1.1rem", borderRadius: "20px", fontWeight: 900, boxShadow: "0 20px 40px -10px rgba(37, 99, 235, 0.4)" }}>
              Start Studying Now
            </Link>
            <Link href="/topics" className="btn btn-secondary" style={{ padding: "1.2rem 2.5rem", fontSize: "1.1rem", borderRadius: "20px", fontWeight: 800, background: "white" }}>
              Explore High-Yield Topics
            </Link>
          </div>

          {/* Trust Badge */}
          <div className="trust-badges">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
              <ShieldCheck size={20} /> NCERT Focused
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
              <Zap size={20} /> AI Enhanced
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
              <GraduationCap size={20} /> For NEET 2026
            </div>
          </div>
        </div>
      </header>

      {/* Premium Feature Grid */}
      <section style={{ padding: "8rem 0", background: "white" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "5rem" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
              Engineered for Selection
            </h2>
            <p style={{ color: "#64748B", fontSize: "1.1rem", fontWeight: 500 }}>Everything you need to stay organized and disciplined.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {/* Card 1 */}
            <div className="feature-card">
              <div style={{
                width: "60px", height: "60px", background: "#EFF6FF", color: "#2563EB",
                borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "2rem"
              }}>
                <Brain size={32} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>Zero-Overthinking Plan</h3>
              <p style={{ color: "#64748B", lineHeight: 1.6, fontWeight: 500 }}>
                Stop wasting hours deciding what to study. Our AI calculates your weakest points and tells you exactly which NCERT chapters to tackle today.
              </p>
            </div>

            {/* Card 2 */}
            <div className="feature-card">
              <div style={{
                width: "60px", height: "60px", background: "#F0FDF4", color: "#16A34A",
                borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "2rem"
              }}>
                <Sparkles size={32} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>Deep Test Analytics</h3>
              <p style={{ color: "#64748B", lineHeight: 1.6, fontWeight: 500 }}>
                Don't just solve mocks, learn from them. Our deep-dive analysis flags conceptual gaps, calculation errors, and "silly" mistakes automatically.
              </p>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <div style={{
                width: "60px", height: "60px", background: "#FFF7ED", color: "#EA580C",
                borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "2rem"
              }}>
                <Zap size={32} />
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem" }}>Study Streak & Grid</h3>
              <p style={{ color: "#64748B", lineHeight: 1.6, fontWeight: 500 }}>
                Build massive consistency with our LeetCode-style activity grid and study streaks. Visualize your hard work and never break the chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={{ padding: "6rem 0" }}>
        <div className="container">
          <div className="cta-box">
            <div style={{ position: "absolute", top: "-50px", right: "-50px", opacity: 0.1 }} className="hidden-mobile"><Target size={300} color="white" /></div>

            <h2 className="cta-title">
              Ready to Secure Your Seat?
            </h2>
            <p style={{ fontSize: "1.25rem", opacity: 0.7, maxWidth: "600px", margin: "0 auto 3rem", fontWeight: 500 }}>
              Join thousands of NEET aspirants who are using AI to optimize their study hours.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Link href="/login" className="btn btn-primary" style={{ padding: "1.2rem 3rem", fontSize: "1.1rem", borderRadius: "18px", fontWeight: 900, background: "white", color: "#0F172A" }}>
                Join NEETMentor AI Today
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer style={{ padding: "4rem 0", background: "white", borderTop: "1px solid #F1F5F9" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "2rem" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: "0.5rem" }}>NEETMentor AI</div>
              <p style={{ color: "#64748B", fontSize: "0.9rem", maxWidth: "300px" }}>The smartest AI companion for NEET preparation, built for medical excellence.</p>
            </div>
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: "1rem" }}>Product</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 600, color: "#475569" }}>
                  <Link href="/topics">Important Topics</Link>
                  <Link href="/plan">Study Plan</Link>
                  <Link href="/tests">Test Analytics</Link>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: "0.8rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", marginBottom: "1rem" }}>Admin</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 600, color: "#475569" }}>
                  <Link href="/login">Dashboard Login</Link>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid #F1F5F9", textAlign: "center", fontSize: "0.8rem", color: "#94A3B8", fontWeight: 600 }}>
            © 2026 NEETMentor AI. All Rights Reserved. Not affiliated with NTA or Official NEET.
          </div>
        </div>
      </footer>
    </div>
  );
}
