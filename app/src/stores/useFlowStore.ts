import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Flow, Session } from '../types/flow';

interface FlowState {
    flows: Record<string, Flow>;
    currentFlowId: string | null;
    currentSession: Session | null;

    // Actions
    setFlows: (flows: Record<string, Flow>) => void;
    setCurrentFlow: (id: string) => void;
    startSession: (flowId: string) => void;
    makeChoice: (choiceLabel: string) => void;
    goBack: () => void;
    resetSession: () => void;
    updateFlow: (flow: Flow) => void;
    deleteFlow: (id: string) => void;
}

export const useFlowStore = create<FlowState>()(
    persist(
        (set, get) => ({
            flows: {},
            currentFlowId: null,
            currentSession: null,

            setFlows: (flows) => set({ flows }),

            setCurrentFlow: (id) => set({ currentFlowId: id }),

            startSession: (flowId) => {
                const flow = get().flows[flowId];
                if (!flow) return;

                const session: Session = {
                    sessionId: crypto.randomUUID(),
                    flowId,
                    history: [flow.startNodeId],
                    answers: {},
                    status: 'active',
                };
                set({ currentSession: session, currentFlowId: flowId });
            },

            makeChoice: (choiceLabel) => {
                const { currentSession, currentFlowId, flows } = get();
                if (!currentSession || !currentFlowId) return;

                const flow = flows[currentFlowId];
                const currentNodeId = currentSession.history[currentSession.history.length - 1];
                const currentNode = flow.nodes[currentNodeId];

                if (!currentNode) return;

                const option = currentNode.options.find(o => o.label === choiceLabel);
                if (!option) return;

                const nextNodeId = option.next;
                const nextNode = flow.nodes[nextNodeId];

                const newHistory = [...currentSession.history, nextNodeId];
                const newAnswers = { ...currentSession.answers, [currentNodeId]: choiceLabel };

                let status = currentSession.status;
                if (nextNode?.type === 'terminal') {
                    status = 'success';
                }

                set({
                    currentSession: {
                        ...currentSession,
                        history: newHistory,
                        answers: newAnswers,
                        status,
                    }
                });
            },

            goBack: () => {
                const { currentSession } = get();
                if (!currentSession || currentSession.history.length <= 1) return;

                const newHistory = currentSession.history.slice(0, -1);
                const lastNodeId = newHistory[newHistory.length - 1];
                const newAnswers = { ...currentSession.answers };
                delete newAnswers[lastNodeId];

                set({
                    currentSession: {
                        ...currentSession,
                        history: newHistory,
                        answers: newAnswers,
                        status: 'active',
                    }
                });
            },

            resetSession: () => {
                const { currentFlowId, flows } = get();
                if (!currentFlowId || !flows[currentFlowId]) return;

                const flow = flows[currentFlowId];
                const newSession: Session = {
                    sessionId: crypto.randomUUID(),
                    flowId: currentFlowId,
                    history: [flow.startNodeId],
                    answers: {},
                    status: 'active',
                };

                // Force clear and reset
                set({ currentSession: null });
                setTimeout(() => {
                    set({ currentSession: newSession });
                }, 0);
            },

            updateFlow: (flow) => set((state) => ({
                flows: { ...state.flows, [flow.flowId]: flow }
            })),

            deleteFlow: (id) => set((state) => {
                const newFlows = { ...state.flows };
                delete newFlows[id];
                return { flows: newFlows };
            }),
        }),
        {
            name: 'san3a-flow-storage',
        }
    )
);
