#!/usr/bin/env node
// Génère les variantes responsives de chaque photo de static/img (nécessite ffmpeg) :
//   nom-400.jpg, nom-800.jpg  (paliers JPEG, compatibles partout)
//   nom-400.avif, nom-800.avif, nom.avif  (AVIF, ~35 % plus léger)
// Le build les détecte et les propose via <picture> / srcset.
// Idempotent : une variante déjà à jour n'est pas régénérée. Usage : `node optimize-images.mjs`
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMG = join(dirname(fileURLToPath(import.meta.url)), 'static/img');
const TIERS = [400, 800];
const VARIANT = /-(400|800)\.jpg$/;

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function width(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', file]).toString().trim());
}

function fresh(out, src) {
  return existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;
}

function encode(src, out, w) {
  const scale = w ? `scale=${w}:-2:flags=lanczos,` : '';
  const args = out.endsWith('.avif')
    ? ['-frames:v', '1', '-c:v', 'libsvtav1', '-crf', '34', '-preset', '6', '-vf', `${scale}format=yuv420p`]
    : ['-vf', `${scale}format=yuvj420p`, '-q:v', '5'];
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, ...args, '-map_metadata', '-1', out], { stdio: ['ignore', 'ignore', 'pipe'] });
}

let made = 0;
for (const src of walk(IMG).filter((f) => f.endsWith('.jpg') && !VARIANT.test(f))) {
  const w = width(src);
  const base = src.replace(/\.jpg$/, '');
  const jobs = [[`${base}.avif`, 0]];
  for (const t of TIERS) if (w > t * 1.15) jobs.push([`${base}-${t}.jpg`, t], [`${base}-${t}.avif`, t]);
  for (const [out, t] of jobs) {
    if (fresh(out, src)) continue;
    encode(src, out, t);
    made++;
  }
}
console.log(`✓ ${made} variante(s) générée(s)`);
