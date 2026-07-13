"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Loader2, AlertTriangle, MessageSquare, CheckCircle, Clock, Filter, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";

export default function KendalaPage() {
  const [data, setData] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    id: "",
    desa_id: "",
    periode_id: "",
    deskripsi: "",
    status: "baru",
    tindak_lanjut: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPeriode]);

  async function fetchInitialData() {
    try {
      const [desaRes, periodeRes] = await Promise.all([
        supabase.from("desa").select("id, nama_desa, kecamatan(nama_kecamatan)").order("nama_desa"),
        supabase.from("periode_evaluasi").select("id, nama_periode, status").order("tanggal_mulai", { ascending: false })
      ]);

      if (desaRes.data) {
        setDesaList(desaRes.data.map((d: any) => ({
          id: d.id,
          nama_desa: d.nama_desa,
          nama_kecamatan: d.kecamatan?.nama_kecamatan
        })));
      }

      if (periodeRes.data) {
        setPeriodeList(periodeRes.data);
        const active = periodeRes.data.find(p => p.status === "berjalan");
        if (active && !filterPeriode) {
          setFilterPeriode(active.id); // Default filter to active period
        } else if (periodeRes.data.length > 0 && !filterPeriode) {
          setFilterPeriode(periodeRes.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      let query = supabase
        .from("kendala")
        .select("*, desa(nama_desa, kecamatan(nama_kecamatan)), periode_evaluasi(nama_periode)")
        .order("diupdate_pada", { ascending: false });

      if (filterStatus) query = query.eq("status", filterStatus);
      if (filterPeriode) query = query.eq("periode_id", filterPeriode);

      const { data: kData, error: kErr } = await query;

      if (kErr) throw kErr;
      
      const flat = (kData || []).map(k => ({
        ...k,
        nama_desa: k.desa?.nama_desa,
        nama_kecamatan: k.desa?.kecamatan?.nama_kecamatan,
        nama_periode: k.periode_evaluasi?.nama_periode
      }));
      
      setData(flat);
    } catch (err: any) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setError("");
    setFormData({
      id: "",
      desa_id: "",
      periode_id: filterPeriode || (periodeList.length > 0 ? periodeList[0].id : ""),
      deskripsi: "",
      status: "baru",
      tindak_lanjut: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setError("");
    setFormData({
      id: item.id,
      desa_id: item.desa_id,
      periode_id: item.periode_id,
      deskripsi: item.deskripsi || "",
      status: item.status || "baru",
      tindak_lanjut: item.tindak_lanjut || ""
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (item: any) => {
    setError("");
    setFormData({ ...formData, id: item.id, deskripsi: item.deskripsi }); 
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        desa_id: formData.desa_id,
        periode_id: formData.periode_id,
        deskripsi: formData.deskripsi,
        status: formData.status,
        tindak_lanjut: formData.tindak_lanjut || null,
        diupdate_pada: new Date().toISOString()
      };

      if (formData.id) {
        const { error } = await supabase.from("kendala").update(payload).eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kendala").insert([{ ...payload, dilaporkan_pada: new Date().toISOString() }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Save error:", err);
      setError("Gagal menyimpan data kendala.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("kendala").delete().eq("id", formData.id);
      if (error) throw error;
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError("Gagal menghapus kendala.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = data.filter(
    (d) =>
      d.nama_desa?.toLowerCase().includes(search.toLowerCase()) ||
      d.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
      d.tindak_lanjut?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Kendala & Tindak Lanjut</h1>
          <p className="page-subtitle">Kelola laporan kendala dan progress penyelesaiannya</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Lapor Kendala
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-box" style={{ flex: "1 1 250px", maxWidth: 400 }}>
          <Search size={16} />
          <input
            placeholder="Cari desa atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ width: "auto", minWidth: 160 }}
          value={filterPeriode}
          onChange={(e) => setFilterPeriode(e.target.value)}
        >
          <option value="">Semua Periode</option>
          {periodeList.map(p => (
            <option key={p.id} value={p.id}>{p.nama_periode}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ width: "auto", minWidth: 160 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="baru">Baru Dilaporkan</option>
          <option value="diproses">Sedang Diproses</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        {loading ? (
          <div className="card" style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--muted-foreground)" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <>
            {filtered.map((item) => {
              const isBaru = item.status === "baru";
              const isProses = item.status === "diproses";
              const isSelesai = item.status === "selesai";
              
              return (
                <div key={item.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ 
                        padding: 12, borderRadius: 12, 
                        background: isBaru ? "rgba(239,68,68,0.1)" : isProses ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                        color: isBaru ? "#ef4444" : isProses ? "#f59e0b" : "#10b981"
                      }}>
                        {isBaru ? <AlertTriangle size={24} /> : isProses ? <Clock size={24} /> : <CheckCircle size={24} />}
                      </div>
                      
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{item.nama_desa}</h3>
                          <span className="badge" style={{ 
                            background: isBaru ? "rgba(239,68,68,0.1)" : isProses ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                            color: isBaru ? "#ef4444" : isProses ? "#f59e0b" : "#10b981"
                          }}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 12 }}>
                          Dilaporkan pada {new Date(item.dilaporkan_pada).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        
                        <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: item.tindak_lanjut ? 12 : 0 }}>
                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                            <strong>Kendala: </strong>{item.deskripsi}
                          </p>
                        </div>
                        
                        {item.tindak_lanjut && (
                          <div style={{ padding: "12px 16px", background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8 }}>
                            <div style={{ display: "flex", gap: 8, color: "#3b82f6", marginBottom: 4 }}>
                              <MessageSquare size={16} />
                              <span style={{ fontSize: 13, fontWeight: 600 }}>Tindak Lanjut:</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                              {item.tindak_lanjut}
                            </p>
                            <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8 }}>
                              Diperbarui pada {new Date(item.diupdate_pada).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                      <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => openEditModal(item)}>
                        <Edit2 size={14} /> Update
                      </button>
                      <button className="btn-ghost" style={{ padding: 8, color: "#ef4444", width: "100%", justifyContent: "center" }} onClick={() => openDeleteModal(item)}>
                        <Trash2 size={14} /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
                Tidak ada tiket kendala ditemukan.
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Update Laporan Kendala" : "Lapor Kendala Baru"}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Desa / Kelurahan *</label>
              <select
                className="form-select"
                required
                value={formData.desa_id}
                onChange={(e) => setFormData({ ...formData, desa_id: e.target.value })}
                disabled={!!formData.id} // cannot change desa once created
              >
                <option value="">Pilih Desa...</option>
                {desaList.map(d => (
                  <option key={d.id} value={d.id}>{d.nama_desa}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Periode Evaluasi *</label>
              <select
                className="form-select"
                required
                value={formData.periode_id}
                onChange={(e) => setFormData({ ...formData, periode_id: e.target.value })}
                disabled={!!formData.id}
              >
                <option value="">Pilih Periode...</option>
                {periodeList.map(p => (
                  <option key={p.id} value={p.id}>{p.nama_periode}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status Tiket *</label>
            <select
              className="form-select"
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="baru">Baru</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi Kendala *</label>
            <textarea
              className="form-input"
              rows={4}
              required
              placeholder="Ceritakan detail kendala yang dialami..."
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            />
          </div>

          {formData.id && (
            <div className="form-group">
              <label className="form-label">Tindak Lanjut / Solusi</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Catatan tindak lanjut atau solusi yang diberikan..."
                value={formData.tindak_lanjut}
                onChange={(e) => setFormData({ ...formData, tindak_lanjut: e.target.value })}
              />
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p>
            Apakah Anda yakin ingin menghapus laporan kendala ini?
          </p>
          <div style={{ padding: 12, background: "rgba(0,0,0,0.02)", borderRadius: 8, fontSize: 13 }}>
            "{formData.deskripsi}"
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={saving}>
              Batal
            </button>
            <button className="btn btn-primary" style={{ background: "#ef4444" }} onClick={handleDelete} disabled={saving}>
              {saving ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
