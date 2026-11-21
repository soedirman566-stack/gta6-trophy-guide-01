// Leonida Trophy Guide — the hand-in program for the gta6-trophy-guide-01 entry (Node 22, standard
// library only). The guide itself is the app/ folder beside this file: plain static files a browser
// opens at app/index.html, fully offline, its trophies and guides in app/data/trophies.json and its
// roadmap in app/data/roadmap.json. This program copies app/ and screenshots/ into the output
// directory and writes dossier.json there with the vendored make.fun library, byte for byte the way
// the scorer rebuilds it — so vendor/makefun-frontend.ts is left exactly as the kit shipped it.
//
// Run it the way the grader does, with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Try the guide itself with: node serve.ts  (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, passed to the dossier builder so an over-limit entry fails here first:
// at most 4 screenshots of at most 256 KiB each, at most 993 files and directories in app/ and
// 48 MiB of app files, and the dossier's text budget.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_CAPS));
