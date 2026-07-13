"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Edit2, Trash2, Shield, Search, Loader2, AlertTriangle, Save, Globe, Building2, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";
import type { RoleUser } from "@/lib/types";

const roleConfig: Record<RoleUser, { label: string; color: string; bg: string }> = {
  super_admin: { label: "Super Admin", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  admin_kecamatan: { label: "Admin Kecamatan", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  operator_desa: { label: "Operator Desa", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  viewer: { label: "Viewer", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
};

export default function PenggunaPage() {
  const [data, setData] = useState<any[]>([]);
  const [kecamatanList, setKecamatanList] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    nama: "",
    email: "",
    role: "viewer" as RoleUser,
    kecamatan_id: "",
    desa_id: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      // 1. Fetch users_app joined with desa and kecamatan
      const { data: users, error: uErr } = await supabase
        .from("users_app")
        .select("*, desa(nama_desa), kecamatan(nama_kecamatan)")
        .order("created_at", { ascending: false });

      if (uErr) throw uErr;
      setData(users || []);

      // 2. Fetch kecamatan & desa lists for dropdowns
      const [kecRes, desaRes] = await Promise.all([
        supabase.from("kecamatan").select("id, nama_kecamatan").order("nama_kecamatan"),
        supabase.from("desa").select("id, nama_desa, kecamatan_id, kecamatan(nama_kecamatan)").order("nama_desa")
      ]);

      if (kecRes.data) setKecamatanList(kecRes.data);
      if (desaRes.data) {
        const flatDesa = desaRes.data.map((d: any) => ({
          id: d.id,
          nama_desa: d.nama_desa,
          kecamatan_id: d.kecamatan_id,
          nama_kecamatan: d.kecamatan?.nama_kecamatan
        }));
        setDesaList(flatDesa);
      }

    } catch (err) {
      console.error("Fetch initial error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const { data: users, error: uErr } = await supabase
        .from("users_app")
        .select("*, desa(nama_desa), kecamatan(nama_kecamatan)")
        .order("created_at", { ascending: false });

      if (uErr) throw uErr;
      setData(users || []);
    } catch (err) {
      console.error(err);
    }
  }

  const openAddModal = () => {
    setError("");
    setFormData({
      id: "",
      nama: "",
      email: "",
      role: "viewer",
      kecamatan_id: "",
      desa_id: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setError("");
    setFormData({
      id: item.id,
      nama: item.nama,
      email: item.email,
      role: item.role || "viewer",
      kecamatan_id: item.kecamatan_id || "",
      desa_id: item.desa_id || ""
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (item: any) => {
    setError("");
    setFormData({ ...formData, id: item.id, nama: item.nama });
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        nama: formData.nama,
        role: formData.role,
        kecamatan_id: formData.role === "admin_kecamatan" ? formData.kecamatan_id : null,
        desa_id: formData.role === "operator_desa" ? formData.desa_id : null,
      };

      if (formData.id) {
        // Edit existing profile
        const { error } = await supabase
          .from("users_app")
          .update(payload)
          .eq("id", formData.id);

        if (error) throw error;
      } else {
        setError("Penambahan user baru secara manual dinonaktifkan untuk menjaga keamanan auth. Silakan instruksikan pengguna baru untuk Sign Up secara mandiri, lalu Admin dapat mengatur Peran dan Wilayahnya di sini.");
        setSaving(false);
        return;
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Save error:", err);
      setError("Gagal menyimpan profil pengguna.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("users_app").delete().eq("id", formData.id);
      if (error) throw error;
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError("Gagal menghapus profil pengguna.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = data.filter(
    (u) =>
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Role Counts
  const counts = (Object.keys(roleConfig) as RoleUser[]).reduce((acc, role) => {
    acc[role] = data.filter((u) => u.role === role).length;
    return acc;
  }, {} as Record<RoleUser, number>);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Manajemen Pengguna</h1>
          <p className="page-subtitle">Kelola akun pengguna, peran, dan hak akses wilayah</p>
        </div>
      </div>

      {/* Role Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {(Object.keys(roleConfig) as RoleUser[]).map((role) => {
          const cfg = roleConfig[role];
          const count = counts[role] || 0;
          return (
            <div key={role} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Shield size={20} color={cfg.color} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: cfg.color }}>{count}</div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{cfg.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="search-box" style={{ flex: "1 1 250px", maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Cari pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", padding: "8px 12px", borderRadius: 8, maxWidth: 500 }}>
          💡 <strong>Catatan:</strong> Akun baru harus mendaftar secara mandiri via halaman registrasi. Setelah terdaftar, ubah peran dan wilayah tugas mereka di sini.
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--muted-foreground)" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Pengguna</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Wilayah Tugas</th>
                  <th style={{ width: 100, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const cfg = roleConfig[user.role as RoleUser] || roleConfig.viewer;
                  
                  let wilayah = "Kabupaten";
                  if (user.role === "admin_kecamatan") {
                    wilayah = user.kecamatan?.nama_kecamatan ? `Kec. ${user.kecamatan.nama_kecamatan}` : "Kecamatan tidak diatur";
                  } else if (user.role === "operator_desa") {
                    wilayah = user.desa?.nama_desa ? `Desa ${user.desa.nama_desa}` : "Desa tidak diatur";
                  }

                  return (
                    <tr key={user.id}>
                      <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}aa)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: 13, fontWeight: 700,
                          }}>
                            {user.nama?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500 }}>{user.nama}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--muted-foreground)" }}>{user.email}</td>
                      <td>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>{wilayah}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button className="btn-ghost" style={{ padding: 6, color: "var(--primary)" }} onClick={() => openEditModal(user)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-ghost" style={{ padding: 6, color: "#ef4444" }} onClick={() => openDeleteModal(user)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)" }}>
                      Tidak ada data pengguna.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ubah Hak Akses Pengguna"
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Nama Pengguna</label>
            <input
              type="text"
              className="form-input"
              required
              disabled
              value={formData.nama}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              required
              disabled
              value={formData.email}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Peran / Role *</label>
            <select
              className="form-select"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleUser })}
            >
              <option value="viewer">Viewer (Hanya Melihat)</option>
              <option value="operator_desa">Operator Desa (Input Penilaian Desa)</option>
              <option value="admin_kecamatan">Admin Kecamatan (Melihat & Evaluasi Desa)</option>
              <option value="super_admin">Super Admin (Akses Penuh)</option>
            </select>
          </div>

          {formData.role === "admin_kecamatan" && (
            <div className="form-group">
              <label className="form-label">Wilayah Kecamatan Tugas *</label>
              <select
                className="form-select"
                required
                value={formData.kecamatan_id}
                onChange={(e) => setFormData({ ...formData, kecamatan_id: e.target.value })}
              >
                <option value="">Pilih Kecamatan...</option>
                {kecamatanList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === "operator_desa" && (
            <div className="form-group">
              <label className="form-label">Wilayah Desa Tugas *</label>
              <select
                className="form-select"
                required
                value={formData.desa_id}
                onChange={(e) => setFormData({ ...formData, desa_id: e.target.value })}
              >
                <option value="">Pilih Desa...</option>
                {desaList.map((d) => (
                  <option key={d.id} value={d.id}>{d.nama_desa} ({d.nama_kecamatan})</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Profil Pengguna"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p>
            Apakah Anda yakin ingin menghapus profil pengguna <strong>{formData.nama}</strong> dari aplikasi?
            Pengguna tersebut tidak akan bisa menggunakan fitur aplikasi ini sebelum dibuatkan profil baru.
          </p>
          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={saving}>
              Batal
            </button>
            <button className="btn btn-primary" style={{ background: "#ef4444" }} onClick={handleDelete} disabled={saving}>
              {saving ? "Menghapus..." : "Ya, Hapus Profil"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
