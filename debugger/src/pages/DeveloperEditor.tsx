import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useFlowStore } from '../stores/useFlowStore.ts';
import { Save, Code2, Play, Download, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mermaid from 'mermaid';
import { parseMermaid } from '../utils/mermaidParser';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
    },
});

export default function DeveloperEditor() {
    const { currentFlowId, flows, updateFlow, setCurrentFlow } = useFlowStore();
    const [mermaidContent, setMermaidContent] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [svgContent, setSvgContent] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const debounceTimerRef = useRef<number | null>(null);

    // Initial load
    useEffect(() => {
        if (currentFlowId && flows[currentFlowId]) {
            const flow = flows[currentFlowId];
            if (flow.mermaidSource) {
                setMermaidContent(flow.mermaidSource);
            } else {
                // Fallback: Generate a basic mermaid from JSON if possible, 
                // but for now just show a default template
                setMermaidContent(`flowchart TD\n    Start[${flow.title}] --> Node1{Is it working?}\n    Node1 -->|Yes| Success[Great!]\n    Node1 -->|No| Fix[Check power]`);
            }
            setHasUnsavedChanges(false);
        }
    }, [currentFlowId]);

    // Real-time validation and preview
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = window.setTimeout(async () => {
            if (!mermaidContent.trim()) return;

            try {
                // 1. Basic syntax check via mermaid
                const isValidMermaid = await mermaid.parse(mermaidContent);

                if (isValidMermaid) {
                    setIsValid(true);
                    setError(null);

                    // 2. Render preview
                    const { svg } = await mermaid.render('mermaid-preview', mermaidContent);
                    setSvgContent(svg);
                }
            } catch (e: any) {
                setIsValid(false);
                setError(e.str || e.message || 'Invalid Mermaid syntax');
            }
        }, 500);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [mermaidContent]);

    const handleSave = () => {
        if (!currentFlowId || !flows[currentFlowId]) return;

        try {
            const currentFlow = flows[currentFlowId];
            const parsedFlow = parseMermaid(mermaidContent, currentFlow);

            updateFlow(parsedFlow);
            setHasUnsavedChanges(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (e: any) {
            setIsValid(false);
            setError('Error parsing Mermaid to Flow object: ' + e.message);
        }
    };

    const handleExport = () => {
        const blob = new Blob([mermaidContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentFlowId || 'flow'}.mmd`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e]">
            {/* Header */}
            <header className="h-16 px-8 flex items-center justify-between bg-[#252526] border-b border-[#333333] z-10 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <Code2 size={20} />
                        <span>Mermaid IDE</span>
                    </div>
                    <div className="h-4 w-[1px] bg-gray-700" />
                    <select
                        value={currentFlowId || ''}
                        onChange={(e) => setCurrentFlow(e.target.value)}
                        className="bg-[#333] border border-[#444] text-gray-200 text-sm rounded focus:ring-primary focus:border-primary block w-48 p-1 font-mono outline-none"
                    >
                        {Object.values(flows).map((flow) => (
                            <option key={flow.flowId} value={flow.flowId}>
                                {flow.flowId}.mmd
                            </option>
                        ))}
                    </select>
                    {hasUnsavedChanges && (
                        <span className="text-amber-500 text-xs font-medium animate-pulse ml-2">• Unsaved</span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold transition-colors ${showPreview ? 'text-primary' : 'text-gray-400 hover:text-white'
                            }`}
                        title={showPreview ? "Hide Preview" : "Show Preview"}
                    >
                        {showPreview ? <Eye size={18} /> : <EyeOff size={18} />}
                        Preview
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                    >
                        <Download size={16} /> Export
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isValid}
                        className={`btn-primary flex items-center gap-2 py-1.5 px-4 text-sm ${!isValid ? 'opacity-50 cursor-not-allowed grayscale' : ''
                            }`}
                    >
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Wrapper */}
                <div className={`flex-1 relative border-r border-[#333333] transition-all duration-300 ${showPreview ? 'w-1/2' : 'w-full'}`}>
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        theme="vs-dark"
                        value={mermaidContent}
                        onChange={(v) => {
                            setMermaidContent(v || '');
                            setHasUnsavedChanges(true);
                        }}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            fontFamily: 'JetBrains Mono, Fira Code, monospace',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20 },
                            wordWrap: 'on',
                        }}
                    />
                </div>

                {/* Preview / Sidebar */}
                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: '50%', opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-[#1e1e1e] flex flex-col border-l border-[#333333]"
                        >
                            {/* Validation Bar */}
                            <div className={`px-4 py-2 border-b border-[#333333] flex items-center justify-between ${isValid ? 'bg-green-900/10' : 'bg-red-900/20'
                                }`}>
                                <div className="flex items-center gap-2 text-sm">
                                    {isValid ? (
                                        <>
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            <span className="text-green-400 font-medium">Syntax Valid</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={16} className="text-red-500" />
                                            <span className="text-red-400 font-medium">Syntax Error</span>
                                        </>
                                    )}
                                </div>
                                {!isValid && error && (
                                    <span className="text-[10px] text-red-300 bg-red-900/40 px-2 py-1 rounded font-mono truncate max-w-[250px]">
                                        {error}
                                    </span>
                                )}
                            </div>

                            {/* SVG Preview Container */}
                            <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[#2d2d2d] bg-grid-[#333333]/30">
                                {svgContent ? (
                                    <div
                                        className="max-w-full h-auto"
                                        dangerouslySetInnerHTML={{ __html: svgContent }}
                                    />
                                ) : (
                                    <div className="text-gray-500 flex flex-col items-center gap-4">
                                        <Code2 size={48} className="opacity-20" />
                                        <p className="text-sm">Generating preview...</p>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions Footer */}
                            <div className="p-4 bg-[#252526] border-t border-[#333333] flex justify-between items-center">
                                <button
                                    disabled={!isValid}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isValid
                                        ? 'bg-primary text-white hover:shadow-lg hover:shadow-primary/20'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                    onClick={() => isValid && (window.location.href = '/')}
                                >
                                    <Play size={18} />
                                    Test in Wizard
                                </button>
                                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">
                                    Mermaid Flowchart Engine v10+
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-3 bg-green-500 text-white rounded-lg shadow-2xl z-50 font-bold"
                    >
                        <CheckCircle2 size={20} />
                        Flow Updated & Saved!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
