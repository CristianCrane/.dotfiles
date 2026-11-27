// A repo's docs, which only the doc curator writes (.dotfiles#61): agents
// leave notes, and the `doc-curator` agent turns them into doc changes, so
// each fact sits in one place and the docs every agent reads stay short.
// A repo opts in by having a docs map, `docs/map.md`: each entry a list
// item led by a backticked path or glob (`docs/adr/*.md`), with its kind
// after it in parentheses once the file holds one kind only (`(rule)`),
// which switches its lint on. The map is a doc too. A repo with no map
// keeps its docs as before (the dotfiles' own stay the process curator's).
//
// doc-gate.mjs turns down any other agent's write of a doc; this file's
// CLI is CI's check (.github/workflows/doc-check.yml, which other repos
// call) and the curator's lint:
//
//   node docs.mjs check [--base <ref>]   commits since base that touch a doc
//                                        without the curator's trailer, and the
//                                        lint of the docs they change
//   node docs.mjs lint                   the budgets, in words, of every doc
//
// The trailer is a plain commit-message line, `Doc-curator: per-PR` or
// `Doc-curator: sweep` (`git commit --trailer`), so CI holds the user's
// own edits too (#61 Q12).
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
// lib imports this module too; neither uses the other while it loads
import { git, topOf } from "./lib.mjs";

export const MAP = "docs/map.md";
export const KINDS = ["rule", "decision", "screen", "term", "how-to"];
export const TRAILER = "Doc-curator";
const MODES = ["per-PR", "sweep"];

// a glob as a regex on a path from the checkout's top: `*` within a
// folder, `**/` any folders, `?` one character
export const globRe = (glob) =>
  new RegExp(
    `^${glob
      .split(/(\*\*\/|\*\*|\*|\?)/)
      .map((part) => ({ "**/": "(?:.*/)?", "**": ".*", "*": "[^/]*", "?": "[^/]" })[part] ?? part.replace(/[.+^${}()|[\]\\]/g, "\\$&"))
      .join("")}$`,
  );

// a map's entries, from its text: { pattern, kind, test }
export const entriesOf = (text) =>
  [...text.matchAll(new RegExp(String.raw`^\s*[-*] \`([^\`]+)\`(?:\s*\((${KINDS.join("|")})\))?`, "gm"))].map(([, pattern, kind]) => ({
    pattern,
    kind: kind ?? null,
    test: globRe(pattern),
  }));

// the map entry a path (from the checkout's top) falls under; the map
// itself is a doc, of no kind
export const entryOf = (entries, rel) => (rel === MAP ? { pattern: MAP, kind: null, test: globRe(MAP) } : entries.find((entry) => entry.test.test(rel)));

// the docs map of a checkout's top, read once a process: null with none
const maps = new Map();
export const mapAt = (top) => {
  if (!maps.has(top)) maps.set(top, existsSync(join(top, MAP)) ? entriesOf(readFileSync(join(top, MAP), "utf8")) : null);
  return maps.get(top);
};

// the checkout's top for a folder (lib's topOf), read once a process;
// null outside one
const tops = new Map();
export const topAt = (dir) => {
  if (!tops.has(dir)) {
    let top = null;
    try {
      top = topOf(dir);
    } catch {}
    tops.set(dir, top);
  }
  return tops.get(dir);
};

// the doc a path is, as { top, rel, entry }, or null: a file the docs map
// of its own checkout lists (a new file under a glob too)
export const docAt = (path) => {
  let dir = path;
  while (!existsSync(dir)) dir = dirname(dir);
  if (dir === path && !statSync(dir).isDirectory()) dir = dirname(dir);
  const real = realpathSync(dir);
  const top = topAt(real);
  if (!top) return null;
  const entries = mapAt(top);
  if (!entries) return null;
  const rel = relative(top, join(real, relative(dir, path)));
  const entry = !rel.startsWith("..") && entryOf(entries, rel);
  return entry ? { top, rel, entry } : null;
};

