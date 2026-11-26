// In a repo with a docs map (docs.mjs), only the `doc-curator` agent writes
// its docs (.dotfiles#61 Q12): any other agent, and the main session,
// leaves a note instead, which the curator turns into the doc's change
// before the PR leaves draft. So the docs every agent reads stay short and
// each fact sits in one place.
//
// It turns down, for everyone but the doc-curator:
// - an edit tool's write of a doc (Write, Edit, MultiEdit, NotebookEdit)
// - a shell command (Bash, Monitor) with a simple command that names a doc
//   and doesn't only read (readers.mjs's pathsOf and notReader): `sed -i`,
//   `cp x docs/a.md` (cp by its target alone, so copying a doc out reads
//   it), `mv`, `tee`, `rm`, `git checkout -- docs/a.md`, a glob that
//   matches a doc, a folder whose tracked files are all docs
// - a redirect that writes a doc (`>`, `>>`, `>|`, `<>`), a heredoc's
//   included
// - an interpreter's own program that names a doc (node, python, perl,
//   ruby, a shell's -c or stdin, eval, awk, sed; their words and the
//   heredoc they read): only there, so a commit message, a PR body or an
//   issue comment that names a doc goes through.
// What it can't hold, which CI's trailer check catches (docs.mjs check,
// .github/workflows/doc-check.yml): a command that names no doc (`rg -l x
// | xargs sed -i …`, `git checkout main -- .`, a script file that writes
// docs, a path in a variable or built by an expansion, a formatter run on
// the repo), and any command it can't read, which goes through (lib's
// hook()).
//
// Cost: one node start per Bash, Monitor and edit call. With no docs map
// in the call's checkout and no path outside it in the command, it ends
// after one `git rev-parse`. Measured on its branch (2026-11-26, the median
// of 31 calls, load ~6 with the hooks suite running beside it): a hook that
// only reads its input took 56 ms; this one 80 ms with no map, 81 ms for
// `git status` in a checkout with one, 93 ms for a five-command chain, and
// 103 ms turning down a `sed -i` of a doc. So ~25 to 45 ms a call more than
// any hook's start.
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { homedir } from "node:os";
import { relative, resolve } from "node:path";
import { docAt, docsIn, globRe, mapAt, MAP, topAt } from "./docs.mjs";
import { cwdFor, deny, hook, stateFile, workOf } from "./lib.mjs";
import { notReader, pathsOf, writes } from "./readers.mjs";

const CURATOR = "doc-curator";

// commands that run the program in their words or the heredoc they read
const INTERPRETERS = /^(?:node|deno|bun|python\d*(?:\.\d+)?|perl|ruby|php|sh|bash|zsh|dash|ksh|fish|eval|awk|gawk|mawk|nawk|sed|gsed|ex|vi|vim|nvim|ed)$/;

// commands whose last word is the one they write (`cp a b`, `ln -s a b`),
// so a doc among the others is only read
const LAST_WRITES = /^(?:cp|install|ln|rsync|scp)$/;

// the doc a path names, as { top, rel }: a doc, a folder whose tracked
// files are all docs (its checkout's top aside), or a glob matching a doc;
// null for any other
const docNamed = ({ path, glob }) => {
  if (glob) {
    const top = topAt(statDir(path));
    if (!top || !mapAt(top)) return null;
    const test = globRe(relative(top, path));
    const rel = docsIn(top).find((one) => test.test(one));
    return rel ? { top, rel } : null;
  }
  const doc = docAt(path);
  if (doc) return doc;
  if (!isDir(path)) return null;
  const top = topAt(path);
  if (!top || top === path || !mapAt(top)) return null;
  const rel = relative(top, path);
  if (rel.startsWith("..")) return null;
  const docs = docsIn(top);
  return docs.some((file) => file.startsWith(`${rel}/`)) && !trackedOutside(top, rel, docs) ? { top, rel: `${rel}/` } : null;
};

const isDir = (path) => {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
};

// the nearest folder that exists
const statDir = (path) => {
  while (!isDir(path)) path = resolve(path, "..");
  return path;
};

// whether a folder holds a tracked file that's no doc
const trackedOutside = (top, rel, docs) => {
  const set = new Set(docs);
  return lsFiles(top, rel).some((file) => !set.has(file));
};

const lsFiles = (top, rel) => {
  try {
    return execFileSync("git", ["ls-files", "-z", "--", rel], { cwd: top, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\0").filter(Boolean);
  } catch {
    return [];
  }
};

// path-like tokens in an interpreter's program: a run of path characters
// holding a `/` or a `.`
const tokensOf = (program) => [...new Set(program.match(/[\w.~/@+-]*[/.][\w.~/@+-]*/g) ?? [])].filter((token) => /\w/.test(token)).slice(0, 200);

// the doc a shell command writes, as { top, rel, how }, or null
const docWritten = (command, cwd) => {
  for (const one of pathsOf(command, cwd)) {
    for (const redirect of one.redirects) {
      const doc = writes(redirect) && redirect.path && docNamed({ path: redirect.path, glob: false });
      if (doc) return { ...doc, how: `\`${redirect.raw}\` writes it` };
    }
    if (!notReader(one.words)) continue;
    const name = one.words.find((word) => !/^\w+=/.test(word)) ?? "";
    for (const path of LAST_WRITES.test(name) ? one.paths.slice(-1) : one.paths) {
      const doc = docNamed(path);
      if (doc) return { ...doc, how: `\`${name || one.words[0]}\` doesn't only read` };
    }
    if (INTERPRETERS.test(name))
      for (const token of tokensOf([...one.words.slice(1), ...one.heredocs].join("\n"))) {
        const doc = docNamed({ path: resolve(one.dir, token.replace(/^~(?=\/|$)/, homedir())), glob: false });
        if (doc) return { ...doc, how: `\`${name}\`'s program names it` };
      }
  }
  return null;
};

// a doc's turn-down: where the note goes instead
const turnDown = (rel, how, top, input) => {
  const work = workOf(top, input);
  const notes = work ? stateFile(top, "doc-notes", work.key) : `the branch's claude/doc-notes-<branch>.md in the git dir`;
  return deny(
    `${rel} is a doc (${how}): in this repo only the doc-curator agent writes docs, each fact in its one home (${MAP}). Leave a note instead, in ${notes}, as the \`change\` skill's Build says (the fact in one sentence, its evidence, its kind and its doc); the doc-curator writes it before the PR leaves draft.`,
  );
};

hook((input) => {
  if (input.agent_type === CURATOR) return;
  const { file_path, notebook_path, command } = input.tool_input ?? {};
  const path = file_path ?? notebook_path;
  if (path) {
    const doc = docAt(resolve(input.cwd ?? "/", path));
    return doc && turnDown(doc.rel, "an edit of it", doc.top, input);
  }
  if (typeof command !== "string") return;
  // the cheap way out: no map where it runs, and no path elsewhere
  const top = topAt(cwdFor(input));
  if (!(top && mapAt(top)) && !/(?:^|[\s=:'"(<>])(?:\/|~|\.\.)/.test(command)) return;
  const found = docWritten(command, input.cwd);
  return found && turnDown(found.rel, found.how, found.top, input);
});
