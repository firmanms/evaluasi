"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Search, Edit, Trash2, Loader2, AlertTriangle, Download, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";
import * as XLSX from "xlsx";
import { useRef } from "react";

export default function KecamatanPage() {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [desaData, setDesaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentKec, setCurrentKec] = useState<any>(null);
  
  // Form State
  const [namaKecamatan, setNamaKecamatan] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [kecRes, desaRes] = await Promise.all([
        supabase.from("kecamatan").select("*").order("nama_kecamatan"),
        supabase.from("desa").select("id, jenis, kecamatan_id")
      ]);
      
      if (kecRes.error) throw kecRes.error;
      if (desaRes.error) throw desaRes.error;

      setData(kecRes.data || []);
      setDesaData(desaRes.data || []);
    } catch (err: any) {
      console.error("Fetch error:", err.message);
      setError("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setCurrentKec(null);
    setNamaKecamatan("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (kec: any) => {
    setCurrentKec(kec);
    setNamaKecamatan(kec.nama_kecamatan);
    setError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (kec: any) => {
    setCurrentKec(kec);
    setError("");
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKecamatan.trim()) return;

    setFormLoading(true);
    setError("");

    try {
      if (currentKec) {
        // Update
        const { error: err } = await supabase
          .from("kecamatan")
          .update({ nama_kecamatan: namaKecamatan.trim() })
          .eq("id", currentKec.id);
        if (err) throw err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from("kecamatan")
          .insert([{ nama_kecamatan: namaKecamatan.trim() }]);
        if (err) throw err;
      }
      
      setIsModalOpen(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.code === "23505") { // Unique violation code in Postgres
        setError("Nama kecamatan sudah ada!");
      } else {
        setError(err.message || "Gagal menyimpan data.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentKec) return;
    setFormLoading(true);
    setError("");

    try {
      const { error: err } = await supabase
        .from("kecamatan")
        .delete()
        .eq("id", currentKec.id);
      
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

  const handleExport = () => {
    const exportData = data.map(d => ({ nama_kecamatan: d.nama_kecamatan }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Kecamatan");
    XLSX.writeFile(wb, "master_kecamatan.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        
        let imported = 0;
        
        for (const row of rows) {
          if (!row.nama_kecamatan) continue;
          const nama = String(row.nama_kecamatan).trim();
          
          // Check if exist
          const exists = data.find(d => d.nama_kecamatan.toLowerCase() === nama.toLowerCase());
          if (!exists) {
            await supabase.from("kecamatan").insert([{ nama_kecamatan: nama }]);
            imported++;
          }
        }
        
        alert(`Berhasil mengimpor ${imported} kecamatan baru.`);
        fetchData();
      } catch (err) {
        console.error("Import error:", err);
        alert("Terjadi kesalahan saat membaca file Excel.");
        setLoading(false);
      }
      
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = (err) => {
      alert("Gagal membaca file Excel");
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const filtered = data.filter((k) =>
    k.nama_kecamatan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Data Kecamatan</h1>
          <p className="page-subtitle">Kelola data kecamatan di Kabupaten Bandung</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export Excel
          </button>
          <input
            type="file"
            accept=".xlsx, .xls"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import Excel
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Tambah Kecamatan
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Cari kecamatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            {filtered.length} kecamatan
          </span>
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
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Kecamatan</th>
                  <th>Jumlah Desa</th>
                  <th>Jumlah Kelurahan</th>
                  <th>Total</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((kec, i) => {
                  const desaKec = desaData.filter((d) => d.kecamatan_id === kec.id);
                  const jumlahDesa = desaKec.filter((d) => d.jenis === "desa").length;
                  const jumlahKel = desaKec.filter((d) => d.jenis === "kelurahan").length;
                  return (
                    <tr key={kec.id}>
                      <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: "linear-gradient(135deg, #3b82f6, #1e40af)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            <Building2 size={16} color="#fff" />
                          </div>
                          <span style={{ fontWeight: 500 }}>{kec.nama_kecamatan}</span>
                        </div>
                      </td>
                      <td>{jumlahDesa}</td>
                      <td>{jumlahKel}</td>
                      <td style={{ fontWeight: 600 }}>{desaKec.length}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEditModal(kec)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Hapus" style={{ color: "#ef4444" }} onClick={() => openDeleteModal(kec)}>
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
                      Tidak ada data kecamatan.
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
        title={currentKec ? "Edit Kecamatan" : "Tambah Kecamatan"}
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
            <label className="form-label">Nama Kecamatan</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Contoh: Cileunyi"
              value={namaKecamatan}
              onChange={(e) => setNamaKecamatan(e.target.value)}
              required
              autoFocus
              disabled={formLoading}
            />
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
              disabled={formLoading || !namaKecamatan.trim()}
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
        title="Hapus Kecamatan"
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
            Apakah Anda yakin ingin menghapus kecamatan <strong>{currentKec?.nama_kecamatan}</strong>? 
            <br/><br/>
            <span style={{ color: "#ef4444", fontSize: 13 }}>Peringatan: Aksi ini juga akan menghapus semua data desa yang terkait dengan kecamatan ini!</span>
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
