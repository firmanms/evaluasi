"use client";

import { Bell, Calendar, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/layout/auth-wrapper";

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const [periodeData, setPeriodeData] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeriods();
  }, []);

  async function fetchPeriods() {
    try {
      const { data, error } = await supabase
        .from("periode_evaluasi")
        .select("*")
        .order("tanggal_mulai", { ascending: false });

      if (error) throw error;

      setPeriodeData(data || []);
      
      // Determine initial selected period
      const urlPeriode = searchParams.get("periode");
      const active = data?.find((p) => p.status === "berjalan");
      const initialId = urlPeriode || active?.id || data?.[0]?.id || "";
      
      setSelectedId(initialId);

      // If URL does not have it, set it in URL
      if (!urlPeriode && initialId) {
        updateUrl(initialId);
      }
    } catch (err) {
      console.error("Failed to load periods for header:", err);
    } finally {
      setLoading(false);
    }
  }

  // Monitor URL parameter changes externally
  useEffect(() => {
    const urlPeriode = searchParams.get("periode");
    if (urlPeriode && urlPeriode !== selectedId) {
      setSelectedId(urlPeriode);
    }
  }, [searchParams]);

  const updateUrl = (id: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("periode", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    updateUrl(id);
  };

  return (
    <header className="main-header">
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} style={{ color: "var(--muted-foreground)" }} />
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted-foreground)" }}>
              <Loader2 className="animate-spin" size={14} /> Memuat periode...
            </div>
          ) : (
            <select
              className="form-select"
              style={{ width: "auto", minWidth: 200, padding: "6px 12px", fontSize: 13, fontWeight: 500 }}
              value={selectedId}
              onChange={handlePeriodChange}
            >
              {periodeData.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_periode}
                  {p.status === "berjalan" ? " (Aktif)" : ""}
                </option>
              ))}
              {periodeData.length === 0 && (
                <option value="">Belum Ada Periode</option>
              )}
            </select>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="btn-ghost"
          style={{
            position: "relative",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: "transparent",
          }}
        >
          <Bell size={18} style={{ color: "var(--muted-foreground)" }} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: "#ef4444",
              borderRadius: "50%",
              border: "2px solid var(--card)",
            }}
          />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #3b82f6, #1e40af)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {user?.nama ? user.nama.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "SA"}
          </div>
          <div className="hidden md:block">
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.nama || "Admin Diskominfo"}</div>
            <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              {user?.role ? user.role.replace("_", " ") : "Super Admin"}
            </div>
          </div>
        </div>

        <button 
          className="btn-ghost" 
          onClick={signOut}
          style={{ fontSize: 13, color: "#ef4444", padding: "6px 12px", border: "1px solid #ef444433", borderRadius: 8 }}
        >
          Keluar
        </button>
      </div>
    </header>
  );
}
