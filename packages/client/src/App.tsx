import { Link, NavLink, Outlet, Routes, Route } from 'react-router-dom';
import GeneratorPage from './pages/GeneratorPage';
import NotesListPage from './pages/NotesListPage';
import NoteDetailPage from './pages/NoteDetailPage';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to="/" className="font-bold text-lg text-zinc-100 hover:text-cyan-400 transition-colors">
            Meeting Prep Copilot
          </Link>
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
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 py-3 text-center text-xs text-zinc-500">
        Meeting Prep Copilot · Internal tool
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<GeneratorPage />} />
        <Route path="notes" element={<NotesListPage />} />
        <Route path="notes/:id" element={<NoteDetailPage />} />
      </Route>
    </Routes>
  );
}
