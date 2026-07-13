"use client";

import { Activity, CheckCircle, XCircle, Shield, Clock, RefreshCw } from "lucide-react";
import { logMonitoringData, desaData, kecamatanData } from "@/lib/mock-data";

export default function MonitoringPage() {
  const dataWithDesa = logMonitoringData.map((log) => {
    const desa = desaData.find((d) => d.id === log.desa_id);
    const kec = kecamatanData.find((k) => k.id === desa?.kecamatan_id);
    return { ...log, desa, kec };
  });

  const httpOk = dataWithDesa.filter((d) => d.http_status === 200).length;
  const httpsOk = dataWithDesa.filter((d) => d.https_aktif).length;
  const avgResponse = Math.round(
    dataWithDesa.filter((d) => d.response_time_ms > 0).reduce((s, d) => s + d.response_time_ms, 0) /
    dataWithDesa.filter((d) => d.response_time_ms > 0).length
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Monitoring Teknis</h1>
          <p className="page-subtitle">Status aksesibilitas website desa — pengecekan otomatis terakhir</p>
        </div>
        <button className="btn btn-primary">
          <RefreshCw size={16} /> Jalankan Pengecekan
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }} className="stagger-children">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="stat-value">{httpOk}</div>
            <div className="stat-label">Website Dapat Diakses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" }}>
            <XCircle size={22} />
          </div>
          <div>
            <div className="stat-value">{dataWithDesa.length - httpOk}</div>
            <div className="stat-label">Tidak Dapat Diakses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #1e40af)", color: "#fff" }}>
            <Shield size={22} />
          </div>
          <div>
            <div className="stat-value">{httpsOk}</div>
            <div className="stat-label">HTTPS Aktif</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{avgResponse}ms</div>
            <div className="stat-label">Rata-rata Response Time</div>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>No</th>
                <th>Desa</th>
                <th>Kecamatan</th>
                <th>URL</th>
                <th style={{ width: 100 }}>HTTP Status</th>
                <th style={{ width: 80 }}>HTTPS</th>
                <th style={{ width: 120 }}>Response Time</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {dataWithDesa.map((log, i) => (
                <tr key={log.id}>
                  <td style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{log.desa?.nama_desa}</td>
                  <td style={{ color: "var(--muted-foreground)" }}>{log.kec?.nama_kecamatan}</td>
                  <td style={{ fontSize: 12, color: "var(--primary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.desa?.url_website}
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: log.http_status === 200 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                      color: log.http_status === 200 ? "#10b981" : "#ef4444",
                      fontFamily: "var(--font-geist-mono)",
                    }}>
                      {log.http_status}
                    </span>
                  </td>
                  <td>
                    {log.https_aktif ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#10b981", fontSize: 13 }}>
                        <Shield size={14} /> Ya
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontSize: 13 }}>
                        <XCircle size={14} /> Tidak
                      </span>
                    )}
                  </td>
                  <td>
                    {log.response_time_ms > 0 ? (
                      <span style={{
                        fontWeight: 500,
                        color: log.response_time_ms < 1000 ? "#10b981" :
                          log.response_time_ms < 2000 ? "#f59e0b" : "#ef4444",
                      }}>
                        {log.response_time_ms}ms
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted-foreground)" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: log.keterangan === "OK" ? "#10b981" : "#ef4444" }}>
                    {log.keterangan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
