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
  BarChart3,
  Users,
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
      sessionKey="san3a_debugging_authenticated"
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
        <div className="relative flex h-screen overflow-hidden font-inter">
          {/* Decorative brand-toned background (glassmorphism needs something colorful behind it) */}
          <div className="pointer-events-none fixed inset-0 bg-[#FFF7F3]">
            <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-[#CF2027]/15 blur-3xl" />
            <div className="absolute top-1/3 -right-32 w-[26rem] h-[26rem] rounded-full bg-[#781629]/15 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-[24rem] h-[24rem] rounded-full bg-[#240D18]/10 blur-3xl" />
          </div>

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
            "w-64 bg-white/70 backdrop-blur-xl border-r border-white/40 flex flex-col z-40 transition-transform duration-300",
            "lg:relative lg:translate-x-0",
            "fixed inset-y-0 left-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white/60"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>

            <div className="p-6 border-b border-white/40">
              <div className="flex items-center gap-3">
                <img src="/images/San3a-Academy-logo.png" alt="San3a Academy" className="w-10 h-10 object-contain" />
                <span className="font-montserrat font-bold text-lg text-gray-900 leading-tight">
                  San3a<br />Toolkit
                </span>
              </div>
            </div>

            <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
              <div className="space-y-1">
                <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setSidebarOpen(false)} />
              </div>

              <div>
                <p className="px-4 mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Courses</p>
                <div className="space-y-1">
                  <NavLink to="/courses" icon={<GraduationCap size={20} />} label="Courses" onClick={() => setSidebarOpen(false)} />
                </div>
              </div>

              <div>
                <p className="px-4 mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">General Tools</p>
                <div className="space-y-1">
                  <ExternalNavLink href="/tools/qr-generator.html" icon={<QrCode size={20} />} label="QR Generator" />
                  <ExternalNavLink href="/tools/video-to-gif.html" icon={<Video size={20} />} label="Video to GIF" />
                  <ExternalNavLink href="/tools/team-wigs.html" icon={<BarChart3 size={20} />} label="Team WIGs" />
                  <ExternalNavLink href="/tools/individual-wigs.html" icon={<Users size={20} />} label="Individual WIGs" />
                  <ExternalNavLink href="/whiteboard/index.html" icon={<PenTool size={20} />} label="Online Whiteboard" newTab />
                  <ExternalNavLink href="/calendar/index.html" icon={<CalendarDays size={20} />} label="Crash Courses Calendar" />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/40">
              <div className="p-3 bg-primary-light/40 rounded-lg text-xs text-primary font-medium text-center">
                Version 1.0.0 (Beta)
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 relative overflow-hidden flex flex-col">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden fixed top-4 left-4 z-20 p-2 bg-white/80 backdrop-blur-md rounded-lg shadow-lg border border-white/50 text-gray-700 hover:text-gray-900"
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
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
          isActive
            ? "bg-primary-light text-primary border border-primary/10 shadow-sm"
            : "text-gray-500 hover:bg-white/60 hover:text-gray-900"
        )
      )}
    >
      <span className={clsx("transition-transform duration-200", isActive && "scale-110")}>
        {icon}
      </span>
      <span className="font-semibold text-sm">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
    </Link>
  );
}

function ExternalNavLink({ href, icon, label, newTab }: { href: string; icon: React.ReactNode; label: string; newTab?: boolean }) {
  return (
    <a
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined}
      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-500 hover:bg-white/60 hover:text-gray-900"
    >
      {icon}
      <span className="font-semibold text-sm">{label}</span>
    </a>
  );
}

export default App;
