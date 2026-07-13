"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Cpu, Loader2, AlertTriangle, Plus as PlusIcon, X } from "lucide-react";
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
  const [tipeJawaban, setTipeJawaban] = useState<"angka" | "pilihan">("angka");
  const [pilihanJawaban, setPilihanJawaban] = useState<any[]>([]);
  
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
    setTipeJawaban("angka");
    setPilihanJawaban([]);
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
    setTipeJawaban(ind.tipe_jawaban || "angka");
    setPilihanJawaban(ind.pilihan_jawaban || []);
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
      aktif,
      tipe_jawaban: tipeJawaban,
      pilihan_jawaban: tipeJawaban === "pilihan" ? pilihanJawaban : null
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

            <div className="form-group">
              <label className="form-label">Tipe Jawaban Penilaian</label>
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input
                    type="radio"
                    name="tipeJawabanOS"
                    value="angka"
                    checked={tipeJawaban === "angka"}
                    onChange={(e) => setTipeJawaban(e.target.value as "angka")}
                    disabled={formLoading}
                  />
                  Bebas Angka (Input Nilai 0 - 100)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input
                    type="radio"
                    name="tipeJawabanOS"
                    value="pilihan"
                    checked={tipeJawaban === "pilihan"}
                    onChange={(e) => setTipeJawaban(e.target.value as "pilihan")}
                    disabled={formLoading}
                  />
                  Pilihan Ganda Dinamis (Ya/Tidak, Lengkap/Sebagian)
                </label>
              </div>
            </div>

            {tipeJawaban === "pilihan" && (
              <div style={{ background: "var(--muted)", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Opsi Pilihan Jawaban</h4>
                  <button
                    type="button"
                    onClick={() => setPilihanJawaban([...pilihanJawaban, { label: "", nilai: 0 }])}
                    className="btn btn-secondary"
                    style={{ padding: "4px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                    disabled={formLoading}
                  >
                    <PlusIcon size={14} /> Tambah Opsi
                  </button>
                </div>

                {pilihanJawaban.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", textAlign: "center", padding: "12px 0" }}>
                    Belum ada opsi. Klik "Tambah Opsi" untuk menambahkan.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {pilihanJawaban.map((opt, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Label (misal: Ya)"
                          value={opt.label}
                          onChange={(e) => {
                            const newOpts = [...pilihanJawaban];
                            newOpts[idx].label = e.target.value;
                            setPilihanJawaban(newOpts);
                          }}
                          style={{ flex: 1 }}
                          required
                          disabled={formLoading}
                        />
                        <input
                          type="number"
                          className="form-input"
                          placeholder="Nilai (misal: 5)"
                          value={opt.nilai}
                          onChange={(e) => {
                            const newOpts = [...pilihanJawaban];
                            newOpts[idx].nilai = Number(e.target.value);
                            setPilihanJawaban(newOpts);
                          }}
                          style={{ width: 100 }}
                          required
                          disabled={formLoading}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = [...pilihanJawaban];
                            newOpts.splice(idx, 1);
                            setPilihanJawaban(newOpts);
                          }}
                          style={{ background: "transparent", border: "none", color: "var(--destructive)", cursor: "pointer", padding: 8 }}
                          disabled={formLoading}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
