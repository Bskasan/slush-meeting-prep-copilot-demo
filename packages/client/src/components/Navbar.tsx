import { Link, NavLink } from 'react-router-dom';
import HealthBadge from './HealthBadge';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-lg text-zinc-100 hover:text-cyan-400 transition-colors">
            Meeting Prep Copilot
          </Link>
          <HealthBadge />
        </div>
        <nav className="flex gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`
            }
          >
            Generate
          </NavLink>
          <NavLink
            to="/notes"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
              }`
            }
          >
            Notes
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
