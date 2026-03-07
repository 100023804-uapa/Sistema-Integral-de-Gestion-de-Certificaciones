"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, Search, X } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  dashboardMenuItems,
  mobileQuickLinkOrder,
  type DashboardMenuItem,
} from "@/components/dashboard/navigation";

type MobileLink = Extract<DashboardMenuItem, { kind: "link" }>;

function canAccess(item: DashboardMenuItem, hasRole: (roles: string[]) => boolean) {
  return !item.allowedRoles || hasRole(item.allowedRoles);
}

export function BottomNav() {
  const pathname = usePathname();
  const { hasRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const visibleLinks = useMemo(
    () =>
      dashboardMenuItems.filter(
        (item): item is MobileLink => item.kind === "link" && canAccess(item, hasRole)
      ),
    [hasRole]
  );

  const quickLinks = useMemo(() => {
    const byHref = new Map(visibleLinks.map((item) => [item.href, item]));
    const selected: MobileLink[] = [];

    mobileQuickLinkOrder.forEach((href) => {
      const item = byHref.get(href);
      if (item && !selected.some((entry) => entry.href === item.href)) {
        selected.push(item);
      }
    });

    visibleLinks.forEach((item) => {
      if (!selected.some((entry) => entry.href === item.href)) {
        selected.push(item);
      }
    });

    return selected.slice(0, 3);
  }, [visibleLinks]);

  const leftLinks = quickLinks.slice(0, 2);
  const rightPrimaryLink = quickLinks[2];

  return (
    <>
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar menu"
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed inset-x-3 bottom-24 z-50 md:hidden">
            <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Navegacion
                  </p>
                  <h3 className="text-base font-bold text-slate-900">Mas opciones</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-3 py-3">
                {dashboardMenuItems.map((item, index) => {
                  if (!canAccess(item, hasRole)) {
                    return null;
                  }

                  if (item.kind === "separator") {
                    return (
                      <div key={`mobile-separator-${index}`} className="px-3 pb-2 pt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                          {item.text}
                        </p>
                      </div>
                    );
                  }

                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                        isActive
                          ? "bg-orange-50 text-orange-600"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="mx-3 mb-3 rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid grid-cols-5 items-end gap-1 px-2 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-3">
            {leftLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center transition-colors",
                    isActive ? "text-accent" : "text-slate-400 hover:text-primary"
                  )}
                >
                  <Icon
                    size={19}
                    className={cn(
                      isActive && "drop-shadow-[0_0_8px_rgba(255,130,0,0.28)]"
                    )}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {leftLinks.length < 2 && <div className="min-h-[58px]" />}

            <div className="flex items-start justify-center">
              <Link
                href="/dashboard/validate"
                aria-label="Buscar o validar certificado"
                className={cn(
                  "-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-accent text-white shadow-xl shadow-orange-500/35 transition-transform active:scale-95",
                  pathname === "/dashboard/validate" && "scale-105"
                )}
              >
                <Search size={26} strokeWidth={3} />
              </Link>
            </div>

            {rightPrimaryLink ? (
              <Link
                href={rightPrimaryLink.href}
                className={cn(
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center transition-colors",
                  pathname === rightPrimaryLink.href
                    ? "text-accent"
                    : "text-slate-400 hover:text-primary"
                )}
              >
                <rightPrimaryLink.icon
                  size={19}
                  className={cn(
                    pathname === rightPrimaryLink.href &&
                      "drop-shadow-[0_0_8px_rgba(255,130,0,0.28)]"
                  )}
                />
                <span className="text-[10px] font-bold uppercase tracking-tight">
                  {rightPrimaryLink.label}
                </span>
              </Link>
            ) : (
              <div className="min-h-[58px]" />
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className={cn(
                "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center transition-colors",
                menuOpen ? "text-accent" : "text-slate-400 hover:text-primary"
              )}
            >
              <Menu size={19} />
              <span className="text-[10px] font-bold uppercase tracking-tight">Mas</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
