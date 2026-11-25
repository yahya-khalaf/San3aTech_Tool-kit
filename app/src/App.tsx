import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useFlowStore } from './stores/useFlowStore.ts';
import { initialFlows } from './data/flowRegistry.ts';
import Dashboard from './pages/Dashboard.tsx';
import DebuggerWizard from './pages/DebuggerWizard.tsx';
import DebuggerFlowchart from './pages/DebuggerFlowchart.tsx';
import DeveloperEditor from './pages/DeveloperEditor.tsx';
import CoursesHub from './pages/CoursesHub.tsx';
import PasswordGate from './components/PasswordGate.tsx';
import {
  LayoutDashboard,
  GraduationCap,
  QrCode,
  Video,
  PenTool,
  CalendarDays,
  Menu,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

function DebuggingGate({ children }: { children: React.ReactNode }) {
  return (
    <PasswordGate
      title="Debugging Fundamentals"
      description="Enter the protected password to access Debugging Fundamentals."
    >
      {children}
    </PasswordGate>
  );
}

declare global {
  interface Window {
    ym?: (id: number, action: string, ...params: unknown[]) => void;
  }
}

function MetrikaRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ym === 'function') {
      window.ym(112138602, 'hit', window.location.href, {
        title: document.title,
        referer: document.referrer
      });
    }
  }, [location.pathname, location.search]);

  return null;
}

function SystemMapRedirect() {
  const { setCurrentFlow } = useFlowStore();
  useEffect(() => {
    setCurrentFlow('systemOverview');
  }, []);
  return <DebuggerFlowchart />;
}

function App() {
  const { setFlows, setCurrentFlow, currentFlowId, currentSession, resetSession } = useFlowStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Load all modules
    setFlows(initialFlows);

    // Set current flow if not set or invalid
    if (!currentFlowId || !initialFlows[currentFlowId]) {
      setCurrentFlow('coreSystem');
    }

    // Always reset session on app load to ensure clean state with new modules
    // This is safer than trying to migrate the session
    if (currentSession) {
      resetSession();
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <MetrikaRouteTracker />
        <div className="relative flex h-screen overflow-hidden font-body">
          {/* Flat brand surface */}
          <div className="pointer-events-none fixed inset-0 bg-surface" />

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <nav className={clsx(
            "w-64 bg-brand-night text-white flex flex-col z-40 transition-transform duration-300",
            "lg:relative lg:translate-x-0",
            "fixed inset-y-0 left-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-sm hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>

            <div className="px-6 pt-6 pb-5">
              <img src="/brand/san3a-academy-logo.png" alt="San3a Academy" className="h-12 w-auto object-contain" />
              <p className="mt-3 s3-eyebrow text-white/70">Toolkit</p>
            </div>
            <div className="s3-stripes" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /></div>

            <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
              <div className="space-y-1">
                <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
              </div>

              <div>
                <p className="px-4 mb-2 s3-eyebrow text-white/60">Courses</p>
                <div className="space-y-1">
                  <NavLink to="/courses" icon={<GraduationCap size={20} />} label="Courses" onClick={() => setSidebarOpen(false)} />
                </div>
              </div>

              <div>
                <p className="px-4 mb-2 s3-eyebrow text-white/60">General Tools</p>
                <div className="space-y-1">
                  <ExternalNavLink href="/tools/qr-generator.html" icon={<QrCode size={20} />} label="QR Generator" />
                  <ExternalNavLink href="/tools/video-to-gif.html" icon={<Video size={20} />} label="Video to GIF" />
                  <ExternalNavLink href="/whiteboard/index.html" icon={<PenTool size={20} />} label="Online Whiteboard" newTab />
                  <ExternalNavLink href="/calendar/index.html" icon={<CalendarDays size={20} />} label="Crash Courses Calendar" />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
              <div className="p-3 text-xs text-white/60 font-medium text-center">
                Version 1.0.0 (Beta)
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 relative overflow-hidden flex flex-col">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden fixed top-4 left-4 z-20 p-2 bg-brand-night rounded-sm shadow-lg text-white hover:bg-brand-wine"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<CoursesHub />} />
              <Route path="/courses/:courseId" element={<CoursesHub />} />
              <Route path="/courses/debugging/wizard" element={<DebuggingGate><DebuggerWizard /></DebuggingGate>} />
              <Route path="/courses/debugging/flowchart" element={<DebuggingGate><DebuggerFlowchart /></DebuggingGate>} />
              <Route path="/courses/debugging/system-map" element={<DebuggingGate><SystemMapRedirect /></DebuggingGate>} />
              <Route path="/courses/debugging/developer" element={<DebuggingGate><DeveloperEditor /></DebuggingGate>} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

function NavLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={twMerge(
        clsx(
          "flex items-center gap-3 px-4 py-3 rounded-none border-l-2 transition-all duration-200 group",
          isActive
            ? "bg-brand-wine text-white border-primary"
            : "text-white/75 border-transparent hover:bg-white/5 hover:text-white"
        )
      )}
    >
      <span className={clsx("transition-transform duration-200", isActive && "scale-110")}>
        {icon}
      </span>
      <span className="font-semibold text-sm">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </Link>
  );
}

function ExternalNavLink({ href, icon, label, newTab }: { href: string; icon: React.ReactNode; label: string; newTab?: boolean }) {
  return (
    <a
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined}
      className="flex items-center gap-3 px-4 py-3 rounded-none border-l-2 border-transparent transition-all duration-200 text-white/75 hover:bg-white/5 hover:text-white"
    >
      {icon}
      <span className="font-semibold text-sm">{label}</span>
    </a>
  );
}

export default App;
