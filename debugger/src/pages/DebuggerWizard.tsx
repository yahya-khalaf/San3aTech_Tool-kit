import { useEffect, useCallback } from 'react';
import { useFlowStore } from '../stores/useFlowStore.ts';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';

export default function DebuggerWizard() {
    const { currentSession, flows, currentFlowId, startSession, makeChoice, goBack, resetSession } = useFlowStore();
    const { width, height } = useWindowSize();

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            resetSession();
        }
    }, [resetSession]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (!currentSession && currentFlowId) {
            startSession(currentFlowId);
        }
    }, [currentSession, currentFlowId]);

    if (!currentSession || !currentFlowId || !flows[currentFlowId]) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner text="Loading troubleshooting wizard..." />
            </div>
        );
    }

    const flow = flows[currentFlowId];
    const currentNodeId = currentSession.history[currentSession.history.length - 1];
    const currentNode = flow.nodes[currentNodeId];
    const isStart = currentSession.history.length === 1;

    // Safety check: if current node doesn't exist, show error
    if (!currentNode) {
        console.error('Current node not found:', currentNodeId, 'Available nodes:', Object.keys(flow.nodes));
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Node Not Found</h2>
                    <p className="text-gray-600 mb-4">
                        The current node "{currentNodeId}" doesn't exist in the flow.
                    </p>
                    <button onClick={resetSession} className="btn-primary">
                        Reset Session
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Confetti on success */}
            {currentSession.status === 'success' && (
                <Confetti width={width} height={height} recycle={false} numberOfPieces={500} colors={['#DC2626', '#FEE2E2', '#B91C1C']} />
            )}

            {/* Header */}
            <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-gray-200">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold">{flow.title}</h2>
                    <p className="text-xs text-gray-500 font-medium">Step {currentSession.history.length} of Flow</p>
                </div>
                <div className="flex items-center gap-2">
                    {!isStart && (
                        <button
                            onClick={goBack}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    <button
                        onClick={resetSession}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light rounded-md transition-all"
                    >
                        <RefreshCw size={16} /> Reset
                    </button>
                </div>
            </header>

            {/* Progressive Progress Bar */}
            <div className="h-1.5 w-full bg-gray-200 overflow-hidden">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentSession.history.length / 10) * 100}%` }} // Simplified progress
                    transition={{ duration: 0.5 }}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentNodeId}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                        {/* Logic for Success/Unresolved/Regular Nodes */}
                        <div className="p-10">
                            {currentNode.type === 'terminal' ? (
                                <div className="text-center space-y-6">
                                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${currentSession.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {currentSession.status === 'success' ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-montserrat">{currentSession.status === 'success' ? 'Success!' : 'Needs Escalation'}</h3>
                                        <p className="text-gray-600 text-lg">{currentNode.text}</p>
                                    </div>
                                    <button onClick={resetSession} className="btn-primary px-8 py-3 text-lg mt-4">
                                        Restart Troubleshooting
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Question/Diagnosis Section */}
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                                            {currentNode.type}
                                        </div>
                                        <h3 className="text-2xl font-montserrat leading-tight text-gray-900">
                                            {currentNode.text}
                                        </h3>

                                        {currentNode.meta?.hint && (
                                            <div className="flex gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                                                <HelpCircle size={18} className="shrink-0" />
                                                <p>{currentNode.meta.hint}</p>
                                            </div>
                                        )}

                                        {currentNode.suggestions && (
                                            <ul className="space-y-3 mt-4">
                                                {currentNode.suggestions.map((s, i) => (
                                                    <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 italic text-gray-700">
                                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Options Section */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                        {currentNode.options.map((option) => (
                                            <button
                                                key={option.label}
                                                onClick={() => makeChoice(option.label)}
                                                className="group flex items-center justify-center p-5 rounded-xl border-2 border-gray-100 hover:border-primary hover:bg-primary-light/10 transition-all duration-200 text-left relative overflow-hidden active:scale-95"
                                            >
                                                <span className="font-bold text-gray-700 group-hover:text-primary z-10">{option.label}</span>
                                                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer / Context */}
            <footer className="p-6 bg-white border-t border-gray-200 text-center">
                <p className="text-xs text-gray-400 font-medium">
                    Session ID: <span className="font-mono">{currentSession.sessionId.split('-')[0]}</span> •
                    Flow: <span className="font-bold">{flow.flowId}</span>
                </p>
            </footer>
        </div>
    );
}
