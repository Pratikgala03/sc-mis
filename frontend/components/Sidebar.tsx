"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getUser } from "@/lib/auth";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",    icon: "▦", adminOnly: false },
  { href: "/upload",     label: "Data Upload",  icon: "↑", adminOnly: false },
  { href: "/mis",        label: "MIS Generator",icon: "⊞", adminOnly: false },
  { href: "/managers",   label: "Managers",     icon: "◎", adminOnly: false },
  { href: "/payroll",    label: "Payroll",      icon: "£", adminOnly: false },
  { href: "/ai",         label: "AI Assistant", icon: "✦", adminOnly: false },
  { href: "/admin",      label: "Users",        icon: "⚙", adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  function logout() { clearAuth(); router.push("/login"); }

  return (
    <aside className="w-56 shrink-0 bg-card border-r border-primary/30 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-primary/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SC</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-text leading-none">SureCare MIS</p>
            <p className="text-xs text-text-muted mt-0.5">Chelsea & Fulham</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.filter(({ adminOnly }) => !adminOnly || user?.role === "admin").map(({ href, label, icon }) => (
          <Link key={href} href={href} className={clsx("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition", pathname.startsWith(href) ? "bg-primary/40 text-text font-medium" : "text-text-muted hover:bg-primary/20 hover:text-text")}>
            <span className="w-4 text-center text-base leading-none">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-primary/20">
        <p className="text-xs font-medium text-text truncate">{user?.full_name}</p>
        <p className="text-xs text-text-muted capitalize">{user?.role}</p>
        <button onClick={logout} className="mt-3 text-xs text-danger hover:underline">Sign out</button>
      </div>
    </aside>
  );
}
