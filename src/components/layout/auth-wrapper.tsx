"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import Link from "next/link";
import { Loader2, Shield } from "lucide-react";

type UserProfile = {
  id: string;
  nama: string;
  email: string;
  role: string;
  desa_id: string | null;
  kecamatan_id: string | null;
  permissions: string[];
};

const FALLBACK_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["/dashboard", "/master/kecamatan", "/master/desa", "/master/server", "/master/indikator", "/master/aspek", "/master/periode", "/profilwebdesa", "/profil-website", "/penilaian", "/hasil-evaluasi", "/monitoring", "/kendala", "/laporan", "/pengguna", "/master/role"],
  admin_kecamatan: ["/dashboard", "/profilwebdesa", "/profil-website", "/penilaian", "/hasil-evaluasi", "/kendala", "/laporan"],
  operator_desa: ["/dashboard", "/profil-website", "/penilaian", "/hasil-evaluasi", "/kendala"],
  viewer: ["/dashboard", "/profilwebdesa", "/profil-website", "/hasil-evaluasi", "/laporan"],
  checker: ["/profilwebdesa", "/profil-website"],
};

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Daftar rute yang tidak perlu login
  const publicRoutes = ["/login", "/", "/webdesa"];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (mounted) {
            setUser(null);
            setLoading(false);
            if (!isPublicRoute) {
              router.replace("/login");
            }
          }
          return;
        }

        // Ambil profil dari users_app
        const { data: profile } = await supabase
          .from("users_app")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          let permissions: string[] = [];
          if (profile) {
            try {
              const { data: roleRes, error: roleErr } = await supabase
                .from("roles_app")
                .select("permissions")
                .eq("nama_role", profile.role)
                .maybeSingle();
              
              if (!roleErr && roleRes) {
                permissions = roleRes.permissions || [];
              } else {
                permissions = FALLBACK_PERMISSIONS[profile.role] || [];
              }
            } catch (e) {
              permissions = FALLBACK_PERMISSIONS[profile.role] || [];
            }

            setUser({
              id: profile.id,
              nama: profile.nama,
              email: profile.email,
              role: profile.role,
              desa_id: profile.desa_id,
              kecamatan_id: profile.kecamatan_id,
              permissions: Array.isArray(permissions) ? permissions : []
            });
          }
          setLoading(false);

          // Hanya redirect ke dashboard jika di halaman /login (bukan landing page /)
          if (pathname === "/login") {
            router.replace(permissions[0] || "/dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
        if (mounted) setLoading(false);
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          checkAuth();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          router.replace("/login");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--background)", color: "var(--primary)" }}>
        <Loader2 className="animate-spin" size={48} style={{ marginBottom: 16 }} />
        <h2 style={{ color: "var(--foreground)" }}>Memeriksa sesi...</h2>
      </div>
    );
  }

  // Jika halaman publik, langsung render children (tanpa Sidebar & Header)
  if (isPublicRoute) {
    return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
  }

  // Jika bukan halaman publik, dan user null, jangan render apapun (karena sedang redirect)
  if (!user) {
    return null;
  }

  // Cek otorisasi rute dinamis (selain dashboard)
  const isDashboard = pathname === "/dashboard";
  const hasPermission = isPublicRoute || isDashboard || user.permissions.some(p => pathname === p || pathname.startsWith(p + "/"));

  if (!hasPermission) {
    return (
      <AuthContext.Provider value={{ user, loading, signOut }}>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <div className="main-content" style={{ flex: 1 }}>
            <Header />
            <main className="main-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
              <div className="card" style={{ padding: 40, maxWidth: 480, width: "100%", textAlign: "center" }}>
                <Shield size={48} color="#ef4444" style={{ margin: "0 auto 16px" }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Akses Ditolak</h2>
                <p style={{ color: "var(--muted-foreground)", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
                  Anda tidak memiliki hak akses untuk membuka modul <strong>{pathname}</strong>. Silakan hubungi Administrator untuk meminta akses.
                </p>
                <Link href={user.permissions[0] || "/dashboard"} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                  Kembali ke Halaman Utama
                </Link>
              </div>
            </main>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  // Layout utama aplikasi (Backend)
  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div className="main-content" style={{ flex: 1 }}>
          <Header />
          <main className="main-body">{children}</main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}
