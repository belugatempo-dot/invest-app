"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/screens", label: "主题筛选", labelEn: "Screener", icon: "◉" },
  { href: "/dashboard", label: "决策面板", labelEn: "Dashboard", icon: "◈" },
  { href: "/history", label: "历史追踪", labelEn: "History", icon: "◷" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative shrink-0 border-r border-border-subtle bg-sidebar flex flex-col transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-surface-raised text-text-secondary hover:text-foreground hover:bg-surface transition-colors"
        aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        <span className="text-xs">{collapsed ? "›" : "‹"}</span>
      </button>

      {/* Logo */}
      <div className={`p-6 pb-4 ${collapsed ? "px-3" : ""}`}>
        {collapsed ? (
          <h1 className="font-[family-name:var(--font-serif)] text-xl text-primary text-center">
            投
          </h1>
        ) : (
          <>
            <h1 className="font-[family-name:var(--font-serif)] text-xl text-foreground tracking-tight">
              <span className="text-primary">投资</span>决策
            </h1>
            <p className="text-xs text-text-muted mt-1 font-[family-name:var(--font-mono)]">
              Decision Engine v2
            </p>
            <div className="gold-divider mt-4" />
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-surface-raised text-foreground gold-glow"
                  : "text-text-secondary hover:text-foreground hover:bg-surface"
              }`}
            >
              <span className="text-base opacity-70">{item.icon}</span>
              {!collapsed && (
                <div>
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-[10px] text-text-muted font-[family-name:var(--font-mono)]">
                    {item.labelEn}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border-subtle">
          <p className="text-[10px] text-text-muted text-center font-[family-name:var(--font-mono)]">
            Powered by Claude + TradingView
          </p>
        </div>
      )}
    </aside>
  );
}
