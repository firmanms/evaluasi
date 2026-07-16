"use client";

import { useState, useEffect } from "react";
import { 
  Activity, AlertTriangle, CheckCircle2, Search, Loader2, 
  Trash2, RefreshCw, XCircle, Globe, Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cekDomain } from "./actions";


export default function MonitoringPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    up: 0,
    down: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const { data: logs, error } = await supabase
        .from("log_monitoring_otomatis")
        .select("*, desa(nama_desa, url_website, kecamatan(nama_kecamatan))")
        .order("tanggal_cek", { ascending: false })
        .limit(100); // just fetch the latest 100 for now to keep it light

      if (error) throw error;
      
      const formatted = (logs || []).map((l: any) => ({
        ...l,
        nama_desa: l.desa?.nama_desa,
        url_website: l.desa?.url_website,
        nama_kecamatan: l.desa?.kecamatan?.nama_kecamatan,
      }));
      
      setData(formatted);

      // calculate simple stats
      let up = 0;
      let down = 0;
      let totalMs = 0;
      let msCount = 0;

      formatted.forEach((l) => {
        if (l.http_status === 200) {
          up++;
          totalMs += (l.response_time_ms || 0);
          msCount++;
        } else {
          down++;
        }
      });

      setStats({
        up,
        down,
        avgResponseTime: msCount > 0 ? Math.round(totalMs / msCount) : 0
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const simulatePing = async () => {
    setSimulating(true);
    try {
      // 1. Get all active desa that have a website URL
      const { data: desas, error: desaErr } = await supabase
        .from("desa")
        .select("id, nama_desa, url_website")
        .eq("status_aktif", true)
        .not("url_website", "is", null)
        .neq("url_website", "");

      if (desaErr) throw desaErr;
      if (!desas || desas.length === 0) {
        alert("Tidak ada desa aktif yang memiliki URL Website untuk dimonitor.");
        return;
      }

      // 2. Cek semua domain
      const newLogs = await Promise.all(
        desas.map(async (d) => {
          const start = Date.now();
          const statusResult = await cekDomain(d.url_website);
          const responseTime = Date.now() - start;

          const isUp = statusResult.startsWith("Aktif");
          const isHttps = statusResult.includes("HTTPS");

          let httpStatus = isUp ? 200 : 500;
          if (statusResult.includes("(")) {
            const match = statusResult.match(/\((\d+)\)/);
            if (match) {
              httpStatus = parseInt(match[1]);
            }
          }

          return {
            desa_id: d.id,
            tanggal_cek: new Date().toISOString(),
            http_status: httpStatus,
            https_aktif: isHttps,
            response_time_ms: isUp ? responseTime : 0,
            keterangan: statusResult
          };
        })
      );

      // 3. Insert logs
      const { error: insErr } = await supabase
        .from("log_monitoring_otomatis")
        .insert(newLogs);

      if (insErr) throw insErr;
      
      await fetchLogs();
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan pengecekan.");
    } finally {
      setSimulating(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm("Hapus semua log monitoring?")) return;
    try {
      // Delete all
      const { error } = await supabase.from("log_monitoring_otomatis").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // trick to delete all rows
      if (error) throw error;
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = data.filter((d) => 
    d.nama_desa?.toLowerCase().includes(search.toLowerCase()) ||
    d.url_website?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Monitoring Teknis</h1>
          <p className="page-subtitle">Log uptime dan respons server website desa</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-secondary" onClick={clearLogs} disabled={loading || simulating}>
            <Trash2 size={16} /> Bersihkan Log
          </button>
          <button className="btn btn-primary" onClick={simulatePing} disabled={loading || simulating}>
            {simulating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} 
            Jalankan Cek Uptime
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--muted-foreground)", fontWeight: 500 }}>Status UP (200)</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.up}</div>
          </div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--muted-foreground)", fontWeight: 500 }}>Status DOWN</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.down}</div>
          </div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--muted-foreground)", fontWeight: 500 }}>Rata-rata Respon</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.avgResponseTime} <span style={{ fontSize: 14 }}>ms</span></div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="search-box" style={{ flex: "1 1 300px", maxWidth: 400 }}>
          <Search size={16} />
          <input
            placeholder="Cari desa atau URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                  <th>Waktu Cek</th>
                  <th>Desa</th>
                  <th>URL Website</th>
                  <th>Status HTTP</th>
                  <th>HTTPS</th>
                  <th>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isUp = item.http_status === 200;
                  return (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(item.tanggal_cek).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {item.nama_desa}
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 400 }}>
                          Kec. {item.nama_kecamatan}
                        </div>
                      </td>
                      <td style={{ color: "var(--primary)" }}>
                        <a href={item.url_website?.startsWith('http') ? item.url_website : `https://${item.url_website}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Globe size={14} />
                          {item.url_website || "-"}
                        </a>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: isUp ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                          color: isUp ? "#10b981" : "#ef4444"
                        }}>
                          {isUp ? <CheckCircle2 size={12} style={{ marginRight: 4 }} /> : <AlertTriangle size={12} style={{ marginRight: 4 }} />}
                          {item.http_status} {item.keterangan ? `- ${item.keterangan}` : ""}
                        </span>
                      </td>
                      <td>
                        {item.https_aktif ? (
                          <span style={{ color: "#10b981", fontSize: 12, fontWeight: 600 }}>Aktif</span>
                        ) : (
                          <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 600 }}>Tidak</span>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace", color: isUp ? "inherit" : "#ef4444" }}>
                        {item.response_time_ms} ms
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)" }}>
                      Tidak ada log monitoring. Silakan jalankan cek uptime.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
