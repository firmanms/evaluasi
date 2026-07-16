"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, MapPin, ClipboardCheck, ListChecks,
  BarChart3, Globe, AlertTriangle, FileText, Users, Settings,
  ChevronDown, Activity, Award, Menu, X, Server, Shield
} from "lucide-react";
import { useAuth } from "./auth-wrapper";

const navigation = [
  {
    section: "UTAMA",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    section: "MASTER DATA",
    items: [
      { title: "Kecamatan", href: "/master/kecamatan", icon: Building2 },
      { title: "Desa / Kelurahan", href: "/master/desa", icon: MapPin },
      { title: "Server", href: "/master/server", icon: Server },
      { title: "Indikator", href: "/master/indikator", icon: ListChecks },
      { title: "Aspek & Bobot", href: "/master/aspek", icon: Settings },
      { title: "Periode Evaluasi", href: "/master/periode", icon: Activity },
      { title: "Role & Hak Akses", href: "/master/role", icon: Shield },
    ],
  },
  {
    section: "EVALUASI",
    items: [
      { title: "Dashboard Website", href: "/profilwebdesa", icon: BarChart3 },
      { title: "Profil Website Desa", href: "/profil-website", icon: Globe },
      { title: "Input Penilaian", href: "/penilaian", icon: ClipboardCheck },
      { title: "Hasil Evaluasi", href: "/hasil-evaluasi", icon: Award },
    ],
  },
  {
    section: "MONITORING",
    items: [
      { title: "Monitoring Teknis", href: "/monitoring", icon: Activity },
      { title: "Kendala & Tindak Lanjut", href: "/kendala", icon: AlertTriangle },
    ],
  },
  {
    section: "LAPORAN",
    items: [
      { title: "Laporan & Ekspor", href: "/laporan", icon: FileText },
      { title: "Manajemen Pengguna", href: "/pengguna", icon: Users },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  // Filter menu items based on dynamic role permissions
  const filteredNavigation = navigation.map((group) => {
    const items = group.items.filter((item) => {
      // Dashboard is always accessible
      if (item.href === "/dashboard") return true;
      return user?.permissions?.some((p) => item.href === p || item.href.startsWith(p + "/"));
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <BarChart3 size={22} color="#fff" />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
              Monev Web Desa
            </div>
            <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
              Kabupaten Bandung
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredNavigation.map((group) => (
            <div key={group.section}>
              <div className="sidebar-section-title">{group.section}</div>
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-item ${isActive ? "active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} className="sidebar-item-icon" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div style={{
          padding: "16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase"
          }}>
            {user?.nama ? user.nama.slice(0, 2) : "U"}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }} title={user?.nama || ""}>
              {user?.nama || "User"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {user?.role ? user.role.replace(/_/g, " ") : "Guest"}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
