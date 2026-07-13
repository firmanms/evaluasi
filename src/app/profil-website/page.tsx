"use client";

import { useState } from "react";
import { Globe, Search, Phone, Mail, Wifi, Monitor, Calendar, User } from "lucide-react";
import { masterWebsiteData, desaData, kecamatanData } from "@/lib/mock-data";

export default function ProfilWebsitePage() {
  const [search, setSearch] = useState("");

  const dataWithDesa = masterWebsiteData.map((mw) => {
    const desa = desaData.find((d) => d.id === mw.desa_id);
    const kec = kecamatanData.find((k) => k.id === desa?.kecamatan_id);
    return { ...mw, desa, kec };
  });

  const filtered = dataWithDesa.filter(
    (d) =>
      d.desa?.nama_desa.toLowerCase().includes(search.toLowerCase()) ||
      d.operator.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Profil Website Desa</h1>
        <p className="page-subtitle">Data operator dan profil pengelolaan website desa</p>
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
        <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
          {filtered.length} profil tersedia
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
        {filtered.map((item) => (
          <div key={item.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{item.desa?.nama_desa}</h3>
                <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                  Kec. {item.kec?.nama_kecamatan}
                </p>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6, #1e40af)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Globe size={20} color="#fff" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
              <InfoItem icon={<User size={14} />} label="Operator" value={item.operator} />
              <InfoItem icon={<Phone size={14} />} label="WhatsApp" value={item.no_wa} />
              <InfoItem icon={<Mail size={14} />} label="Email" value={item.email} />
              <InfoItem icon={<Calendar size={14} />} label="Tahun Mulai" value={String(item.tahun_mulai_gunakan)} />
              <InfoItem icon={<Monitor size={14} />} label="Perangkat" value={item.perangkat_digunakan} />
              <InfoItem icon={<Wifi size={14} />} label="Internet" value={item.kecepatan_internet} />
            </div>

            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Frekuensi Update: </span>
                <span className="badge" style={{
                  background: item.frekuensi_update === "Harian" ? "rgba(16,185,129,0.12)" :
                    item.frekuensi_update === "Mingguan" ? "rgba(59,130,246,0.12)" :
                    item.frekuensi_update === "Bulanan" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                  color: item.frekuensi_update === "Harian" ? "#10b981" :
                    item.frekuensi_update === "Mingguan" ? "#3b82f6" :
                    item.frekuensi_update === "Bulanan" ? "#f59e0b" : "#ef4444",
                }}>
                  {item.frekuensi_update}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                {item.jumlah_operator} operator
              </span>
            </div>
          </div>
        ))}
      </div>
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
      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </div>
    </div>
  );
}
