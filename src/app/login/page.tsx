"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle, LogIn, MonitorSmartphone, Activity, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "admin@diskominfo.bandungkab.go.id",
    password: "AdminMonev123!"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Login successful!
      router.push("/dashboard");

    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Email atau kata sandi salah. Jika ini pertama kali, jalankan SQL Script Super Admin terlebih dahulu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>

      {/* Left Panel: Branding & Landing Area (Hidden on small screens) */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1.2,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          color: "white",
          overflow: "hidden"
        }}
      >
        {/* Background decorative elements */}
        <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)", borderRadius: "50%" }}></div>
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0) 70%)", borderRadius: "50%" }}></div>

        {/* Top Header */}
        <div style={{ zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #10b981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Monev Web Desa</span>
        </div>

        {/* Main Value Proposition */}
        <div style={{ zIndex: 1, maxWidth: 500 }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.2, marginBottom: 24, letterSpacing: "-0.02em" }}>
            Membangun Desa <br />
            <span style={{ background: "linear-gradient(to right, #60a5fa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Lebih Cerdas & Terhubung</span>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
            Platform monitoring dan evaluasi terpadu untuk pemanfaatan Sistem Informasi Desa (OpenSID) dan pengelolaan Website Desa di Kabupaten Bandung.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ padding: 10, background: "rgba(255,255,255,0.1)", borderRadius: 10 }}>
                <MonitorSmartphone size={20} color="#60a5fa" />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Pantau Profil Website</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Kelola data domain, server, dan ketersediaan website desa.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ padding: 10, background: "rgba(255,255,255,0.1)", borderRadius: 10 }}>
                <ShieldCheck size={20} color="#34d399" />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Evaluasi & Skoring Terpadu</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Penilaian objektif kelayakan tata kelola desa digital secara otomatis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ zIndex: 1, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          &copy; {new Date().getFullYear()} Dinas Komunikasi dan Informatika Kabupaten Bandung.
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--card)",
          position: "relative"
        }}
      >
        <div className="animate-fade-in" style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "left", marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.01em" }}>Selamat Datang Kembali</h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: 15 }}>Masuk ke akun administrator Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {error && (
              <div className="alert alert-error" style={{ fontSize: 13, padding: 12 }}>
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Alamat Email</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="form-input"
                  required
                  placeholder="admin@diskominfo.bandungkab.go.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ padding: "12px 16px", background: "var(--background)", border: "1px solid var(--border)", fontSize: 14 }}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Kata Sandi</label>
              </div>
              <input
                type="password"
                className="form-input"
                required
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ padding: "12px 16px", background: "var(--background)", border: "1px solid var(--border)", fontSize: 14 }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "14px 0",
                marginTop: 8,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)"
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Masuk ke Dashboard"}
            </button>
          </form>

          {/* Mobile view branding footer */}
          <div className="md:hidden" style={{ textAlign: "center", marginTop: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
              <Activity size={16} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Monev Web Desa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
