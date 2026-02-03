import { parseMermaid } from '../utils/mermaidParser';
import { coreSystem } from './modules/coreSystem';
import { firmwareRuntime } from './modules/firmwareRuntime';
import { inputTroubleshoot } from './modules/inputTroubleshoot';
import { outputTroubleshoot } from './modules/outputTroubleshoot';
import { connectivity } from './modules/connectivity';
import { electricalPower } from './modules/electricalPower';
import { systemOverview } from './modules/systemOverview';
import type { Flow } from '../types/flow';

const modules = {
    systemOverview,
    coreSystem,
    firmwareRuntime,
    inputTroubleshoot,
    outputTroubleshoot,
    connectivity,
    electricalPower
};

export const initialFlows: Record<string, Flow> = {};

Object.entries(modules).forEach(([key, source]) => {
    const flow = parseMermaid(source, { flowId: key, title: key });
    initialFlows[key] = flow;
});
