"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertTriangle, LogIn } from "lucide-react";
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
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: "var(--background)" }}>
      <div className="card animate-fade-in" style={{ maxWidth: 450, width: "100%", padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", width: 56, height: 56, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <LogIn size={28} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Selamat Datang</h1>
          <p style={{ color: "var(--muted-foreground)" }}>Masuk ke Monev OpenSID Kab. Bandung</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              required
              placeholder="nama@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Kata Sandi</label>
            </div>
            <input
              type="password"
              className="form-input"
              required
              placeholder="Masukkan kata sandi Anda"
              style={{ marginTop: 8 }}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 8 }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