// the tracked docs of a checkout with a map, each from its top
export const docsIn = (top) => {
  const entries = mapAt(top);
  if (!entries) return [];
  return git(top, "ls-files", "-z").split("\0").filter((rel) => rel && entryOf(entries, rel));
};

// whether every file the branch changes is a doc, and the pending path too
export const onlyDocs = (top, files, pending) =>
  Boolean(mapAt(top)) && [...files, ...(pending ? [relative(top, resolve(pending))] : [])].every((rel) => entryOf(mapAt(top), rel));

// a map's entries at a commit (none when it has no map there)
const mapAtRef = (top, ref) => {
  try {
    return entriesOf(git(top, "show", `${ref}:${MAP}`));
  } catch {
    return [];
  }
};

// the commits from base to HEAD that touch a doc without the curator's
// trailer, as { sha, subject, docs }. The docs are the map's at either end,
// so a branch that deletes the map is still read. A merge counts only for
// its own edits (`diff-tree --cc`: a conflict's resolution), so merging
// the default branch in brings none of its commits' docs
export const untrailered = (top, base) => {
  const entries = [...mapAtRef(top, base), ...mapAtRef(top, "HEAD")];
  if (!entries.length) return null;
  const isDoc = (rel) => entryOf(entries, rel);
  const found = [];
  for (const line of git(top, "rev-list", "--parents", `${base}..HEAD`).split("\n").filter(Boolean)) {
    const [sha, ...parents] = line.split(" ");
    const files = git(top, "diff-tree", "--no-commit-id", "--name-only", "-r", ...(parents.length > 1 ? ["--cc"] : []), "--root", sha).split("\n").filter(Boolean);
    const docs = files.filter(isDoc);
    if (!docs.length) continue;
    const mode = git(top, "log", "-1", `--format=%(trailers:key=${TRAILER},valueonly,separator=%x2C)`, sha);
    if (MODES.includes(mode)) continue;
    found.push({ sha, subject: git(top, "log", "-1", "--format=%s", sha), docs });
  }
  return found;
};

// --- the lint (#61 Q5, Q6): budgets in words, switched on by a kind ---

// a budget per entry of each kind, and the entries of a file of that kind
const PER = { rule: 100, screen: 50, term: 100, decision: 600 };
const FILE_BUDGET = 5000;

