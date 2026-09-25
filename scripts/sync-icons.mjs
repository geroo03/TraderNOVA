/**
 * Copia a public/icons los Material Symbols que usa el código (<MsIcon name="..." />)
 * y genera el tipo `MsIconName`. Uso: `npm run icons`.
 * Los SVG copiados se commitean, así que el proyecto no depende del paquete en runtime.
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "public/icons");
const PKG = join(ROOT, "node_modules/@material-symbols/svg-400/outlined");
const TYPES = join(SRC, "components/ui/ms-icon-names.ts");

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mts)$/.test(f) ? [p] : [];
  });
}

const names = new Set();
for (const file of walk(SRC)) {
  const text = readFileSync(file, "utf8");
  // Captura name="x" en <MsIcon> y también `icon: "x"` en configs.
  for (const m of text.matchAll(/<MsIcon[^>]*?\sname="([a-z0-9_-]+)"/g)) names.add(m[1]);
  for (const m of text.matchAll(/\bicon:\s*"([a-z0-9_-]+)"/g)) names.add(m[1]);
  for (const m of text.matchAll(/\b(?:icon|iconRight)="([a-z0-9_-]+)"/g)) names.add(m[1]);
  // name={cond ? "a" : "b"}: se toman todos los literales de la expresión.
  for (const m of text.matchAll(/<MsIcon[^>]*?\s(?:name)=\{([^}]*)\}/g)) {
    for (const lit of m[1].matchAll(/[?:]\s*"([a-z0-9_-]+)"/g)) names.add(lit[1]);
  }
}

const missing = [...names].filter((n) => !existsSync(join(PKG, `${n}.svg`)));
if (missing.length) {
  console.error(`Íconos inexistentes en Material Symbols: ${missing.join(", ")}`);
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const sorted = [...names].sort();
for (const n of sorted) copyFileSync(join(PKG, `${n}.svg`), join(OUT, `${n}.svg`));

writeFileSync(
  TYPES,
  `// Generado por scripts/sync-icons.mjs. No editar a mano.\nexport type MsIconName =\n${sorted.map((n) => `  | "${n}"`).join("\n")};\n`,
);
console.log(`${sorted.length} íconos sincronizados en public/icons`);
