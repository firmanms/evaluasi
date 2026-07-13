"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";

const aspekColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function IndikatorPage() {
  const [filterAspek, setFilterAspek] = useState("");
  const [search, setSearch] = useState("");
  
  const [data, setData] = useState<any[]>([]);
  const [aspekData, setAspekData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentInd, setCurrentInd] = useState<any>(null);
  
  // Form State
  const [kode, setKode] = useState("");
  const [namaIndikator, setNamaIndikator] = useState("");
  const [aspekId, setAspekId] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [bobot, setBobot] = useState<number>(0);
  const [aktif, setAktif] = useState(true);
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [indRes, aspekRes] = await Promise.all([
        supabase.from("master_indikator").select("*, master_aspek(nama_aspek)").order("kode"),
        supabase.from("master_aspek").select("*").order("created_at")
      ]);
      
      if (indRes.error) throw indRes.error;
      if (aspekRes.error) throw aspekRes.error;

      setData(indRes.data || []);
      setAspekData(aspekRes.data || []);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
      setError("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setCurrentInd(null);
    setKode("");
    setNamaIndikator("");
    setAspekId(filterAspek || "");
    setDeskripsi("");
    setBobot(0);
    setAktif(true);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (ind: any) => {
    setCurrentInd(ind);
    setKode(ind.kode);
    setNamaIndikator(ind.nama_indikator);
    setAspekId(ind.aspek_id);
    setDeskripsi(ind.deskripsi || "");
    setBobot(ind.bobot);
    setAktif(ind.aktif);
    setError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (ind: any) => {
    setCurrentInd(ind);
    setError("");
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim() || !namaIndikator.trim() || !aspekId) return;

    setFormLoading(true);
    setError("");

    const payload = {
      kode: kode.trim(),
      nama_indikator: namaIndikator.trim(),
      aspek_id: aspekId,
      deskripsi: deskripsi.trim() || null,
      bobot: Number(bobot),
      aktif
    };

    try {
      if (currentInd) {
        // Update
        const { error: err } = await supabase
          .from("master_indikator")
          .update(payload)
          .eq("id", currentInd.id);
        if (err) throw err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from("master_indikator")
          .insert([payload]);
        if (err) throw err;
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.code === "23505") {
        setError("Kode Indikator tersebut sudah digunakan!");
      } else {
        setError(err.message || "Gagal menyimpan data.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentInd) return;
    setFormLoading(true);
    setError("");

    try {
      const { error: err } = await supabase
        .from("master_indikator")
        .delete()
        .eq("id", currentInd.id);
      
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

  const filtered = data.filter((ind) => {
    const matchSearch = ind.nama_indikator.toLowerCase().includes(search.toLowerCase()) || 
                        ind.kode.toLowerCase().includes(search.toLowerCase());
    const matchAspek = filterAspek ? ind.aspek_id === filterAspek : true;
    return matchSearch && matchAspek;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Master Indikator</h1>
          <p className="page-subtitle">Indikator penilaian umum website desa ({data.length} indikator)</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Indikator
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div className="search-box" style={{ flex: "1 1 200px" }}>
            <Search size={16} />
            <input
              placeholder="Cari indikator atau kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 200, padding: "8px 12px" }}
            value={filterAspek}
            onChange={(e) => setFilterAspek(e.target.value)}
          >
            <option value="">Semua Aspek</option>
            {aspekData.map((a) => (
              <option key={a.id} value={a.id}>{a.nama_aspek}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
            <Loader2 className="animate-spin" style={{ margin: "0 auto", marginBottom: 8 }} />
            Memuat data...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Kode</th>
                  <th>Nama Indikator</th>
                  <th>Aspek</th>
                  <th style={{ width: 80, textAlign: "center" }}>Bobot</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ind) => {
                  const aspekIndex = aspekData.findIndex((a) => a.id === ind.aspek_id);
                  const color = aspekColors[aspekIndex % aspekColors.length] || "#94a3b8";
                  return (
                    <tr key={ind.id}>
                      <td>
                        <span className="badge" style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "var(--font-geist-mono)" }}>
                          {ind.kode}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>{ind.nama_indikator}</div>
                          {ind.deskripsi && (
                            <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                              {ind.deskripsi}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: `${color}15`,
                          color: color,
                          borderColor: `${color}30`,
                        }}>
                          {ind.master_aspek?.nama_aspek || "-"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, textAlign: "center" }}>{ind.bobot}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className={`status-dot ${ind.aktif ? "status-dot-green" : "status-dot-red"}`} />
                          <span style={{ fontSize: 13 }}>{ind.aktif ? "Aktif" : "Nonaktif"}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEditModal(ind)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Hapus" style={{ color: "#ef4444" }} onClick={() => openDeleteModal(ind)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !error && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--muted-foreground)" }}>
                      Tidak ada data indikator.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal (Add/Edit) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={currentInd ? "Edit Indikator" : "Tambah Indikator"}
        maxWidth={600}
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
            <div style={{ display: "flex", gap: 12 }}>
              <div className="form-group" style={{ flex: "0 0 120px" }}>
                <label className="form-label">Kode</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: I1"
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  required
                  disabled={formLoading}
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Nama Indikator</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Masukkan nama indikator penilaian"
                  value={namaIndikator}
                  onChange={(e) => setNamaIndikator(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Kategori Aspek</label>
                <select 
                  className="form-select"
                  value={aspekId}
                  onChange={(e) => setAspekId(e.target.value)}
                  required
                  disabled={formLoading}
                >
                  <option value="" disabled>Pilih Aspek...</option>
                  {aspekData.map((a) => (
                    <option key={a.id} value={a.id}>{a.nama_aspek}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: "0 0 120px" }}>
                <label className="form-label">Bobot</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="0"
                  step="0.1"
                  value={bobot}
                  onChange={(e) => setBobot(parseFloat(e.target.value) || 0)}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Deskripsi Lengkap (Opsional)</label>
              <textarea 
                className="form-input" 
                placeholder="Penjelasan detail mengenai apa yang dinilai pada indikator ini..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                disabled={formLoading}
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input 
                type="checkbox"
                id="statusAktif"
                checked={aktif}
                onChange={(e) => setAktif(e.target.checked)}
                disabled={formLoading}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="statusAktif" style={{ fontSize: 14, cursor: "pointer" }}>
                Status Aktif (Tampil dalam form penilaian)
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
              disabled={formLoading || !kode.trim() || !namaIndikator.trim() || !aspekId}
            >
              {formLoading ? <Loader2 className="animate-spin" size={16} /> : "Simpan Indikator"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => !formLoading && setIsDeleteModalOpen(false)}
        title="Hapus Indikator"
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
            Apakah Anda yakin ingin menghapus indikator <strong>{currentInd?.kode} - {currentInd?.nama_indikator}</strong>? 
            <br/><br/>
            <span style={{ color: "#ef4444", fontSize: 13 }}>
              Peringatan: Semua data detail penilaian (*scoring*) yang telah menggunakan indikator ini akan ikut terhapus!
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
