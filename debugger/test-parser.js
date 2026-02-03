// Quick test to verify the parser output
import { parseMermaid } from './src/utils/mermaidParser';
import { esp32Mermaid } from './src/data/esp32Source';

const flow = parseMermaid(esp32Mermaid);

console.log('=== FLOW ANALYSIS ===');
console.log('Flow ID:', flow.flowId);
console.log('Start Node ID:', flow.startNodeId);
console.log('Total Nodes:', Object.keys(flow.nodes).length);
console.log('\n=== START NODE ===');
console.log('Exists:', !!flow.nodes[flow.startNodeId]);
if (flow.nodes[flow.startNodeId]) {
    console.log('Type:', flow.nodes[flow.startNodeId].type);
    console.log('Text:', flow.nodes[flow.startNodeId].text);
    console.log('Options:', flow.nodes[flow.startNodeId].options.length);
    console.log('First Option:', flow.nodes[flow.startNodeId].options[0]);
}

console.log('\n=== FIRST 10 NODES ===');
Object.keys(flow.nodes).slice(0, 10).forEach(id => {
    const node = flow.nodes[id];
    console.log(`${id}: ${node.type} - "${node.text}" (${node.options.length} options)`);
});
