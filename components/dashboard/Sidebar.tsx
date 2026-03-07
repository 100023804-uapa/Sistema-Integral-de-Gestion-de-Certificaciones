"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/config/changelog";
import { ChangelogModal } from "@/components/ui/ChangelogModal";
import { dashboardMenuItems } from "@/components/dashboard/navigation";
import { LogOut, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

export function Sidebar() {
  const pathname = usePathname();
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const { logout, hasRole } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <div className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-primary text-white shadow-2xl md:flex">
        <div className="flex shrink-0 items-center gap-3 p-8">
          <div className="rounded-xl bg-accent p-2">
            <GraduationCap size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-none">SIGCE</span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-blue-200">
              Admin Panel
            </span>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {dashboardMenuItems.map((item, index) => {
            if (item.allowedRoles && !hasRole(item.allowedRoles)) {
              return null;
            }

            if (item.kind === "separator") {
              return (
                <div key={`separator-${index}`} className="pt-4">
                  <div className="px-4 py-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-300 opacity-70">
                      {item.text}
                    </div>
                  </div>
                </div>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                  isActive
                    ? "bg-accent text-white shadow-lg shadow-orange-500/20"
                    : "text-blue-100 hover:bg-white/5"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-white" : "group-hover:text-accent"
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/5 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-blue-200 transition-colors hover:text-white"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesion</span>
          </button>

          <button
            onClick={() => setIsChangelogOpen(true)}
            className="w-full rounded-lg py-2 text-center text-[10px] text-blue-300/50 transition-all hover:bg-white/5 hover:text-blue-200"
          >
            v{APP_VERSION}
          </button>
        </div>
      </div>

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
    </>
  );
}
