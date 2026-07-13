"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Cpu, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";

export default function IndikatorOpenSIDPage() {
  const [search, setSearch] = useState("");
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentInd, setCurrentInd] = useState<any>(null);
  
  // Form State
  const [kode, setKode] = useState("");
  const [namaIndikator, setNamaIndikator] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [bobotTambahan, setBobotTambahan] = useState<number>(0);
  const [aktif, setAktif] = useState(true);
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: indRes, error: err } = await supabase
        .from("master_indikator_opensid")
        .select("*")
        .order("kode");
      
      if (err) throw err;
      setData(indRes || []);
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
    setDeskripsi("");
    setBobotTambahan(0);
    setAktif(true);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (ind: any) => {
    setCurrentInd(ind);
    setKode(ind.kode);
    setNamaIndikator(ind.nama_indikator);
    setDeskripsi(ind.deskripsi || "");
    setBobotTambahan(ind.bobot_tambahan);
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
    if (!kode.trim() || !namaIndikator.trim()) return;

    setFormLoading(true);
    setError("");

    const payload = {
      kode: kode.trim(),
      nama_indikator: namaIndikator.trim(),
      deskripsi: deskripsi.trim() || null,
      bobot_tambahan: Number(bobotTambahan),
      aktif
    };

    try {
      if (currentInd) {
        // Update
        const { error: err } = await supabase
          .from("master_indikator_opensid")
          .update(payload)
          .eq("id", currentInd.id);
        if (err) throw err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from("master_indikator_opensid")
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
        .from("master_indikator_opensid")
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

  const filtered = data.filter((ind) =>
    ind.nama_indikator.toLowerCase().includes(search.toLowerCase()) ||
    ind.kode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Indikator OpenSID</h1>
          <p className="page-subtitle">Indikator tambahan khusus fitur OpenSID</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Indikator
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div className="search-box" style={{ flex: "1 1 200px" }}>
            <Search size={16} />
            <input
              placeholder="Cari indikator OpenSID atau kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
                  <th style={{ width: 70 }}>Kode</th>
                  <th>Nama Indikator</th>
                  <th style={{ width: 150, textAlign: "center" }}>Bobot Tambahan</th>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ind) => (
                  <tr key={ind.id}>
                    <td>
                      <span className="badge" style={{
                        background: "rgba(245,158,11,0.12)",
                        color: "#f59e0b",
                        fontFamily: "var(--font-geist-mono)",
                      }}>
                        {ind.kode}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, marginBottom: 4 }}>
                          <Cpu size={14} color="#f59e0b" />
                          {ind.nama_indikator}
                        </div>
                        {ind.deskripsi && (
                          <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                            {ind.deskripsi}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, textAlign: "center" }}>{ind.bobot_tambahan}</td>
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
                ))}
                {filtered.length === 0 && !error && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--muted-foreground)" }}>
                      Tidak ada data indikator OpenSID.
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
        title={currentInd ? "Edit Indikator OpenSID" : "Tambah Indikator OpenSID"}
        maxWidth={550}
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
                  placeholder="Contoh: OS1"
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
                  placeholder="Masukkan nama indikator OpenSID"
                  value={namaIndikator}
                  onChange={(e) => setNamaIndikator(e.target.value)}
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bobot Tambahan (Bonus)</label>
              <input 
                type="number" 
                className="form-input" 
                min="0"
                step="0.1"
                value={bobotTambahan}
                onChange={(e) => setBobotTambahan(parseFloat(e.target.value) || 0)}
                required
                disabled={formLoading}
              />
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 8 }}>
                Nilai yang akan ditambahkan pada total skor (sebagai bonus) untuk desa yang memenuhi kriteria OpenSID.
              </p>
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
              disabled={formLoading || !kode.trim() || !namaIndikator.trim()}
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
        title="Hapus Indikator OpenSID"
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
            Apakah Anda yakin ingin menghapus indikator OpenSID <strong>{currentInd?.kode} - {currentInd?.nama_indikator}</strong>? 
            <br/><br/>
            <span style={{ color: "#ef4444", fontSize: 13 }}>
              Peringatan: Semua data detail penilaian yang telah menggunakan indikator ini akan ikut terhapus!
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
