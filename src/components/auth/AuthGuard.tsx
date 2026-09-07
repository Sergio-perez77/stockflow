"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  canAccessFeature,
  getFeatureForPath,
  getStoredSession,
  setStoredSession,
  DEMO_USER,
} from "@/lib/auth";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const session = getStoredSession();
  const isAuthenticated = Boolean(session);
  const feature = getFeatureForPath(pathname ?? "/");
  const hasAccess = !feature || canAccessFeature(session, feature);

  useEffect(() => {
    if (!isAuthenticated) {
      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1");

      if (process.env.NODE_ENV === "development" || isLocalhost) {
        try {
          setStoredSession(DEMO_USER);
          router.replace("/dashboard");
        } catch (e) {
          // ignore
        }

        return;
      }

      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && feature && !hasAccess) {
      router.replace("/dashboard");
    }
  }, [feature, hasAccess, isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-xl font-semibold">Verificando sesión...</p>
          <p className="mt-2 text-sm text-slate-400">Redirigiendo al acceso.</p>
        </div>
      </div>
    );
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
