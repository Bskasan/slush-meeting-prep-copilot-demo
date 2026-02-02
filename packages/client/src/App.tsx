import { Outlet, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import GeneratorPage from "./pages/GeneratorPage";
import NotesListPage from "./pages/NotesListPage";
import NoteDetailPage from "./pages/NoteDetailPage";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <Navbar />
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
