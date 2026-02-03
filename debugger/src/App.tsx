import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useFlowStore } from './stores/useFlowStore.ts';
import { sampleFlow } from './data/sampleFlow.ts';
import DebuggerWizard from './pages/DebuggerWizard.tsx';
import DebuggerFlowchart from './pages/DebuggerFlowchart.tsx';
import DeveloperEditor from './pages/DeveloperEditor.tsx';
import { LayoutDashboard, GitGraph, Settings, HelpCircle, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

function App() {
  const { setFlows, setCurrentFlow, flows, currentFlowId, currentSession, resetSession } = useFlowStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Always update the sample flow from source to keep it in sync with code
    const updatedFlows = { ...flows };
    updatedFlows[sampleFlow.flowId] = sampleFlow;
    setFlows(updatedFlows);

    // Set current flow if not set
    if (!currentFlowId) {
      setCurrentFlow(sampleFlow.flowId);
    }

    // Reset session if it exists to clear any stale node references
    if (currentSession) {
      resetSession();
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
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
            "w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300",
            "lg:relative lg:translate-x-0",
            "fixed inset-y-0 left-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>

            <div className="p-6 border-bottom border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg">
                  <Settings size={22} />
                </div>
                <span className="font-montserrat font-bold text-lg text-gray-900 leading-tight">
                  San3a<br />Debugger
                </span>
              </div>
            </div>

            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
              <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Wizard (Learner)" onClick={() => setSidebarOpen(false)} />
              <NavLink to="/flowchart" icon={<GitGraph size={20} />} label="Flowchart" onClick={() => setSidebarOpen(false)} />
              <NavLink to="/developer" icon={<Settings size={20} />} label="Developer Editor" onClick={() => setSidebarOpen(false)} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 p-3 text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">
                <HelpCircle size={20} />
                <span className="text-sm font-medium">Documentation</span>
              </div>
              <div className="mt-2 p-3 bg-primary-light/30 rounded-lg text-xs text-primary font-medium">
                Version 1.0.0 (Beta)
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 relative overflow-hidden flex flex-col">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden fixed top-4 left-4 z-20 p-2 bg-white rounded-lg shadow-lg border border-gray-200 text-gray-700 hover:text-gray-900"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>

            <Routes>
              <Route path="/" element={<DebuggerWizard />} />
              <Route path="/flowchart" element={<DebuggerFlowchart />} />
              <Route path="/developer" element={<DeveloperEditor />} />
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
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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

export default App;
