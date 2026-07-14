"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Server, MapPin, Globe, Loader2, AlertTriangle, Save, Download, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";
import * as XLSX from "xlsx";
import { useRef } from "react";

export default function MasterServerPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: "",
    nama_server: "",
    lokasi_server: "Mandiri",
    ip_privat: "",
    ip_publik: "",
    ram: "",
    processor: "",
    disk: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: serverData, error: serverErr } = await supabase
        .from("master_server")
        .select("*")
        .order("created_at", { ascending: false });

      if (serverErr) throw serverErr;
      setData(serverData || []);
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
      nama_server: "",
      lokasi_server: "Mandiri",
      ip_privat: "",
      ip_publik: "",
      ram: "",
      processor: "",
      disk: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setError("");
    setFormData({
      id: item.id,
      nama_server: item.nama_server,
      lokasi_server: item.lokasi_server,
      ip_privat: item.ip_privat || "",
      ip_publik: item.ip_publik || "",
      ram: item.ram || "",
      processor: item.processor || "",
      disk: item.disk || ""
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (item: any) => {
    setError("");
    setFormData({ ...formData, id: item.id, nama_server: item.nama_server }); 
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        nama_server: formData.nama_server,
        lokasi_server: formData.lokasi_server,
        ip_privat: formData.ip_privat || null,
        ip_publik: formData.ip_publik || null,
        ram: formData.ram || null,
        processor: formData.processor || null,
        disk: formData.disk || null
      };

      if (formData.id) {
        const { error } = await supabase.from("master_server").update(payload).eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("master_server").insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Gagal menyimpan data server. Pastikan SQL ALTER TABLE sudah dijalankan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("master_server").delete().eq("id", formData.id);
      if (error) throw error;
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError("Gagal menghapus server. Pastikan server ini tidak sedang digunakan oleh desa manapun.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = data.filter(
    (d) =>
      d.nama_server?.toLowerCase().includes(search.toLowerCase()) ||
      d.lokasi_server?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const exportData = data.map(d => ({
      nama_server: d.nama_server,
      lokasi_server: d.lokasi_server,
      ip_privat: d.ip_privat || "",
      ip_publik: d.ip_publik || "",
      ram: d.ram || "",
      processor: d.processor || "",
      disk: d.disk || ""
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Server");
    XLSX.writeFile(wb, "master_server.xlsx");
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
          if (!row.nama_server) continue;
          
          const validLokasi = ['Mandiri', 'Kabupaten', 'Provinsi', 'PDN', 'Lainnya'];
          const inputLokasi = String(row.lokasi_server).trim();
          const lokasi = validLokasi.includes(inputLokasi) ? inputLokasi : 'Mandiri';
          
          // Check if exist
          const namaServer = String(row.nama_server).trim();
          const exists = data.find(d => d.nama_server.toLowerCase() === namaServer.toLowerCase());
          
          if (!exists) {
            await supabase.from("master_server").insert([{ 
              nama_server: namaServer,
              lokasi_server: lokasi,
              ip_privat: row.ip_privat ? String(row.ip_privat).trim() : null,
              ip_publik: row.ip_publik ? String(row.ip_publik).trim() : null,
              ram: row.ram ? String(row.ram).trim() : null,
              processor: row.processor ? String(row.processor).trim() : null,
              disk: row.disk ? String(row.disk).trim() : null
            }]);
            imported++;
          }
        }
        
        alert(`Berhasil mengimpor ${imported} server baru.`);
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

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Master Server</h1>
          <p className="page-subtitle">Kelola data server hosting website desa</p>
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
            <Plus size={16} /> Tambah Server
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="search-box" style={{ flex: "1 1 300px", maxWidth: 400 }}>
          <Search size={16} />
          <input
            placeholder="Cari nama server atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
          {filtered.length} server tersedia
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--muted-foreground)" }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>No</th>
                  <th>Nama Server</th>
                  <th>Lokasi / Pengelola</th>
                  <th>IP Privat</th>
                  <th>IP Publik</th>
                  <th>Spesifikasi</th>
                  <th style={{ width: 100, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ padding: 6, background: "rgba(59,130,246,0.1)", color: "#3b82f6", borderRadius: 6 }}>
                          <Server size={16} />
                        </div>
                        {item.nama_server}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: item.lokasi_server === "Mandiri" ? "rgba(16,185,129,0.1)" :
                                   item.lokasi_server === "PDN" ? "rgba(239,68,68,0.1)" :
                                   item.lokasi_server === "Kabupaten" ? "rgba(59,130,246,0.1)" : "rgba(245,158,11,0.1)",
                        color: item.lokasi_server === "Mandiri" ? "#10b981" :
                               item.lokasi_server === "PDN" ? "#ef4444" :
                               item.lokasi_server === "Kabupaten" ? "#3b82f6" : "#f59e0b"
                      }}>
                        {item.lokasi_server}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--muted-foreground)" }}>
                      {item.ip_privat || "-"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 13, color: "var(--muted-foreground)" }}>
                      {item.ip_publik || "-"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                      {item.ram || item.processor || item.disk ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {item.processor && <span>CPU: {item.processor}</span>}
                          {item.ram && <span>RAM: {item.ram}</span>}
                          {item.disk && <span>Disk: {item.disk}</span>}
                        </div>
                      ) : "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button className="btn-ghost" style={{ padding: 6, color: "var(--primary)" }} onClick={() => openEditModal(item)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-ghost" style={{ padding: 6, color: "#ef4444" }} onClick={() => openDeleteModal(item)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)" }}>
                      Tidak ada data server yang ditemukan.
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
        title={formData.id ? "Edit Master Server" : "Tambah Master Server"}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Nama Server *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: VPS Desa, Hosting Niagahoster, dll"
              required
              value={formData.nama_server}
              onChange={(e) => setFormData({ ...formData, nama_server: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lokasi Pengelolaan / Provider *</label>
            <select
              className="form-select"
              required
              value={formData.lokasi_server}
              onChange={(e) => setFormData({ ...formData, lokasi_server: e.target.value })}
            >
              <option value="Mandiri">Mandiri (Dikelola Desa)</option>
              <option value="Kabupaten">Fasilitasi Kabupaten (Diskominfo)</option>
              <option value="Provinsi">Fasilitasi Provinsi</option>
              <option value="PDN">Pusat Data Nasional (PDN)</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">IP Privat</label>
              <input
                type="text"
                className="form-input"
                placeholder="10.x.x.x / 192.168.x.x"
                value={formData.ip_privat}
                onChange={(e) => setFormData({ ...formData, ip_privat: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IP Publik</label>
              <input
                type="text"
                className="form-input"
                placeholder="202.x.x.x"
                value={formData.ip_publik}
                onChange={(e) => setFormData({ ...formData, ip_publik: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Processor (CPU)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 4 Core"
                value={formData.processor}
                onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kapasitas RAM</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 8 GB"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kapasitas Penyimpanan (Disk)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: 100 GB NVMe"
              value={formData.disk}
              onChange={(e) => setFormData({ ...formData, disk: e.target.value })}
            />
          </div>

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
            Apakah Anda yakin ingin menghapus server <strong>{formData.nama_server}</strong>?
            Data yang dihapus tidak dapat dikembalikan.
          </p>
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
