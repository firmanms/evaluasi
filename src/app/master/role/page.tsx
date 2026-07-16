"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Edit2, Trash2, Search, Loader2, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";

// Daftar modul statis yang ada di aplikasi
const MODULES = [
  { key: "/dashboard", label: "Dashboard Utama" },
  { key: "/master/kecamatan", label: "Master Kecamatan" },
  { key: "/master/desa", label: "Master Desa" },
  { key: "/master/server", label: "Master Server" },
  { key: "/master/indikator", label: "Master Indikator" },
  { key: "/master/aspek", label: "Master Aspek & Bobot" },
  { key: "/master/periode", label: "Master Periode Evaluasi" },
  { key: "/master/role", label: "Master Role & Hak Akses" },
  { key: "/profilwebdesa", label: "Dashboard Website (Evaluasi)" },
  { key: "/profil-website", label: "Profil Website Desa" },
  { key: "/penilaian", label: "Input Penilaian (Scoring)" },
  { key: "/hasil-evaluasi", label: "Hasil Evaluasi" },
  { key: "/monitoring", label: "Monitoring Teknis" },
  { key: "/kendala", label: "Kendala & Tindak Lanjut" },
  { key: "/laporan", label: "Laporan & Ekspor" },
  { key: "/pengguna", label: "Manajemen Pengguna" },
];

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [namaRole, setNamaRole] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [baseRole, setBaseRole] = useState("viewer");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    setError("");
    try {
      const { data: res, error: err } = await supabase
        .from("roles_app")
        .select("*")
        .order("nama_role", { ascending: true });

      if (err) throw err;
      setRoles(res || []);
    } catch (err: any) {
      console.error("Fetch roles error:", err);
      setError("Gagal memuat data role. Pastikan Anda telah menjalankan migrasi SQL untuk tabel roles_app.");
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setCurrentRole(null);
    setNamaRole("");
    setDeskripsi("");
    setBaseRole("viewer");
    setSelectedPermissions(["/dashboard"]); // dashboard diijinkan secara default
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (role: any) => {
    setCurrentRole(role);
    setNamaRole(role.nama_role);
    setDeskripsi(role.deskripsi || "");
    setBaseRole(role.base_role || "viewer");
    setSelectedPermissions(role.permissions || []);
    setFormError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (role: any) => {
    setCurrentRole(role);
    setIsDeleteModalOpen(true);
  };

  const togglePermission = (key: string) => {
    if (key === "/dashboard") return; // Dashboard selalu diaktifkan
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedPermissions.length === MODULES.length) {
      setSelectedPermissions(["/dashboard"]);
    } else {
      setSelectedPermissions(MODULES.map(m => m.key));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaRole.trim()) return;

    setFormLoading(true);
    setFormError("");

    const formattedRoleName = namaRole.trim().toLowerCase().replace(/\s+/g, "_");

    const payload = {
      nama_role: formattedRoleName,
      deskripsi: deskripsi.trim(),
      base_role: baseRole,
      permissions: selectedPermissions,
    };

    try {
      if (currentRole) {
        // Prevent editing super_admin name to avoid locking out admin
        if (currentRole.nama_role === "super_admin" && formattedRoleName !== "super_admin") {
          throw new Error("Nama role 'super_admin' tidak boleh diubah.");
        }

        const { error: err } = await supabase
          .from("roles_app")
          .update(payload)
          .eq("id", currentRole.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("roles_app")
          .insert([payload]);
        if (err) throw err;
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      console.error("Save role error:", err);
      if (err.code === "23505") {
        setFormError("Nama role sudah terdaftar!");
      } else {
        setFormError(err.message || "Gagal menyimpan role.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentRole) return;
    if (currentRole.nama_role === "super_admin") {
      setFormError("Role 'super_admin' bawaan sistem tidak boleh dihapus.");
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const { error: err } = await supabase
        .from("roles_app")
        .delete()
        .eq("id", currentRole.id);
      if (err) throw err;

      setIsDeleteModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      console.error("Delete role error:", err);
      setFormError(err.message || "Gagal menghapus role.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Manajemen Role & Hak Akses</h1>
          <p className="page-subtitle">Kelola role pengguna dinamis beserta modul hak aksesnya</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Role Baru
        </button>
      </div>

      {error && (
        <div style={{ padding: 16, borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#ef4444", fontSize: 14, display: "flex", gap: 8, border: "1px solid rgba(239, 68, 68, 0.15)" }}>
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
          <Loader2 className="animate-spin" style={{ margin: "0 auto", marginBottom: 8 }} />
          Memuat data role & hak akses...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {roles.map((role) => (
            <div key={role.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "capitalize", color: role.nama_role === "super_admin" ? "#ef4444" : "var(--foreground)" }}>
                    {role.nama_role.replace(/_/g, " ")}
                  </h3>
                  <span className="badge" style={{ 
                    background: role.nama_role === "super_admin" ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)", 
                    color: role.nama_role === "super_admin" ? "#ef4444" : "#3b82f6" 
                  }}>
                    {role.permissions?.length || 0} Modul
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 16 }}>
                  {role.deskripsi || "Tidak ada deskripsi."}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                  Base: <code style={{ background: "var(--muted)", padding: "2px 6px", borderRadius: 4 }}>{role.base_role || "viewer"}</code>
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(role)}>
                    <Edit2 size={13} /> Edit
                  </button>
                  {role.nama_role !== "super_admin" && (
                    <button className="btn btn-secondary btn-sm" style={{ color: "#ef4444", borderColor: "transparent" }} onClick={() => openDeleteModal(role)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={currentRole ? "Edit Role & Hak Akses" : "Tambah Role Baru"}
        maxWidth={600}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: 13, marginBottom: 16, display: "flex", gap: 8 }}>
              <AlertTriangle size={16} /> {formError}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nama Role</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Operator Desa"
                value={namaRole}
                onChange={(e) => setNamaRole(e.target.value)}
                required
                disabled={formLoading || (currentRole?.nama_role === "super_admin")}
              />
              <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4, display: "block" }}>
                Nama role akan diformat otomatis menjadi huruf kecil dan menggunakan underscore (contoh: operator_desa).
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <textarea
                className="form-input"
                style={{ minHeight: 80, resize: "vertical" }}
                placeholder="Tuliskan keterangan mengenai fungsi role ini..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                disabled={formLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Base Role (Peran Dasar RLS)*</label>
              <select
                className="form-select"
                value={baseRole}
                onChange={(e) => setBaseRole(e.target.value)}
                required
                disabled={formLoading || (currentRole?.nama_role === "super_admin")}
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin_kecamatan">Admin Kecamatan</option>
                <option value="operator_desa">Operator Desa</option>
                <option value="viewer">Viewer</option>
              </select>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4, display: "block" }}>
                Peran dasar digunakan oleh database untuk mengevaluasi hak keamanan data (Row Level Security).
              </span>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0 }}>Hak Akses Modul / Fitur</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={toggleSelectAll}>
                  {selectedPermissions.length === MODULES.length ? "Hapus Semua" : "Pilih Semua"}
                </button>
              </div>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", 
                gap: 10, 
                maxHeight: 280, 
                overflowY: "auto",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                background: "var(--background)"
              }}>
                {MODULES.map((mod) => {
                  const isChecked = selectedPermissions.includes(mod.key);
                  return (
                    <div 
                      key={mod.key} 
                      onClick={() => togglePermission(mod.key)}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 8, 
                        padding: "6px 8px", 
                        borderRadius: 6, 
                        cursor: mod.key === "/dashboard" ? "not-allowed" : "pointer",
                        background: isChecked ? "rgba(59,130,246,0.06)" : "transparent",
                        opacity: mod.key === "/dashboard" ? 0.7 : 1
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} color="var(--primary)" />
                      ) : (
                        <Square size={16} color="var(--muted-foreground)" />
                      )}
                      <span style={{ fontSize: 13, fontWeight: isChecked ? 600 : 400 }}>{mod.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={formLoading || !namaRole.trim()}
            >
              {formLoading ? <Loader2 className="animate-spin" size={16} /> : "Simpan Role"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !formLoading && setIsDeleteModalOpen(false)}
        title="Hapus Role"
      >
        <div>
          {formError && (
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: 13, marginBottom: 16, display: "flex", gap: 8 }}>
              <AlertTriangle size={16} /> {formError}
            </div>
          )}

          <p style={{ fontSize: 14, color: "var(--foreground)", marginBottom: 24, lineHeight: 1.5 }}>
            Apakah Anda yakin ingin menghapus role <strong style={{ textTransform: "capitalize" }}>{currentRole?.nama_role.replace(/_/g, " ")}</strong>?
            <br/><br/>
            <span style={{ color: "#ef4444", fontSize: 13 }}>
              Peringatan: Pengguna yang saat ini memiliki role ini mungkin akan kehilangan hak akses jika role ini dihapus!
            </span>
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={formLoading}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, backgroundColor: "#ef4444", border: "none" }}
              onClick={handleDelete}
              disabled={formLoading}
            >
              {formLoading ? <Loader2 className="animate-spin" size={16} /> : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
