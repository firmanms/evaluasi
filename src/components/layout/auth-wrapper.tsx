"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Loader2 } from "lucide-react";

type UserProfile = {
  id: string;
  nama: string;
  email: string;
  role: string;
  desa_id: string | null;
  kecamatan_id: string | null;
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
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

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
          if (profile) {
            setUser({
              id: profile.id,
              nama: profile.nama,
              email: profile.email,
              role: profile.role,
              desa_id: profile.desa_id,
              kecamatan_id: profile.kecamatan_id
            });
          }
          setLoading(false);

          if (isPublicRoute) {
            router.replace("/dashboard");
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

  // Layout utama aplikasi (Backend)
  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <Header />
        <main className="main-body">{children}</main>
      </div>
    </AuthContext.Provider>
  );
}