// a file's lines, with their numbers, outside fenced code
const linesOf = (text) => {
  let fenced = false;
  return text.split("\n").flatMap((line, at) => {
    if (/^(```|~~~)/.test(line)) fenced = !fenced;
    return fenced || /^(```|~~~)/.test(line) ? [] : [{ line, at: at + 1 }];
  });
};

// words outside fenced code, a table's pipes and a heading's hashes aside
const wordsOf = (text) =>
  linesOf(text)
    .map(({ line }) => line)
    .join("\n")
    .match(/[^\s|#*_>-][^\s|]*/g)?.length ?? 0;

// the entries a file of `kind` holds: { at, text }
const unitsOf = (kind, text) => {
  const lines = linesOf(text);
  const units = [];
  let unit = null;
  const close = () => unit && units.push(unit) && (unit = null);
  for (const { line, at } of lines) {
    if (kind === "decision") continue;
    if (kind === "screen") {
      if (/^## /.test(line)) {
        close();
        unit = { at, text: "" };
      } else if (/^# /.test(line)) close();
      else if (unit) unit.text += `${line}\n`;
      continue;
    }
    // rule: a list item (to the next one, a blank line or a heading) or a
    // paragraph; term: a paragraph
    const item = kind === "rule" && /^\s{0,3}(?:[-*+]|\d+\.)\s/.test(line);
    if (!line.trim() || /^#/.test(line) || item) close();
    if (line.trim() && !/^#/.test(line)) {
      unit ??= { at, text: "" };
      unit.text += `${line}\n`;
    }
  }
  close();
  if (kind === "decision") units.push({ at: 1, text });
  return units;
};

// "the X screen" or "the X page", X a capitalised name, against the screen
// map's `##` headings
const SCREEN_NAME = /\bthe ((?:[A-Z][\w'’-]*\s){1,4})(?:screen|page)\b/g;

// what the lint finds in a checkout's docs, or in `only` of them (paths
// from the top), the screen map read whole either way: [{ file, at, why }]
export const lint = (top, only) => {
  const entries = mapAt(top);
  if (!entries) return null;
  const files = docsIn(top).map((rel) => ({ rel, kind: entryOf(entries, rel).kind, text: readFileSync(join(top, rel), "utf8") }));
  const screens = new Set(
    files.filter((file) => file.kind === "screen").flatMap((file) => [...file.text.matchAll(/^## (.+)$/gm)].map(([, name]) => name.trim())),
  );
  const found = [];
  for (const { rel, kind, text } of files) {
    if (!kind || (only && !only.includes(rel))) continue;
    const words = wordsOf(text);
    if (words > FILE_BUDGET) found.push({ file: rel, at: 1, why: `${words} words, past the file's ${FILE_BUDGET}` });
    if (PER[kind])
      for (const unit of unitsOf(kind, text)) {
        const count = wordsOf(unit.text);
        if (count > PER[kind]) found.push({ file: rel, at: unit.at, why: `a ${kind} of ${count} words, past its ${PER[kind]}` });
      }
    if (screens.size)
      for (const { line, at } of linesOf(text))
        for (const [, name] of line.matchAll(SCREEN_NAME))
          if (!screens.has(name.trim())) found.push({ file: rel, at, why: `"${name.trim()}" is no screen the screen map names` });
  }
  return found;
};

// --- the CLI ---

const main = (args) => {
  const top = topAt(process.cwd());
  if (!top) return console.error("docs: not in a git checkout") || 1;
  if (!mapAt(top) && !(args[0] === "check" && args.includes("--base"))) {
    console.log(`docs: ${top} has no docs map (${MAP}), so it hasn't opted in: nothing to check.`);
    return 0;
  }
  const report = (found) => {
    for (const one of found) console.log(`${one.file}:${one.at}: ${one.why}`);
    return found.length;
  };
  if (args[0] === "lint") {
    const found = lint(top);
    return report(found) ? (console.log(`docs: ${found.length} past a budget (the doc curator fixes them).`), 1) : (console.log("docs: lint clean."), 0);
  }
  if (args[0] === "check") {
    const at = args.indexOf("--base");
    let base = at >= 0 ? args[at + 1] : undefined;
    // a push that made the branch has no before (all zeros): HEAD alone
    if (!base || /^0+$/.test(base)) base = "HEAD^";
    try {
      git(top, "rev-parse", "--verify", `${base}^{commit}`);
    } catch {
      console.error(`docs: the base ${base} isn't a commit here (fetch the history: actions/checkout's fetch-depth: 0).`);
      return 1;
    }
    const missing = untrailered(top, base);
    if (missing === null) {
      console.log(`docs: no docs map at ${base} or HEAD, so this repo hasn't opted in: nothing to check.`);
      return 0;
    }
    for (const one of missing)
      console.log(`${one.sha.slice(0, 8)} ${one.subject}\n  changes ${one.docs.join(", ")} with no \`${TRAILER}:\` trailer`);
    if (missing.length)
      console.log(`docs: ${missing.length} commit(s) change a doc without the doc curator. Only the doc-curator agent writes docs: leave a note (the change skill's Build) and run it, which commits with \`--trailer "${TRAILER}: per-PR"\`.`);
    // the docs this branch changed: a finding elsewhere waits for the sweep,
    // which lints them all
    const found = mapAt(top) ? lint(top, git(top, "diff", "--name-only", `${base}...HEAD`).split("\n").filter(Boolean)) : [];
    report(found);
    if (found.length) console.log(`docs: ${found.length} past a budget.`);
    if (!missing.length && !found.length) console.log("docs: every doc change is the curator's, and the lint is clean.");
    return missing.length || found.length ? 1 : 0;
  }
  console.error("Usage: node docs.mjs check [--base <ref>] | lint");
  return 1;
};

if (import.meta.main) process.exit(main(process.argv.slice(2)));
