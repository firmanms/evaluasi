"use client";

import { useState, useEffect } from "react";
import { Globe, Search, Phone, Mail, Wifi, Monitor, Calendar, User, Plus, Edit2, Trash2, Loader2, AlertTriangle, MoreVertical, Save, Server, Download, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/ui/modal";
import * as XLSX from "xlsx";
import { useRef } from "react";

export default function ProfilWebsitePage() {
  const [data, setData] = useState<any[]>([]);
  const [desaList, setDesaList] = useState<any[]>([]);
  const [serverList, setServerList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [filterKec, setFilterKec] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    id: "",
    desa_id: "",
    server_id: "",
    operator: "",
    no_wa: "",
    email: "",
    tahun_mulai_gunakan: new Date().getFullYear(),
    jumlah_operator: 1,
    perangkat_digunakan: "Laptop",
    kecepatan_internet: "5-10 Mbps",
    pengelola_website: "Operator Desa",
    frekuensi_update: "Mingguan",
    kendala: "",
    saran: "",
    versi: "",
    jenis_versi: "-",
    status_website: "Aktif"
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Get all websites joined with desa & kecamatan
      // Get all websites joined with desa & kecamatan & server
      const { data: webData, error: webErr } = await supabase
        .from("master_website")
        .select("*, desa(nama_desa, kecamatan_id, kecamatan(nama_kecamatan)), master_server(nama_server, lokasi_server)")
        .order("updated_at", { ascending: false });

      if (webErr) throw webErr;

      // Flatten for easy display
      const flat = (webData || []).map((w) => ({
        ...w,
        nama_desa: w.desa?.nama_desa,
        nama_kecamatan: w.desa?.kecamatan?.nama_kecamatan,
        nama_server: w.master_server?.nama_server,
        lokasi_server: w.master_server?.lokasi_server
      }));
      setData(flat);

      // Get all desa for the dropdown (only those that don't have a profile yet)
      const { data: desaData, error: desaErr } = await supabase
        .from("desa")
        .select("id, nama_desa, kecamatan(nama_kecamatan)")
        .order("nama_desa");

      if (desaErr) throw desaErr;
      
      const flatDesa = (desaData || []).map((d) => ({
        id: d.id,
        nama_desa: d.nama_desa,
        nama_kecamatan: (d.kecamatan as any)?.nama_kecamatan
      }));
      setDesaList(flatDesa);

      // Get all servers
      const { data: srvData, error: srvErr } = await supabase
        .from("master_server")
        .select("id, nama_server, lokasi_server")
        .order("nama_server");

      if (srvErr) throw srvErr;
      setServerList(srvData || []);

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
      server_id: "",
      operator: "",
      no_wa: "",
      email: "",
      tahun_mulai_gunakan: new Date().getFullYear(),
      jumlah_operator: 1,
      perangkat_digunakan: "Laptop",
      kecepatan_internet: "10-20 Mbps",
      pengelola_website: "Operator Desa",
      frekuensi_update: "Mingguan",
      kendala: "",
      saran: "",
      versi: "",
      jenis_versi: "Umum",
      status_website: "Online"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setError("");
    setFormData({
      id: item.id,
      desa_id: item.desa_id,
      server_id: item.server_id || "",
      operator: item.operator || "",
      no_wa: item.no_wa || "",
      email: item.email || "",
      tahun_mulai_gunakan: item.tahun_mulai_gunakan || new Date().getFullYear(),
      jumlah_operator: item.jumlah_operator || 1,
      perangkat_digunakan: item.perangkat_digunakan || "Laptop",
      kecepatan_internet: item.kecepatan_internet || "5-10 Mbps",
      pengelola_website: item.pengelola_website || "Operator Desa",
      frekuensi_update: item.frekuensi_update || "Mingguan",
      kendala: item.kendala || "",
      saran: item.saran || "",
      versi: item.versi || "",
      jenis_versi: item.jenis_versi || "-",
      status_website: item.status_website || "Aktif"
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (item: any) => {
    setError("");
    setFormData({ ...formData, id: item.id, desa_id: item.nama_desa }); // using desa_id temporarily for name display
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        desa_id: formData.desa_id,
        server_id: formData.server_id || null,
        operator: formData.operator,
        no_wa: formData.no_wa,
        email: formData.email,
        tahun_mulai_gunakan: formData.tahun_mulai_gunakan,
        jumlah_operator: formData.jumlah_operator,
        perangkat_digunakan: formData.perangkat_digunakan,
        kecepatan_internet: formData.kecepatan_internet,
        pengelola_website: formData.pengelola_website,
        frekuensi_update: formData.frekuensi_update,
        kendala: formData.kendala,
        saran: formData.saran,
        versi: formData.versi,
        jenis_versi: formData.jenis_versi,
        status_website: formData.status_website,
        updated_at: new Date().toISOString()
      };

      if (formData.id) {
        const { error } = await supabase.from("master_website").update(payload).eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("master_website").insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Save error:", err);
      if (err.code === "23505") { // unique constraint
        setError("Desa ini sudah memiliki profil website.");
      } else {
        setError("Gagal menyimpan profil.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("master_website").delete().eq("id", formData.id);
      if (error) throw error;
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Delete error:", err);
      setError("Gagal menghapus profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const exportData = data.map(d => ({
      nama_desa: d.nama_desa || "",
      nama_kecamatan: d.nama_kecamatan || "",
      operator: d.operator || "",
      no_wa: d.no_wa || "",
      email: d.email || "",
      tahun_mulai_gunakan: d.tahun_mulai_gunakan || "",
      jumlah_operator: d.jumlah_operator || 1,
      perangkat_digunakan: d.perangkat_digunakan || "",
      kecepatan_internet: d.kecepatan_internet || "",
      pengelola_website: d.pengelola_website || "",
      frekuensi_update: d.frekuensi_update || "",
      kendala: d.kendala || "",
      saran: d.saran || "",
      versi: d.versi || "",
      jenis_versi: d.jenis_versi || "-",
      status_website: d.status_website || "Online",
      nama_server: d.nama_server || ""
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profil Website");
    XLSX.writeFile(wb, "profil_website.xlsx");
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
        let updated = 0;
        
        for (const row of rows) {
          if (!row.nama_desa || !row.nama_kecamatan) continue;
          const namaDesa = String(row.nama_desa).trim();
          const namaKecamatan = String(row.nama_kecamatan).trim();
          
          // Find Desa ID using both nama_desa and nama_kecamatan
          const desa = desaList.find(d => 
            d.nama_desa.toLowerCase() === namaDesa.toLowerCase() &&
            d.nama_kecamatan?.toLowerCase() === namaKecamatan.toLowerCase()
          );
          if (!desa) {
            console.warn(`Desa ${namaDesa} di Kecamatan ${namaKecamatan} tidak ditemukan, baris dilewati.`);
            continue;
          }

          // Check if profile exists
          const exists = data.find(d => d.desa_id === desa.id);
          
          // Match server
          let server_id = null;
          if (row.nama_server) {
            const srvName = String(row.nama_server).trim();
            const srv = serverList.find(s => s.nama_server.toLowerCase() === srvName.toLowerCase());
            if (srv) server_id = srv.id;
          }

          const payloadData = {
            desa_id: desa.id,
            server_id,
            operator: row.operator ? String(row.operator) : null,
            no_wa: row.no_wa ? String(row.no_wa) : null,
            email: row.email ? String(row.email) : null,
            tahun_mulai_gunakan: row.tahun_mulai_gunakan ? parseInt(row.tahun_mulai_gunakan) : new Date().getFullYear(),
            jumlah_operator: row.jumlah_operator ? parseInt(row.jumlah_operator) : 1,
            perangkat_digunakan: row.perangkat_digunakan || "Laptop",
            kecepatan_internet: row.kecepatan_internet || "10-20 Mbps",
            pengelola_website: row.pengelola_website || "Operator Desa",
            frekuensi_update: row.frekuensi_update || "Bulanan",
            kendala: row.kendala ? String(row.kendala) : null,
            saran: row.saran ? String(row.saran) : null,
            versi: row.versi ? String(row.versi) : null,
            jenis_versi: row.jenis_versi || "-",
            status_website: row.status_website || "Aktif",
          };

          if (!exists) {
            await supabase.from("master_website").insert([payloadData]);
            imported++;
          } else {
            // Update existing data
            await supabase.from("master_website").update(payloadData).eq("id", exists.id);
            updated++;
          }
        }
        
        alert(`Berhasil memproses data: ${imported} profil ditambahkan, ${updated} profil diperbarui.`);
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

  const filtered = data.filter((d) => {
    const matchSearch = d.nama_desa?.toLowerCase().includes(search.toLowerCase()) || d.operator?.toLowerCase().includes(search.toLowerCase());
    const matchKec = filterKec ? d.nama_kecamatan === filterKec : true;
    return matchSearch && matchKec;
  });

  // Unique kecamatans for filter dropdown
  const uniqueKecamatans = Array.from(new Set(desaList.map(d => d.nama_kecamatan).filter(Boolean))).sort() as string[];

  // Available desas for new profiles (exclude those who already have one)
  const availableDesas = desaList.filter(d => !data.some(w => w.desa_id === d.id) || d.id === formData.desa_id);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Profil Website Desa</h1>
          <p className="page-subtitle">Kelola data operator dan inventaris pengelolaan website</p>
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
            <Plus size={16} /> Tambah Profil
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="search-box" style={{ flex: "1 1 300px", maxWidth: 400 }}>
          <Search size={16} />
          <input
            placeholder="Cari desa atau operator..."
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
          {uniqueKecamatans.map((kecName) => (
            <option key={kecName} value={kecName}>{kecName}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
          {filtered.length} profil tersedia
        </span>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--muted-foreground)" }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {filtered.map((item) => (
            <div key={item.id} className="card" style={{ position: "relative", overflow: "hidden", paddingBottom: 16 }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
              }} />
              
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{item.nama_desa}</h3>
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                    Kec. {item.nama_kecamatan}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ padding: 6, borderRadius: 6, color: "var(--primary)" }} onClick={() => openEditModal(item)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-ghost" style={{ padding: 6, borderRadius: 6, color: "#ef4444" }} onClick={() => openDeleteModal(item)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                <InfoItem icon={<Server size={14} />} label="Server Hosting" value={item.nama_server ? `${item.nama_server} (${item.lokasi_server})` : "-"} />
                <InfoItem icon={<Globe size={14} />} label="Status Website" value={item.status_website || "Online"} />
                <InfoItem icon={<Monitor size={14} />} label="Versi OpenSID" value={item.versi ? `${item.versi} (${item.jenis_versi || "-"})` : "-"} />
                <InfoItem icon={<User size={14} />} label="Operator" value={item.operator || "-"} />
                <InfoItem icon={<Phone size={14} />} label="WhatsApp" value={item.no_wa || "-"} />
                <InfoItem icon={<Mail size={14} />} label="Email" value={item.email || "-"} />
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Update: </span>
                  <span className="badge" style={{
                    background: item.frekuensi_update === "Harian" ? "rgba(16,185,129,0.12)" :
                      item.frekuensi_update === "Mingguan" ? "rgba(59,130,246,0.12)" :
                      item.frekuensi_update === "Bulanan" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                    color: item.frekuensi_update === "Harian" ? "#10b981" :
                      item.frekuensi_update === "Mingguan" ? "#3b82f6" :
                      item.frekuensi_update === "Bulanan" ? "#f59e0b" : "#ef4444",
                  }}>
                    {item.frekuensi_update || "Belum ada"}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                  {item.jumlah_operator} operator
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
              Tidak ada profil website yang ditemukan.
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? "Edit Profil Website" : "Tambah Profil Website"}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Desa/Kelurahan *</label>
            <select
              className="form-select"
              required
              value={formData.desa_id}
              onChange={(e) => setFormData({ ...formData, desa_id: e.target.value })}
              disabled={!!formData.id} // Cannot change desa if editing
            >
              <option value="">Pilih Desa...</option>
              {availableDesas.map((d) => (
                <option key={d.id} value={d.id}>{d.nama_desa} - Kec. {d.nama_kecamatan}</option>
              ))}
            </select>
            {formData.id && <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>Desa tidak dapat diubah saat mengedit profil.</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Server Hosting</label>
            <select
              className="form-select"
              value={formData.server_id}
              onChange={(e) => setFormData({ ...formData, server_id: e.target.value })}
            >
              <option value="">-- Tidak Diketahui / Belum Diatur --</option>
              {serverList.map((s) => (
                <option key={s.id} value={s.id}>{s.nama_server} ({s.lokasi_server})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nama Operator *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">No WhatsApp</label>
              <input
                type="text"
                className="form-input"
                value={formData.no_wa}
                onChange={(e) => setFormData({ ...formData, no_wa: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Operator / Desa</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Tahun Mulai Digunakan</label>
              <input
                type="number"
                className="form-input"
                min="2000"
                max={new Date().getFullYear()}
                value={formData.tahun_mulai_gunakan}
                onChange={(e) => setFormData({ ...formData, tahun_mulai_gunakan: parseInt(e.target.value) || new Date().getFullYear() })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Jumlah Tim Operator</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={formData.jumlah_operator}
                onChange={(e) => setFormData({ ...formData, jumlah_operator: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Perangkat Utama</label>
              <select
                className="form-select"
                value={formData.perangkat_digunakan}
                onChange={(e) => setFormData({ ...formData, perangkat_digunakan: e.target.value })}
              >
                <option value="Laptop">Laptop / Notebook</option>
                <option value="PC Desktop">PC Desktop</option>
                <option value="HP Android">Smartphone / HP</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kecepatan Internet</label>
              <select
                className="form-select"
                value={formData.kecepatan_internet}
                onChange={(e) => setFormData({ ...formData, kecepatan_internet: e.target.value })}
              >
                <option value="< 5 Mbps">&lt; 5 Mbps (Sangat Lambat)</option>
                <option value="5-10 Mbps">5-10 Mbps (Sedang)</option>
                <option value="10-20 Mbps">10-20 Mbps (Cepat)</option>
                <option value="> 20 Mbps">&gt; 20 Mbps (Sangat Cepat)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Jabatan Pengelola</label>
              <select
                className="form-select"
                value={formData.pengelola_website}
                onChange={(e) => setFormData({ ...formData, pengelola_website: e.target.value })}
              >
                <option value="Operator Desa">Operator Desa (Khusus)</option>
                <option value="Sekretaris Desa">Sekretaris Desa</option>
                <option value="Kaur Umum">Kaur Umum</option>
                <option value="Staf IT Desa">Staf IT / Relawan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Frekuensi Update Konten</label>
              <select
                className="form-select"
                value={formData.frekuensi_update}
                onChange={(e) => setFormData({ ...formData, frekuensi_update: e.target.value })}
              >
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
                <option value="Jarang">Sangat Jarang / Hampir Tidak Pernah</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Versi OpenSID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 24.08"
                value={formData.versi}
                onChange={(e) => setFormData({ ...formData, versi: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Jenis Versi</label>
              <select
                className="form-select"
                value={formData.jenis_versi}
                onChange={(e) => setFormData({ ...formData, jenis_versi: e.target.value })}
              >
                <option value="-">-</option>
                <option value="Umum">Umum</option>
                <option value="Premium">Premium</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status Website</label>
              <select
                className="form-select"
                value={formData.status_website}
                onChange={(e) => setFormData({ ...formData, status_website: e.target.value })}
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Error">Error / Rusak</option>
                <option value="Maintenance">Sedang Maintenance</option>
                <option value="Diblokir">Diblokir (Suspended)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kendala yang Sering Dihadapi</label>
            <textarea
              className="form-input"
              rows={2}
              value={formData.kendala}
              onChange={(e) => setFormData({ ...formData, kendala: e.target.value })}
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
            <button type="submit" className="btn btn-primary" disabled={saving || !formData.desa_id}>
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
            Apakah Anda yakin ingin menghapus profil website untuk desa <strong>{formData.desa_id}</strong>?
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

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--muted-foreground)", marginBottom: 2, fontSize: 11 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={value}>
        {value}
      </div>
    </div>
  );
}
