"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { canAccessFeature, getFeatureForPath } from "@/lib/auth";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ email?: string; role?: string; globalRole?: string } | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        const data = await response.json();

        if (!mounted) return;

        if (!response.ok || !data?.ok || !data.user) {
          setSession(null);
          router.replace("/login");
          return;
        }

        setSession(data.user);
      } catch {
        if (mounted) {
          setSession(null);
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setBusy(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const feature = getFeatureForPath(pathname ?? "/");
  const hasAccess = !feature || canAccessFeature(session as any, feature);

  useEffect(() => {
    if (session && feature && !hasAccess) {
      router.replace("/dashboard");
    }
  }, [feature, hasAccess, router, session]);

  if (busy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-xl font-semibold">Verificando sesión...</p>
          <p className="mt-2 text-sm text-slate-400">Redirigiendo al acceso.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-400">Acceso no autorizado</p>
          <p className="mt-2 text-sm text-slate-400">
            Este usuario no tiene permiso para ver este módulo.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="mt-5 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
