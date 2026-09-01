export type NodeType = 'question' | 'diagnosis' | 'action' | 'decision' | 'terminal' | 'link';

export interface Option {
    label: string;
    next: string;
    tags?: string[];
    condition?: string;
}

export interface ResolvedCheck {
    question?: string;
    nextIfNo?: string;
}

export interface Node {
    id: string;
    type: NodeType;
    text: string;
    meta?: {
        hint?: string;
        image?: string;
        attachments?: string[];
        [key: string]: any;
    };
    options: Option[];
    resolvedCheck?: ResolvedCheck;
    x?: number;
    y?: number;
    suggestions?: string[];
}

export interface Flow {
    flowId: string;
    title: string;
    description: string;
    startNodeId: string;
    nodes: Record<string, Node>;
    mermaidSource?: string;
    metadata: {
        createdBy: string;
        version: string;
        lastUpdated?: string;
    };
}

export interface Session {
    sessionId: string;
    flowId: string;
    history: string[]; // array of node IDs
    answers: Record<string, string>; // nodeId -> choiceLabel
    status: 'active' | 'success' | 'unresolved';
}
