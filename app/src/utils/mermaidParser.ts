import type { Flow, Node } from '../types/flow';

/**
 * A parser for Mermaid Flowchart syntax.
 * Converts Mermaid flowchart source into our internal Flow object structure.
 * Supports:
 * - Subgraphs (ignored but parsed)
 * - Styles (ignored)
 * - Shapes: [], {}, (), (()), >], ([])
 * - Links: -->, ---, -.->, ==>
 */
export function parseMermaid(source: string, existingFlow: Partial<Flow> = {}): Flow {
    const nodes: Record<string, Node> = {};
    const lines = source.split('\n');

    // Default flow structure
    const flow: Flow = {
        flowId: existingFlow.flowId || 'mermaid-flow',
        title: existingFlow.title || 'Imported Flow',
        description: existingFlow.description || 'Generated from Mermaid source',
        startNodeId: '',
        nodes: {},
        mermaidSource: source,
        metadata: {
            createdBy: 'System',
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            ...existingFlow.metadata
        }
    };

    // Regex patterns
    const nodeIdPattern = '[a-zA-Z0-9_-]+';

    // Node Definitions
    // ID[Text] -> Box
    // ID{Text} -> Rhombus (Decision)
    // ID(Text) -> Round
    // ID((Text)) -> Circle
    // ID>Text] -> Banner (Diagnosis)
    // ID([Text]) -> Stadium (Terminal/Start)
    const nodeDefPattern = new RegExp(`^(${nodeIdPattern})\\s*(?:\\[\\((.*)\\)\\]|\\(\\[(.*)\\]\\)|\\{\\{(.*)\\}\\}|\\[{1,2}(.*)\\]{1,2}|\\{(.*)\\}|\\({1,2}(.*)\\){1,2}|>(.*)\\])`);

    // Connection: A --> B, A -->|Label| B
    const arrowPattern = /-->+|---+|-.->+|==>+/;

    let firstId: string | null = null;

    lines.forEach(line => {
        let trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('%%') || trimmed.startsWith('---') || trimmed.startsWith('style') || trimmed.startsWith('classDef')) return;

        // Remove flowchart/graph declaration
        if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) {
            return;
        }

        // 1. Check for node definitions
        const nodeMatch = trimmed.match(nodeDefPattern);
        if (nodeMatch) {
            const id = nodeMatch[1];
            // Find the non-undefined capture group for text
            const text = [nodeMatch[2], nodeMatch[3], nodeMatch[4], nodeMatch[5], nodeMatch[6], nodeMatch[7], nodeMatch[8]]
                .find(t => t !== undefined) || id;

            if (!firstId) firstId = id;

            if (!nodes[id]) {
                nodes[id] = createDefaultNode(id);
            }
            nodes[id].text = text.trim();

            // Infer type from shape
            // {} -> Question
            // >] -> Diagnosis
            // ([]) -> Terminal (Start/End)
            if (trimmed.includes('{')) {
                nodes[id].type = 'question';
            } else if (trimmed.includes('>') || trimmed.includes('((')) {
                nodes[id].type = 'diagnosis';
            } else if (trimmed.includes('([')) {
                nodes[id].type = 'terminal';
            } else if (trimmed.includes('[')) {
                nodes[id].type = 'action';
            }

            // If the line is JUST a node definition, we stop here. 
            // BUT, sometimes definitions are part of a connection: A[Start] --> B
            // So we continue to check for connections even if we matched a node.
        }

        // 2. Check for connections
        let fromId = '';
        let toId = '';
        let label = 'Next';

        // Simplify line to just handle edges by removing node definitions temporarily for parsing? 
        // No, regex is cleaner if we just assume standard mermaid edge syntax 
        // which usually separates ID and text.
        // E.g. A[Text] --> B is valid. 
        // Our edge regex assumes ID --> ID. Complexity increases if we handle full inline definitions.
        // For now, let's assume the user uses the format "A --> B" or "A -->|Label| B" mostly.
        // OR the user provided file uses: S --> L1{Layer 1} which defines L1 inline.

        // Advanced strategy: Split by arrow
        const arrowMatch = trimmed.match(arrowPattern);
        if (arrowMatch && arrowMatch.index) {
            const leftPart = trimmed.substring(0, arrowMatch.index).trim();
            const rightPart = trimmed.substring(arrowMatch.index + arrowMatch[0].length).trim();

            // Extract ID from left part (might be "A" or "A[Text]")
            const leftIdMatch = leftPart.match(/^([a-zA-Z0-9_-]+)/);
            if (!leftIdMatch) return;
            fromId = leftIdMatch[1];

            // Parse label from right part start: "|Label| B" or "B"
            let remainingRight = rightPart;

            // Check for label |Label|
            const labelMatch = rightPart.match(/^\|([^|]+)\|/);
            if (labelMatch) {
                label = labelMatch[1].trim();
                remainingRight = rightPart.substring(labelMatch[0].length).trim();
            }

            // Extract ID from right part
            const rightIdMatch = remainingRight.match(/^([a-zA-Z0-9_-]+)/);
            if (!rightIdMatch) return;
            toId = rightIdMatch[1];

            // Also check if right part defines a node: B{Text}
            // We can run the node parser on the right part ID section if needed, 
            // but let's assume separate definition lines or simple inline defs.
            // Actually, best to run node extraction on both parts.
            extractNodeFromSegment(leftPart, nodes);
            extractNodeFromSegment(remainingRight, nodes);

            if (!firstId) firstId = fromId;

            if (!nodes[fromId]) nodes[fromId] = createDefaultNode(fromId);
            if (!nodes[toId]) nodes[toId] = createDefaultNode(toId);

            // Add option
            if (!nodes[fromId].options.find(o => o.label === label && o.next === toId)) {
                nodes[fromId].options.push({ label, next: toId });
            }
        }
    });

    // Post-processing
    const keys = Object.keys(nodes);
    if (keys.length > 0) {
        flow.startNodeId = firstId || keys[0];

        keys.forEach(id => {
            const node = nodes[id];

            // 1. Label Inference: If option label is 'Next', try to use target node text
            node.options.forEach(option => {
                if (option.label === 'Next' && nodes[option.next]) {
                    // Use target node text, but maybe truncate if too long?
                    // For now, let's use it as is, it's usually short in this flow
                    option.label = nodes[option.next].text;
                }
            });

            // 2. Type Inference Logic
            if (id.startsWith('GO_')) {
                node.type = 'link';
                const map: Record<string, string> = {
                    'GO_CORE': 'coreSystem',
                    'GO_FIRMWARE': 'firmwareRuntime',
                    'GO_INPUT': 'inputTroubleshoot',
                    'GO_OUTPUT': 'outputTroubleshoot',
                    'GO_ELECTRICAL': 'electricalPower',
                    'GO_CONNECTIVITY': 'connectivity'
                };
                if (map[id]) node.meta = { ...node.meta, nextFlowId: map[id] };
            } else if (node.options.length === 0) {
                // No options = terminal (leaf node)
                node.type = 'terminal';
            } else {
                // Has options = interactive node
                // If it was marked as terminal (due to shape like ([Start])), force it to be interactive
                if (node.type === 'terminal') {
                    // Force start node to be action if it has 1 path, or question if >1
                    // Actually, if it has 1 path, treat as action (simple continue)
                    node.type = node.options.length > 1 ? 'question' : 'action';
                }

                // If it has multiple paths, it behaves like a question/decision
                if (node.options.length > 1 && node.type !== 'question' && node.type !== 'diagnosis') {
                    node.type = 'question';
                }
            }
        });
    }

    flow.nodes = nodes;
    return flow;
}

