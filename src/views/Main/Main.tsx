import React, { Suspense } from "react";
import { NavLink } from "react-router";
import { AppRoutes } from "@/routes";
import { History, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { AuthModal } from "@/features/auth";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    to: "/history",
    label: "History",
    icon: <History className="h-5 w-5" />,
    exact: true,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
  },
  { to: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
];

function SidebarNav() {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-2 px-3 pt-4" role="navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "text-neutral-300 hover:text-[var(--sidebar-active-fg)] hover:bg-[var(--sidebar-active-bg)]",
              isActive && "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]",
            )
          }
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800/50 group-hover:bg-neutral-700/60"
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function AppBrand() {
  return (
    <div className="px-4 py-4 border-b border-neutral-800">
      <h1 className="text-lg font-semibold tracking-tight text-neutral-100">MindReel</h1>
      <p className="text-xs text-neutral-400 mt-0.5">Productivity Journal</p>
    </div>
  );
}

export function Main() {
  return (
    <>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 12px; }
        .custom-scroll::-webkit-scrollbar-track { background: var(--layout-scrollbar-track); }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: var(--layout-scrollbar-thumb);
          border-radius: 8px;
          border: 3px solid var(--layout-scrollbar-track);
        }
        .custom-scroll { scrollbar-width: thin; scrollbar-color: var(--layout-scrollbar-thumb) var(--layout-scrollbar-track); }
      `}</style>
      <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100">
        <aside
          className="flex h-full w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] select-none"
          aria-label="Application Sidebar"
        >
          <AppBrand />
          <SidebarNav />
          <div className="mt-auto px-4 py-3 text-[10px] text-neutral-500">v1.0.0</div>
        </aside>

        <div
          className="flex-1 h-full overflow-y-auto bg-background custom-scroll"
          id="layout-scroll-container"
        >
          <div id="app-content" className="min-h-full">
            <RouteErrorBoundary>
              <Suspense
                fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}
              >
                <AppRoutes />
              </Suspense>
            </RouteErrorBoundary>
          </div>
        </div>
      </div>
      <AuthModal />
    </>
  );
}

export default Main;
