"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Search, Edit, Trash2, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";

export default function DesaPage() {
  const [search, setSearch] = useState("");
  const [filterKec, setFilterKec] = useState("");
  
  const [data, setData] = useState<any[]>([]);
  const [kecamatanData, setKecamatanData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDesa, setCurrentDesa] = useState<any>(null);
  
  // Form State
  const [namaDesa, setNamaDesa] = useState("");
  const [jenis, setJenis] = useState("desa");
  const [kecamatanId, setKecamatanId] = useState("");
  const [urlWebsite, setUrlWebsite] = useState("");
  const [statusAktif, setStatusAktif] = useState(true);
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [desaRes, kecRes] = await Promise.all([
        supabase.from("desa").select("*, kecamatan(nama_kecamatan)").order("nama_desa"),
        supabase.from("kecamatan").select("*").order("nama_kecamatan")
      ]);
      
      if (desaRes.error) throw desaRes.error;
      if (kecRes.error) throw kecRes.error;

      setData(desaRes.data || []);
      setKecamatanData(kecRes.data || []);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
      setError("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setCurrentDesa(null);
    setNamaDesa("");
    setJenis("desa");
    setKecamatanId(filterKec || ""); // Default to selected filter if any
    setUrlWebsite("");
    setStatusAktif(true);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (desa: any) => {
    setCurrentDesa(desa);
    setNamaDesa(desa.nama_desa);
    setJenis(desa.jenis);
    setKecamatanId(desa.kecamatan_id);
    setUrlWebsite(desa.url_website || "");
    setStatusAktif(desa.status_aktif);
    setError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (desa: any) => {
    setCurrentDesa(desa);
    setError("");
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaDesa.trim() || !kecamatanId) return;

    setFormLoading(true);
    setError("");

    const payload = {
      nama_desa: namaDesa.trim(),
      jenis,
      kecamatan_id: kecamatanId,
      url_website: urlWebsite.trim() || null,
      status_aktif: statusAktif
    };

    try {
      if (currentDesa) {
        // Update
        const { error: err } = await supabase
          .from("desa")
          .update(payload)
          .eq("id", currentDesa.id);
        if (err) throw err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from("desa")
          .insert([payload]);
        if (err) throw err;
      }
      
      setIsModalOpen(false);
      fetchData(); // Refresh
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.code === "23505") { 
        setError("Nama desa/kelurahan ini sudah ada di kecamatan tersebut!");
      } else {
        setError(err.message || "Gagal menyimpan data.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDesa) return;
    setFormLoading(true);
    setError("");

    try {
      const { error: err } = await supabase
        .from("desa")
        .delete()
        .eq("id", currentDesa.id);
      
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

  const filtered = data.filter((d) => {
    const matchSearch = d.nama_desa.toLowerCase().includes(search.toLowerCase());
    const matchKec = filterKec ? d.kecamatan_id === filterKec : true;
    return matchSearch && matchKec;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Data Desa / Kelurahan</h1>
          <p className="page-subtitle">Kelola data {data.length} desa dan kelurahan</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Desa
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div className="search-box" style={{ flex: "1 1 200px" }}>
            <Search size={16} />
            <input
              placeholder="Cari nama desa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 180, padding: "8px 12px" }}
            value={filterKec}
            onChange={(e) => setFilterKec(e.target.value)}
          >
            <option value="">Semua Kecamatan</option>
            {kecamatanData.map((k) => (
              <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            {filtered.length} data
          </span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
            <Loader2 className="animate-spin" style={{ margin: "0 auto", marginBottom: 8 }} />
            Memuat data...
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>No</th>
                    <th>Nama Desa/Kelurahan</th>
                    <th>Kecamatan</th>
                    <th>Jenis</th>
                    <th>URL Website</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map((desa, i) => {
                    const kecName = desa.kecamatan?.nama_kecamatan || "-";
                    return (
                      <tr key={desa.id}>
                        <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: desa.jenis === "kelurahan"
                                ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                                : "linear-gradient(135deg, #10b981, #059669)",
                              display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                              <MapPin size={16} color="#fff" />
                            </div>
                            <span style={{ fontWeight: 500 }}>{desa.nama_desa}</span>
                          </div>
                        </td>
                        <td>{kecName}</td>
                        <td>
                          <span className="badge" style={{
                            background: desa.jenis === "kelurahan" ? "rgba(139,92,246,0.12)" : "rgba(16,185,129,0.12)",
                            color: desa.jenis === "kelurahan" ? "#8b5cf6" : "#10b981",
                            textTransform: "capitalize"
                          }}>
                            {desa.jenis}
                          </span>
                        </td>
                        <td>
                          {desa.url_website ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--primary)" }}>
                              <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {desa.url_website}
                              </span>
                              <ExternalLink size={12} />
                            </div>
                          ) : (
                            <span style={{ color: "var(--muted-foreground)" }}>-</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className={`status-dot ${desa.status_aktif ? "status-dot-green" : "status-dot-red"}`} />
                            <span style={{ fontSize: 13 }}>{desa.status_aktif ? "Aktif" : "Tidak Aktif"}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEditModal(desa)}>
                              <Edit size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" title="Hapus" style={{ color: "#ef4444" }} onClick={() => openDeleteModal(desa)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && !error && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--muted-foreground)" }}>
                        Tidak ada data desa/kelurahan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 50 && (
              <div style={{ textAlign: "center", padding: 16, color: "var(--muted-foreground)", fontSize: 13 }}>
                Menampilkan 50 dari {filtered.length} data. Gunakan filter untuk mempersempit pencarian.
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal (Add/Edit) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={currentDesa ? "Edit Desa/Kelurahan" : "Tambah Desa/Kelurahan"}
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
              <label className="form-label">Nama Desa / Kelurahan</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: Cimekar"
                value={namaDesa}
                onChange={(e) => setNamaDesa(e.target.value)}
                required
                disabled={formLoading}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Jenis</label>
                <select 
                  className="form-select"
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                  disabled={formLoading}
                >
                  <option value="desa">Desa</option>
                  <option value="kelurahan">Kelurahan</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Kecamatan</label>
                <select 
                  className="form-select"
                  value={kecamatanId}
                  onChange={(e) => setKecamatanId(e.target.value)}
                  required
                  disabled={formLoading}
                >
                  <option value="" disabled>Pilih Kecamatan...</option>
                  {kecamatanData.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">URL Website (Opsional)</label>
              <input 
                type="url" 
                className="form-input" 
                placeholder="https://desa-cimekar.id"
                value={urlWebsite}
                onChange={(e) => setUrlWebsite(e.target.value)}
                disabled={formLoading}
              />
            </div>

            <div className="form-group" style={{ display: "none" }}>
              <input 
                type="checkbox"
                id="statusAktif"
                checked={statusAktif}
                onChange={(e) => setStatusAktif(e.target.checked)}
                disabled={formLoading}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="statusAktif" style={{ fontSize: 14, cursor: "pointer" }}>
                Status Aktif
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
              disabled={formLoading || !namaDesa.trim() || !kecamatanId}
            >
              {formLoading ? <Loader2 className="animate-spin" size={16} /> : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => !formLoading && setIsDeleteModalOpen(false)}
        title="Hapus Desa/Kelurahan"
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
            Apakah Anda yakin ingin menghapus {currentDesa?.jenis} <strong>{currentDesa?.nama_desa}</strong>? 
            <br/><br/>
            <span style={{ color: "#ef4444", fontSize: 13 }}>Peringatan: Aksi ini juga akan menghapus semua riwayat penilaian dan kendala yang terhubung dengan desa ini!</span>
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
              {formLoading ? <Loader2 className="animate-spin" size={16} /> : "Ya, Hapus Data"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