function extractNodeFromSegment(segment: string, nodes: Record<string, Node>) {
    const nodeIdPattern = '[a-zA-Z0-9_-]+';
    const nodeDefPattern = new RegExp(`^(${nodeIdPattern})\\s*(?:\\[\\((.*)\\)\\]|\\(\\[(.*)\\]\\)|\\{\\{(.*)\\}\\}|\\[{1,2}(.*)\\]{1,2}|\\{(.*)\\}|\\({1,2}(.*)\\){1,2}|>(.*)\\])`);

    const match = segment.match(nodeDefPattern);
    if (match) {
        const id = match[1];
        const text = [match[2], match[3], match[4], match[5], match[6], match[7], match[8]]
            .find(t => t !== undefined) || id;

        if (!nodes[id]) nodes[id] = createDefaultNode(id);
        nodes[id].text = text.trim();

        if (segment.includes('{')) {
            nodes[id].type = 'question';
        } else if (segment.includes('>') || segment.includes('((')) {
            nodes[id].type = 'diagnosis';
        } else if (segment.includes('([')) {
            nodes[id].type = 'terminal';
        } else if (segment.includes('[')) {
            nodes[id].type = 'action';
        }
    }
}

function createDefaultNode(id: string): Node {
    return {
        id,
        text: id,
        type: 'question', // Default, upgraded later
        options: []
    };
}
