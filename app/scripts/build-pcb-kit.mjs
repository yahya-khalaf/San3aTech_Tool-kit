// Builds the PCB fabrication kit (a separate Vite app in tools-src/) and puts
// the static output in public/, where the main toolkit build picks it up and
// Cloudflare serves it at /employability/pcb-design-and-manufacturing/.
//
// Run from app/:  npm run build:pcb
// Commit the regenerated files under public/employability/pcb-design-and-manufacturing/.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const kitDir = resolve(appDir, 'tools-src/PCB Design and Manufacturing/san3a-pcb-fabrication-kit');
const outDir = resolve(appDir, 'public/employability/pcb-design-and-manufacturing');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args, env = {}) {
  const result = spawnSync(npm, args, {
    cwd: kitDir,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(resolve(kitDir, 'node_modules'))) {
  console.log('Installing PCB kit dependencies…');
  run(['ci']);
}

run(['run', 'build', '--', '--outDir', outDir, '--emptyOutDir'], {
  // Must be the absolute URL folder the kit is served from (the kit's README:
  // "Set BASE_PATH=/your-path/ when building for a sub-path"). A relative
  // base ('./') breaks the Gerber page's "Open in Mods", which resolves the
  // Mods path against the site root.
  BASE_PATH: '/employability/pcb-design-and-manufacturing/',
});

console.log(`\nPCB kit built into ${outDir}`);
