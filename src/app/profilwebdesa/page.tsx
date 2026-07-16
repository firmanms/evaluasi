"use client";

import { useState, useEffect } from "react";
import {
  Globe, Search, Loader2, AlertTriangle, Server, BarChart3, Shield,
  Activity, Users, Layers, Info, CheckCircle2, XCircle, ArrowUpRight
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { supabase } from "@/lib/supabase";

function StatCard({ icon, iconBg, value, label, sub, subColor }: any) {
  return (
    <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", padding: "20px 24px" }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff"
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, margin: "2px 0" }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: subColor, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function ProfilWebDesaDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterVersi, setFilterVersi] = useState("");
  const [filterJenisVersi, setFilterJenisVersi] = useState("");
  const [filterServer, setFilterServer] = useState("");
  const [filterPic, setFilterPic] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const { data: webData, error: webErr } = await supabase
        .from("master_website")
        .select("*, desa(nama_desa, url_website, kecamatan(nama_kecamatan)), master_server(nama_server, lokasi_server)")
        .order("updated_at", { ascending: false });

      if (webErr) throw webErr;

      const flat = (webData || []).map((w) => ({
        ...w,
        nama_desa: w.desa?.nama_desa || "Tidak Diketahui",
        nama_kecamatan: w.desa?.kecamatan?.nama_kecamatan || "Tidak Diketahui",
        url_website: w.desa?.url_website || "",
        nama_server: w.master_server?.nama_server || "Tidak Diketahui",
        lokasi_server: w.master_server?.lokasi_server || "",
      }));

      setData(flat);
    } catch (err: any) {
      console.error("Fetch dashboard data error:", err);
      setError("Gagal memuat data profil website.");
    } finally {
      setLoading(false);
    }
  }

  // Filtered data for table and charts
  const filteredData = data.filter((d) => {
    const matchSearch = d.nama_desa.toLowerCase().includes(search.toLowerCase()) || 
                        (d.operator && d.operator.toLowerCase().includes(search.toLowerCase()));
    const matchVersi = filterVersi ? d.versi === filterVersi : true;
    const matchJenisVersi = filterJenisVersi ? d.jenis_versi === filterJenisVersi : true;
    const matchServer = filterServer ? d.nama_server === filterServer : true;
    const matchPic = filterPic ? d.pic_nama === filterPic : true;
    const matchStatus = filterStatus ? d.status_website === filterStatus : true;

    return matchSearch && matchVersi && matchJenisVersi && matchServer && matchPic && matchStatus;
  });

  // Extract unique lists for filters
  const uniqueVersi = Array.from(new Set(data.map(d => d.versi).filter(Boolean))).sort() as string[];
  const uniqueJenisVersi = Array.from(new Set(data.map(d => d.jenis_versi).filter(Boolean))).sort() as string[];
  const uniqueServers = Array.from(new Set(data.map(d => d.nama_server).filter(Boolean))).sort() as string[];
  const uniquePics = Array.from(new Set(data.map(d => d.pic_nama).filter(Boolean))).sort() as string[];
  const uniqueStatus = Array.from(new Set(data.map(d => d.status_website).filter(Boolean))).sort() as string[];

  // Statistics
  const totalWebsite = filteredData.length;
  const statusOnlineCount = filteredData.filter(d => d.status_website === "Online" || d.status_website === "Aktif").length;
  const statusOfflineCount = totalWebsite - statusOnlineCount;
  const premiumCount = filteredData.filter(d => d.jenis_versi?.toLowerCase() === "premium").length;

  // Chart 1: Status Website Pie Chart
  const statusCounts: Record<string, number> = {};
  filteredData.forEach(d => {
    const s = d.status_website || "Tidak Diketahui";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const COLORS_STATUS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#6b7280"];

  // Chart 2: Versi OpenSID Bar Chart
  const versiCounts: Record<string, number> = {};
  filteredData.forEach(d => {
    const v = d.versi || "Tidak Diketahui";
    versiCounts[v] = (versiCounts[v] || 0) + 1;
  });
  const versiChartData = Object.entries(versiCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Chart 3: Server Hosting Bar Chart
  const serverCounts: Record<string, number> = {};
  filteredData.forEach(d => {
    const s = d.nama_server || "Tidak Diketahui";
    serverCounts[s] = (serverCounts[s] || 0) + 1;
  });
  const serverChartData = Object.entries(serverCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Chart 4: Jenis Versi Pie Chart
  const jenisVersiCounts: Record<string, number> = {};
  filteredData.forEach(d => {
    const j = d.jenis_versi || "Tidak Diketahui";
    jenisVersiCounts[j] = (jenisVersiCounts[j] || 0) + 1;
  });
  const jenisVersiChartData = Object.entries(jenisVersiCounts).map(([name, value]) => ({ name, value }));
  const COLORS_JENIS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#6b7280"];

  const handleResetFilters = () => {
    setSearch("");
    setFilterVersi("");
    setFilterJenisVersi("");
    setFilterServer("");
    setFilterPic("");
    setFilterStatus("");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--muted-foreground)" }}>
        <Loader2 className="animate-spin" size={32} style={{ marginBottom: 12 }} />
        <p>Memuat dashboard profil website...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
        <AlertTriangle size={36} style={{ margin: "0 auto", marginBottom: 12 }} />
        <p>{error}</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={fetchData}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Dashboard Profil Website Desa</h1>
          <p className="page-subtitle">Statistik infrastruktur, versi OpenSID, dan status pengelolaan website desa</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <Layers size={18} color="var(--primary)" /> Filter Data Dashboard
          </h3>
          {(search || filterVersi || filterJenisVersi || filterServer || filterPic || filterStatus) && (
            <button className="btn btn-ghost btn-sm" onClick={handleResetFilters} style={{ fontSize: 12, color: "#ef4444", border: "none", cursor: "pointer", background: "none" }}>
              Reset Filter
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <div className="search-box" style={{ flex: "1 1 200px", minWidth: 200 }}>
            <Search size={16} />
            <input
              placeholder="Cari desa atau operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 140, padding: "8px 12px" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Status (Semua)</option>
            {uniqueStatus.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 140, padding: "8px 12px" }}
            value={filterServer}
            onChange={(e) => setFilterServer(e.target.value)}
          >
            <option value="">Server (Semua)</option>
            {uniqueServers.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 130, padding: "8px 12px" }}
            value={filterVersi}
            onChange={(e) => setFilterVersi(e.target.value)}
          >
            <option value="">Versi (Semua)</option>
            {uniqueVersi.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 140, padding: "8px 12px" }}
            value={filterJenisVersi}
            onChange={(e) => setFilterJenisVersi(e.target.value)}
          >
            <option value="">Jenis Versi (Semua)</option>
            {uniqueJenisVersi.map((jv) => (
              <option key={jv} value={jv}>{jv}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: "auto", minWidth: 140, padding: "8px 12px" }}
            value={filterPic}
            onChange={(e) => setFilterPic(e.target.value)}
          >
            <option value="">PIC (Semua)</option>
            {uniquePics.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <StatCard
          icon={<Globe size={22} />}
          iconBg="linear-gradient(135deg, #3b82f6, #1d4ed8)"
          value={totalWebsite}
          label="Total Profil Website"
          sub="Berdasarkan filter aktif"
          subColor="var(--muted-foreground)"
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          iconBg="linear-gradient(135deg, #10b981, #047857)"
          value={statusOnlineCount}
          label="Website Aktif / Online"
          sub={`${totalWebsite > 0 ? Math.round((statusOnlineCount / totalWebsite) * 100) : 0}% dari total`}
          subColor="#10b981"
        />
        <StatCard
          icon={<XCircle size={22} />}
          iconBg="linear-gradient(135deg, #ef4444, #b91c1c)"
          value={statusOfflineCount}
          label="Website Tidak Aktif / Error"
          sub={`${totalWebsite > 0 ? Math.round((statusOfflineCount / totalWebsite) * 100) : 0}% dari total`}
          subColor="#ef4444"
        />
        <StatCard
          icon={<Shield size={22} />}
          iconBg="linear-gradient(135deg, #8b5cf6, #6d28d9)"
          value={premiumCount}
          label="OpenSID Premium"
          sub={`${totalWebsite > 0 ? Math.round((premiumCount / totalWebsite) * 100) : 0}% dari total`}
          subColor="#8b5cf6"
        />
      </div>

      {/* Charts Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Row 1: Pie Charts (2 Kolom) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
        {/* Chart 1: Status Website */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Distribusi Status Website</h3>
          {statusChartData.length > 0 ? (
            <div style={{ height: 260, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Desa`, "Jumlah"]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoDataPlaceholder />
          )}
        </div>

        {/* Chart 2: Jenis Versi */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Distribusi Jenis Versi OpenSID</h3>
          {jenisVersiChartData.length > 0 ? (
            <div style={{ height: 260, position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jenisVersiChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {jenisVersiChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_JENIS[index % COLORS_JENIS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Desa`, "Jumlah"]} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoDataPlaceholder />
          )}
        </div>
        </div>

        {/* Row 2: List (3 Kolom inner) */}
        {/* Chart 3: Versi OpenSID */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Versi OpenSID Terinstall</h3>
          {versiChartData.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px 24px", marginTop: 8 }}>
              {versiChartData.map((item, index) => {
                const max = versiChartData[0]?.value || 1;
                const percent = (item.value / max) * 100;
                return (
                  <div key={index}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--foreground)" }}>{item.name}</span>
                      <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                        <strong style={{ color: "var(--foreground)" }}>{item.value}</strong> desa
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "rgba(139,92,246,0.1)", borderRadius: 3, overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${percent}%`, 
                          height: "100%", 
                          background: "#8b5cf6", 
                          borderRadius: 3 
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <NoDataPlaceholder />
          )}
        </div>

        {/* Chart 4: Server Hosting */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Distribusi Server</h3>
          {serverChartData.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px 24px", marginTop: 8 }}>
              {serverChartData.map((item, index) => {
                const max = serverChartData[0]?.value || 1;
                const percent = (item.value / max) * 100;
                return (
                  <div key={index}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "var(--foreground)", textTransform: "uppercase" }}>{item.name}</span>
                      <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                        <strong style={{ color: "var(--foreground)" }}>{item.value}</strong> desa
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 6, background: "rgba(59,130,246,0.1)", borderRadius: 3, overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${percent}%`, 
                          height: "100%", 
                          background: "#3b82f6", 
                          borderRadius: 3 
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <NoDataPlaceholder />
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Daftar Rincian Profil Website Desa ({filteredData.length})</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px", textAlign: "center" }}>No</th>
                <th>Desa / Kecamatan</th>
                <th>URL Website</th>
                <th>Server Hosting</th>
                <th>Versi OpenSID</th>
                <th>Jenis Versi</th>
                <th>PIC Pendamping</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const isOnline = item.status_website === "Online" || item.status_website === "Aktif";
                return (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center", color: "var(--muted-foreground)" }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.nama_desa}</div>
                      <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Kec. {item.nama_kecamatan}</div>
                    </td>
                    <td>
                      {item.url_website ? (
                        <a href={item.url_website.startsWith("http") ? item.url_website : `https://${item.url_website}`} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                          {item.url_website.replace(/^https?:\/\//, "")} <ArrowUpRight size={12} />
                        </a>
                      ) : (
                        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>-</span>
                      )}
                    </td>
                    <td>{item.nama_server} {item.lokasi_server ? `(${item.lokasi_server})` : ""}</td>
                    <td style={{ fontWeight: 500, fontFamily: "monospace" }}>{item.versi || "-"}</td>
                    <td>
                      <span className="badge" style={{
                        background: item.jenis_versi === "Premium" ? "rgba(139,92,246,0.12)" : "rgba(107,114,128,0.12)",
                        color: item.jenis_versi === "Premium" ? "#8b5cf6" : "#4b5563"
                      }}>
                        {item.jenis_versi || "-"}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{item.pic_nama || "-"}</div>
                      <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{item.pic_no_tel || ""}</div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: isOnline ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        color: isOnline ? "#10b981" : "#ef4444"
                      }}>
                        <span className={`status-dot ${isOnline ? "status-dot-green" : "status-dot-red"}`} style={{ marginRight: 6 }} />
                        {item.status_website || "Online"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)" }}>
                    Tidak ada data profil website yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NoDataPlaceholder() {
  return (
    <div style={{ height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
      <Info size={32} style={{ marginBottom: 8 }} />
      <p style={{ margin: 0, fontSize: 13 }}>Tidak ada data tersedia</p>
    </div>
  );
}
