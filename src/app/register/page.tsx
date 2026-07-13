"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertTriangle, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nama: formData.nama
          }
        }
      });

      if (authError) throw authError;

      // Registration successful! The trigger handles the users_app insertion.
      setSuccess(true);
      
      // Usually sign up logs the user in if email confirm is off. 
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (err: any) {
      console.error("Register Error:", err);
      setError(err.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20 }}>
        <div className="card" style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: 40 }}>
          <div style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", width: 64, height: 64, borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <UserPlus size={32} />
          </div>
          <h2 style={{ marginBottom: 12 }}>Pendaftaran Berhasil!</h2>
          <p style={{ color: "var(--muted-foreground)", marginBottom: 24 }}>
            Akun Anda telah dibuat. Anda akan dialihkan ke dashboard sesaat lagi...
          </p>
          <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto", color: "var(--primary)" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20, background: "var(--background)" }}>
      <div className="card animate-fade-in" style={{ maxWidth: 450, width: "100%", padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Buat Akun Baru</h1>
          <p style={{ color: "var(--muted-foreground)" }}>Monev OpenSID Kab. Bandung</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Masukkan nama lengkap Anda"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
          </div>

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
            <label className="form-label">Kata Sandi</label>
            <input
              type="password"
              className="form-input"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Kata Sandi</label>
            <input
              type="password"
              className="form-input"
              required
              minLength={6}
              placeholder="Ulangi kata sandi Anda"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 8 }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Daftar Sekarang"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--muted-foreground)" }}>
          Sudah punya akun?{" "}
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
