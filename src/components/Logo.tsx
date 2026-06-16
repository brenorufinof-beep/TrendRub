import { Link } from "react-router-dom";

export function Logo({ size = 32, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label="TrendSync — home">
      <span
        className="bg-brand-gradient rounded-xl flex items-center justify-center text-white font-black shadow-[var(--shadow-md)] group-hover:scale-[1.04] transition"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        T
      </span>
      {withText && (
        <span className="text-lg font-bold tracking-tight">
          Trend<span className="text-brand-gradient">Sync</span>
        </span>
      )}
    </Link>
  );
}
