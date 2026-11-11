import { useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "../../../utils/cn";
import { useApp } from "../../context/AppContext";

const ProcessSteps = ({ 
    isConnected,
    selectedPng, 
    updateMods, 
    currentStep, 
    completedSteps, 
    setCurrentStep, 
    setCompletedSteps ,
    setSelectedPng
}) => {
    const { pngFiles } = useApp()

    // ------------------------
    // Steps
    // ------------------------
    const buildSteps = (pngFiles) => {
        const ORDER = [
            "toplayer_trace",
            "toplayer_drill",
            "toplayer_outline",
            "bottomlayer_trace",
            "bottomlayer_drill",
            "bottomlayer_outline",
        ];

        const map = {};

        pngFiles.forEach(file => {
            const key = `${file.directory}_${file.job}`;
            map[key] = {
                label: file.job,
                sub: file.directory,
                key: file.job,
                file
            };
        });
        return ORDER.map(k => map[k]).filter(Boolean);
    };
    const steps = buildSteps(pngFiles);

    useEffect(() => {
        if (steps.length > 0 && !selectedPng) {
            setCurrentStep(0);
        }
    }, [steps]);

    // const currentFile = steps[currentStep]?.file;
    // const current = steps[currentStep];
    // const configKey = current?.key;
    // const config = toolConfig?.[modsMachine]?.[configKey];

    const handleMods = () => {
        updateMods(selectedPng)
        setCompletedSteps(prev => [...prev, currentStep]);
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            setSelectedPng(steps[currentStep + 1].file)
        }
    };

    const handleUndo = () => {
        if (!completedSteps.length) return;
        const last = completedSteps[completedSteps.length - 1];
        setCompletedSteps(prev => prev.slice(0, -1));
        setCurrentStep(last);
        setSelectedPng(steps[last].file)
    };

    return (
        <div className="px-2 my-2 pb-5">
            <div className="mb-2 flex items-center justify-between px-1">
                <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Process Steps</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isConnected ? 'Continue through each operation in order.' : 'Connect Mods first to enable the step actions.'}
                    </p>
                </div>
                <span
                    className={cn(
                        "rounded-full border px-2 py-1 text-xs font-medium transition",
                        isConnected
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/20 dark:bg-slate-900 dark:text-slate-400"
                    )}
                >
                    {isConnected ? 'Enabled' : 'Disabled'}
                </span>
            </div>

            <div className={cn(
                "rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white py-4 shadow-sm transition dark:border-white/20 dark:from-slate-950/80 dark:to-slate-900",
                !isConnected && "opacity-70"
            )}>
                <div className="relative flex items-center justify-between">
                    <div className="absolute top-4 left-0 right-0 h-[1px] bg-slate-200 dark:bg-white/10" />

                    <motion.div
                        className={cn(
                            "absolute top-4 left-0 h-[1px]",
                            isConnected
                                ? "bg-gradient-to-r from-ink via-wine to-brandred dark:from-sun dark:via-brandred dark:to-brandred"
                                : "bg-slate-300 dark:bg-slate-600"
                        )}
                        animate={{
                            width: steps.length > 1 ? `${(currentStep / (steps.length - 1)) * 100}%` : "0%"
                        }}
                        transition={{ duration: 0.4 }}
                    />

                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = completedSteps.includes(index);
                        const isLocked = index > currentStep;
                        const isLastCompleted = completedSteps[completedSteps.length - 1] === index;
                        const showActionButton = isActive && !completedSteps.includes(index);

                        return (
                            <div key={index} className="z-10 flex w-full flex-col items-center">
                                <motion.div
                                    animate={{ scale: isConnected && isActive ? 1.15 : 1 }}
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                                        isCompleted && "border-teal-700 bg-teal-700 text-white",
                                        isActive && "border-[#CF2027] bg-[#CF2027] text-white ring-4 ring-rose-100 dark:ring-rose-400/20",
                                        isLocked && "border-slate-200 bg-gray-100 text-gray-500 dark:border-white/20 dark:bg-white/10 dark:text-slate-400",
                                        !isConnected && isActive && !isCompleted && "ring-4 ring-slate-100 dark:ring-white/10"
                                    )}
                                >
                                    {isCompleted ? "✓" : index + 1}
                                </motion.div>

                                <div className="mt-2 text-center">
                                    <p className={`text-xs capitalize font-semibold ${isActive ? "text-[#B01A21] dark:text-rose-300" : "text-gray-700 dark:text-slate-200"}`}>
                                        {step.label}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize dark:text-slate-400">
                                        {step.sub}
                                    </p>
                                </div>

                                <div className="mt-2 flex h-6 items-center justify-center gap-1">
                                    {showActionButton && (
                                        <motion.button
                                            className={cn(
                                                "flex items-center justify-center rounded-md px-2.5 py-1 text-xs shadow-sm transition",
                                                isConnected
                                                    ? "bg-brandred text-white hover:bg-[#B01A21]"
                                                    : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500 shadow-none dark:border-white/20 dark:bg-white/10 dark:text-slate-400"
                                            )}
                                            whileTap={isConnected ? { scale: 0.98 } : undefined}
                                            disabled={!isConnected}
                                            onClick={handleMods}
                                        >
                                            <p className="ps-0.5 font-medium">Send to Mods</p>
                                        </motion.button>
                                    )}

                                    {isCompleted && isLastCompleted && (
                                        <motion.button
                                            whileTap={isConnected ? { scale: 0.92 } : undefined}
                                            onClick={handleUndo}
                                            disabled={!isConnected}
                                            className={cn(
                                                "rounded-md border px-2 py-1 text-xs transition",
                                                isConnected
                                                    ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                                                    : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 dark:border-white/20 dark:bg-white/10 dark:text-slate-400"
                                            )}
                                        >
                                            Undo
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProcessSteps;

//                     <motion.div
//                         key={configKey}
//                         initial={{ opacity: 0, y: 6 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className="min-h-[200px] hidden"
//                     >
//                         {!configKey && (
//                             <div className="bg-slate-100 rounded-xl p-4 text-center text-xs text-gray-500">
//                                 No configuration required
//                             </div>
//                         )}

//                         {configKey && config && (
//                             <>
//                                 <div className="flex flex-col rounded-xl gap-3">
//                                     <motion.div
//                                         whileHover={{ y: -2 }}
//                                         className="flex gap-4 items-start mb-3 rounded-xl transition"
//                                     >                                   
//                                         <div className="bg-slate-50 rounded-xl p-4 flex-1">
//                                             {/* TOOL */}
//                                             <div className="flex items-center gap-2">
//                                                 <label className="text-xs w-24 text-black">Tool</label>
//                                                 <input
//                                                     value={config.tool}
//                                                     onChange={(e) => handleChange("tool", e.target.value)}
//                                                     className="rounded-lg w-full focus:outline-none text-xs py-1.5 px-2 border bg-white"
//                                                 />
//                                             </div>

//                                             {/* DEPTH + FEED */}
//                                             <div className="flex gap-4 justify-between">

//                                                 {config.depth !== undefined && (
//                                                     <div className="flex items-center gap-2 flex-1">
//                                                         <label className="text-xs w-24 text-black">Depth</label>
//                                                         <input
//                                                             type="number"
//                                                             value={config.depth}
//                                                             onChange={(e) => handleChange("depth", +e.target.value)}
//                                                             className="rounded-lg w-28 text-center text-xs py-1.5 border bg-white"
//                                                         />
//                                                     </div>
//                                                 )}

//                                                 {config.feedRate !== undefined && (
//                                                     <div className="flex items-center gap-2 flex-1">
//                                                         <label className="text-xs w-24 text-black">Feed</label>
//                                                         <input
//                                                             type="number"
//                                                             value={config.feedRate}
//                                                             onChange={(e) => handleChange("feedRate", +e.target.value)}
//                                                             className="rounded-lg w-28 text-center text-xs py-1.5 border bg-white"
//                                                         />
//                                                     </div>
//                                                 )}
//                                             </div>

//                                             {/* PASS DEPTH */}
//                                             {config.passDepth !== undefined && (
//                                                 <div className="flex items-center gap-2">
//                                                     <label className="text-xs w-24 text-black">Pass Depth</label>
//                                                     <input
//                                                         type="number"
//                                                         value={config.passDepth}
//                                                         onChange={(e) => handleChange("passDepth", +e.target.value)}
//                                                         className="rounded-lg w-28 text-center text-xs py-1.5 border bg-white"
//                                                     />
//                                                 </div>
//                                             )}

//                                             {/* TABS */}
//                                             {config.tabs !== undefined && (
//                                                 <div className="flex items-center gap-2">
//                                                     <label className="text-xs w-24 text-black">Tabs</label>
//                                                     <input
//                                                         type="checkbox"
//                                                         checked={config.tabs}
//                                                         onChange={(e) => handleChange("tabs", e.target.checked)}
//                                                     />
//                                                 </div>
//                                             )}

//                                             {/* ACTION ROW */}
//                                             <div className="flex items-center mt-4">

//                                                 {/* FILE PREVIEW STYLE (match LayoutSetup) */}
//                                                 <div className={cn(
//                                                     "flex items-center gap-1 bg-white border py-1 px-2 rounded text-xs text-gray-500 mr-auto",
//                                                     isDirty ? "opacity-100" : "opacity-60"
//                                                 )}>
//                                                     <DocumentCheckIcon width={14} height={14} stroke="green" />
//                                                     {isDirty ? "Unsaved changes" : "Saved config"}
//                                                 </div>

//                                                 {/* RESET */}
//                                                 <motion.button
//                                                     whileTap={{ scale: 0.98 }}
//                                                     onClick={resetToolConfig}
//                                                     className="flex items-center gap-1 border bg-white rounded-lg overflow-hidden mr-2"
//                                                 >
//                                                     <div className="bg-gray-100 px-2 py-1.5 border-2 border-white">
//                                                         ↺
//                                                     </div>
//                                                     <p className="text-xs text-gray-600 pr-3">Reset</p>
//                                                 </motion.button>

//                                                 {/* SAVE (MATCH PRIMARY BUTTON STYLE) */}
//                                                 <motion.button
//                                                     whileTap={{ scale: 0.98 }}
//                                                     onClick={handleSave}
//                                                     className="flex items-center gap-1 px-2 py-1.5 rounded-lg shadow bg-brandred hover:bg-[#B01A21]"
//                                                 >
//                                                     <p className="font-medium text-xs text-white tracking-wider px-2">
//                                                         {saved ? "Saved" : "Save"}
//                                                     </p>
//                                                 </motion.button>
//                                             </div>
//                                         </div>
//                                     </motion.div>
//                                 </div>
//                             </>
//                         )}
//                     </motion.div>
