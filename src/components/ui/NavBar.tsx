import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
            <span className="text-sky-400 font-bold text-sm font-mono">P</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none text-zinc-100">
              Smart Parking
            </h1>
            <p className="text-[10px] text-zinc-500 leading-none mt-0.5">
              Smart Campus · ATITUS
            </p>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              )
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/painel"
            className={({ isActive }) =>
              cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              )
            }
          >
            Painel ao Vivo
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
