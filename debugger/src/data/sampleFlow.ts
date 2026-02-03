import type { Flow } from '../types/flow';
import { esp32Mermaid } from './esp32Source';
import { parseMermaid } from '../utils/mermaidParser';

// Use the parser to generate the initial sample flow structure from the source file
const parsedFlow = parseMermaid(esp32Mermaid);

export const sampleFlow: Flow = {
    ...parsedFlow,
    flowId: "esp32-debug-v1",
    title: "ESP32 Diagnostic v1",
    description: "Wizard for connection, upload, peripherals, power issues",
    metadata: {
        createdBy: "team",
        version: "0.1"
    }
};
