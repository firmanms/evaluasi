"use client";

import { Settings, Edit, Loader2, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";

const aspekColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function AspekPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentAspek, setCurrentAspek] = useState<any>(null);
  
  // Form State
  const [namaAspek, setNamaAspek] = useState("");
  const [bobotPersen, setBobotPersen] = useState<number>(0);
  const [statusAktif, setStatusAktif] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: aspekRes, error: err } = await supabase
        .from("master_aspek")
        .select("*")
        .order("created_at");
      
      if (err) throw err;
      setData(aspekRes || []);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
      setError("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setCurrentAspek(null);
    setNamaAspek("");
    setBobotPersen(0);
    setStatusAktif(true);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (aspek: any) => {
    setCurrentAspek(aspek);
    setNamaAspek(aspek.nama_aspek);
    setBobotPersen(aspek.bobot_persen);
    setStatusAktif(aspek.status_aktif !== false); // default true if undefined
    setError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (aspek: any) => {
    setCurrentAspek(aspek);
    setError("");
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaAspek.trim()) return;

    setFormLoading(true);
    setError("");

    const payload = {
      nama_aspek: namaAspek.trim(),
      bobot_persen: Number(bobotPersen),
      status_aktif: statusAktif
    };

    try {
      if (currentAspek) {
        // Update
        const { error: err } = await supabase
          .from("master_aspek")
          .update(payload)
          .eq("id", currentAspek.id);
        if (err) throw err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from("master_aspek")
          .insert([payload]);
        if (err) throw err;
      }
      
      setIsModalOpen(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.code === "23505") {
        setError("Nama Aspek sudah digunakan!");
      } else {
        setError(err.message || "Gagal menyimpan data.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAspek) return;
    setFormLoading(true);
    setError("");

    try {
      const { error: err } = await supabase
        .from("master_aspek")
        .delete()
        .eq("id", currentAspek.id);
      
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

  const activeAspek = data.filter(a => a.status_aktif !== false);
  const totalBobot = activeAspek.reduce((sum, a) => sum + Number(a.bobot_persen), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Aspek & Bobot Penilaian</h1>
          <p className="page-subtitle">Konfigurasi aspek evaluasi dan bobotnya (total harus 100%)</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Aspek
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
          <Loader2 className="animate-spin" style={{ margin: "0 auto", marginBottom: 8 }} />
          Memuat data aspek...
        </div>
      ) : (
        <>
          {/* Visual Bobot Bar */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--muted-foreground)" }}>
              KOMPOSISI BOBOT
            </h3>
            {data.length > 0 ? (
              <>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 32, marginBottom: 16, background: "var(--muted)" }}>
                  {activeAspek.map((aspek, i) => (
                    <div
                      key={aspek.id}
                      style={{
                        width: `${aspek.bobot_persen}%`,
                        background: aspekColors[i % aspekColors.length],
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        transition: "all 0.3s ease",
                      }}
                      title={`${aspek.nama_aspek}: ${aspek.bobot_persen}%`}
                    >
                      {aspek.bobot_persen > 5 ? `${aspek.bobot_persen}%` : ""}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  {activeAspek.map((aspek, i) => (
                    <div key={aspek.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: aspekColors[i % aspekColors.length] }} />
                      <span>{aspek.nama_aspek}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: "var(--muted-foreground)" }}>
                Belum ada aspek yang dikonfigurasi. Silakan tambah aspek baru.
              </div>
            )}
          </div>

          {/* Aspek Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {data.map((aspek, i) => (
              <div key={aspek.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 4,
                  background: aspekColors[i % aspekColors.length],
                }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: `${aspekColors[i % aspekColors.length]}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 12,
                    }}>
                      <Settings size={20} color={aspekColors[i % aspekColors.length]} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{aspek.nama_aspek}</h3>
                      {aspek.status_aktif === false && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 600 }}>Tidak Aktif</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                      Aspek {i + 1} dari {data.length}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: aspekColors[i % aspekColors.length], lineHeight: 1 }}>
                      {aspek.bobot_persen}%
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>Bobot</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEditModal(aspek)}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ padding: "0 12px", color: "#ef4444", borderColor: "transparent" }} onClick={() => openDeleteModal(aspek)} title="Hapus">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total Check */}
          {data.length > 0 && (
            <div className="card" style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: totalBobot === 100 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              borderColor: totalBobot === 100 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
            }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>Total Bobot Keseluruhan</span>
              <span style={{
                fontSize: 20,
                fontWeight: 700,
                color: totalBobot === 100 ? "#10b981" : "#ef4444",
              }}>
                {totalBobot}%
                {totalBobot === 100 ? " ✓" : " ✗ (Pastikan total keseluruhan bernilai 100%)"}
              </span>
            </div>
          )}
        </>
      )}

      {/* Form Modal (Add/Edit) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={currentAspek ? "Edit Aspek" : "Tambah Aspek Baru"}
        maxWidth={400}
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
          
          <div className="form-group">
            <label className="form-label">Nama Aspek Penilaian</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Kelembagaan"
              value={namaAspek}
              onChange={(e) => setNamaAspek(e.target.value)}
              required
              disabled={formLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bobot (%)</label>
            <input 
              type="number" 
              className="form-input" 
              min="0"
              max="100"
              step="0.01"
              value={bobotPersen}
              onChange={(e) => setBobotPersen(parseFloat(e.target.value) || 0)}
              required
              disabled={formLoading}
            />
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 8 }}>
              Tentukan nilai bobot dalam rentang 0 hingga 100.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input 
                type="checkbox"
                checked={statusAktif}
                onChange={(e) => setStatusAktif(e.target.checked)}
                disabled={formLoading}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Aspek Aktif</span>
            </label>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 8, marginLeft: 30 }}>
              Jika dinonaktifkan, aspek ini dan indikator di dalamnya tidak akan masuk dalam perhitungan evaluasi.
            </p>
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
              disabled={formLoading || !namaAspek.trim()}
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
        title="Hapus Aspek"
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
            Apakah Anda yakin ingin menghapus aspek <strong>{currentAspek?.nama_aspek}</strong>? 
            <br/><br/>
            <span style={{ color: "#ef4444", fontSize: 13 }}>
              Peringatan: Jika Anda menghapus aspek ini, semua Indikator yang tergabung di dalam aspek ini juga akan ikut terhapus!
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
              {formLoading ? <Loader2 className="animate-spin" size={16} /> : "Ya, Hapus Aspek"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
