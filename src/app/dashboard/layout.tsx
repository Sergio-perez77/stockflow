import { ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />

        <main className="flex-1 min-w-0 p-8 text-white overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}