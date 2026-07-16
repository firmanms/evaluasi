"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Play, CheckCircle, Clock, Edit, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Play; label: string }> = {
  draft: { color: "#64748b", bg: "rgba(100,116,139,0.12)", icon: Clock, label: "Draft" },
  berjalan: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: Play, label: "Berjalan" },
  selesai: { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: CheckCircle, label: "Selesai" },
};

export default function PeriodePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPeriode, setCurrentPeriode] = useState<any>(null);
  
  // Form State
  const [namaPeriode, setNamaPeriode] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [status, setStatus] = useState("draft");
  const [tampilkanDiDepan, setTampilkanDiDepan] = useState(true);
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: periodeRes, error: err } = await supabase
        .from("periode_evaluasi")
        .select("*")
        .order("tanggal_mulai", { ascending: false });
      
      if (err) throw err;
      setData(periodeRes || []);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
      setError("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setCurrentPeriode(null);
    setNamaPeriode("");
    setTanggalMulai("");
    setTanggalSelesai("");
    setStatus("draft");
    setTampilkanDiDepan(true);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (periode: any) => {
    setCurrentPeriode(periode);
    setNamaPeriode(periode.nama_periode);
    setTanggalMulai(periode.tanggal_mulai);
    setTanggalSelesai(periode.tanggal_selesai);
    setStatus(periode.status);
    setTampilkanDiDepan(periode.tampilkan_di_depan ?? true);
    setError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (periode: any) => {
    setCurrentPeriode(periode);
    setError("");
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPeriode.trim() || !tanggalMulai || !tanggalSelesai) return;

    if (new Date(tanggalMulai) > new Date(tanggalSelesai)) {
      setError("Tanggal mulai tidak boleh lebih dari tanggal selesai.");
      return;
    }

    setFormLoading(true);
    setError("");

    const payload = {
      nama_periode: namaPeriode.trim(),
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      status,
      tampilkan_di_depan: tampilkanDiDepan
    };

    try {
      if (currentPeriode) {
        // Update
        const { error: err } = await supabase
          .from("periode_evaluasi")
          .update(payload)
          .eq("id", currentPeriode.id);
        if (err) throw err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from("periode_evaluasi")
          .insert([payload]);
        if (err) throw err;
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.code === "23505") {
        setError("Nama periode sudah digunakan!");
      } else {
        setError(err.message || "Gagal menyimpan data.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPeriode) return;
    setFormLoading(true);
    setError("");

    try {
      const { error: err } = await supabase
        .from("periode_evaluasi")
        .delete()
        .eq("id", currentPeriode.id);
      
      if (err) throw err;
      
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "Gagal menghapus data.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Periode Evaluasi</h1>
          <p className="page-subtitle">Kelola periode evaluasi berkala</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Buka Periode Baru
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
          <Loader2 className="animate-spin" style={{ margin: "0 auto", marginBottom: 8 }} />
          Memuat data periode...
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {data.length === 0 && (
            <div className="card empty-state">
              <Calendar className="empty-state-icon" />
              <p>Belum ada periode evaluasi yang dibuat.</p>
            </div>
          )}
          
          {data.map((periode) => {
            const cfg = statusConfig[periode.status] || statusConfig.draft;
            const StatusIcon = cfg.icon;
            return (
              <div key={periode.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
                {periode.status === "berjalan" && (
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                  }} />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <StatusIcon size={22} color={cfg.color} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600 }}>{periode.nama_periode}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 13, color: "var(--muted-foreground)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={14} />
                          {new Date(periode.tanggal_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span>—</span>
                        <span>
                          {new Date(periode.tanggal_selesai).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {periode.tampilkan_di_depan && (
                      <span className="badge" style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6", borderColor: "rgba(59,130,246,0.2)" }}>
                        Tampil di Depan
                      </span>
                    )}
                    <span className="badge" style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}30` }}>
                      <StatusIcon size={12} style={{ marginRight: 4 }} />
                      {cfg.label}
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(periode)}>
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-secondary btn-sm" style={{ color: "#ef4444", borderColor: "transparent" }} onClick={() => openDeleteModal(periode)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal (Add/Edit) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={currentPeriode ? "Edit Periode Evaluasi" : "Buka Periode Baru"}
        maxWidth={500}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              padding: 12, borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.1)", 
              color: "#ef4444", fontSize: 13, marginBottom: 16, display: "flex", gap: 8 
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nama Periode</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: Triwulan I 2026"
                value={namaPeriode}
                onChange={(e) => setNamaPeriode(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Tanggal Mulai</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Tanggal Selesai</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status Periode</label>
              <select 
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                disabled={formLoading}
              >
                <option value="draft">Draft (Persiapan)</option>
                <option value="berjalan">Berjalan (Evaluasi Aktif)</option>
                <option value="selesai">Selesai (Ditutup)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input 
                type="checkbox" 
                id="tampilkanDiDepan"
                checked={tampilkanDiDepan}
                onChange={(e) => setTampilkanDiDepan(e.target.checked)}
                disabled={formLoading}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <label htmlFor="tampilkanDiDepan" style={{ fontSize: 14, fontWeight: 500, cursor: "pointer", userSelect: "none" }}>
                Tampilkan di Halaman Depan (Landing Page)
              </label>
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
              disabled={formLoading || !namaPeriode.trim() || !tanggalMulai || !tanggalSelesai}
            >
              {formLoading ? <Loader2 className="animate-spin" size={16} /> : "Simpan Periode"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => !formLoading && setIsDeleteModalOpen(false)}
        title="Hapus Periode Evaluasi"
      >
        <div>
          {error && (
            <div style={{ 
              padding: 12, borderRadius: 8, backgroundColor: "rgba(239, 68, 68, 0.1)", 
              color: "#ef4444", fontSize: 13, marginBottom: 16, display: "flex", gap: 8 
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          
          <p style={{ fontSize: 14, color: "var(--foreground)", marginBottom: 24, lineHeight: 1.5 }}>
            Apakah Anda yakin ingin menghapus periode <strong>{currentPeriode?.nama_periode}</strong>? 
            <br/><br/>
            <span style={{ color: "#ef4444", fontSize: 13 }}>
              Peringatan: Semua data penilaian (*scoring*) yang tercatat pada periode ini akan ikut terhapus!
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
