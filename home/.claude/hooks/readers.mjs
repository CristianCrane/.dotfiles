// The reading commands: a shell command's parse into simple commands, and
// whether each only reads. reviewer-gate holds a reviewer to readers; the
// doc gate turns down a simple command that names a doc unless it reads.
// The walk (`walk`) gives each simple command's words, each redirect, each
// substitution and each heredoc; `notReader` judges one simple command's
// words; `notReading` is the two together, for a whole command.
import { BOUNDARY, has, HEREDOC, masked, positional, REDIRECT, substitutions, unquote, WORD } from "./lib.mjs";

// the words after a wrapper's own options, where `valued` options take the
// next word (unless their value is attached)
const after = (words, valued) => {
  let at = 0;
  while (at < words.length && words[at].startsWith("-")) at += valued.includes(words[at]) ? 2 : 1;
  return words.slice(at);
};

// a sed script that only prints: steps of an address or range (a number,
// $, /regex/, or a shell variable or substitution standing for a number),
// then p, d, q, = or s/// (any delimiter) with flags that write and run
// nothing (no w, no e), split by ; or a newline
const SED_ADDR = String.raw`(?:\d+|\$\{?\w+\}?|\$|_+|/(?:[^/\\\n]|\\.)*/I?)`;
const SED_STEP = String.raw`\s*(?:${SED_ADDR}(?:\s*,\s*(?:${SED_ADDR}|[+~]\d+))?)?\s*!?\s*(?:[pdq=]|s([^\\\n\w\s])(?:(?!\1)[^\\\n]|\\.)*\1(?:(?!\1)[^\\\n]|\\.)*\1[gpiI\d]*)\s*(?:[;\n]|$)`;
const printOnly = (script) => {
  const step = new RegExp(SED_STEP, "y");
  while (step.lastIndex < script.length && step.test(script));
  return step.lastIndex === script.length || !script.slice(step.lastIndex).trim();
};

// awk statements that write or run: system(), a piped getline, a print
// or printf with a redirect or pipe
const AWK_WRITES = /\bsystem\s*\(|\|\s*getline|\|&|\bprintf?\b[^;}]*[>|]/;

// git's subcommands that only read, each with the check its words need
const GIT = {
  ...Object.fromEntries(
    "diff log show status merge-base rev-parse rev-list ls-files ls-tree ls-remote blame cat-file shortlog describe name-rev for-each-ref show-ref diff-tree diff-index diff-files range-diff cherry whatchanged count-objects check-ignore check-attr var version help"
      .split(" ")
      .map((name) => [name, () => null]),
  ),
  grep: (words) => has(words, "-O", "--open-files-in-pager=") && "runs a pager on its files",
  "hash-object": (words) => has(words, "-w") && "writes an object",
  // listing forms only: a name without --list (or a filter) makes a branch
  branch: (words) =>
    has(words, "-d", "-D", "-m", "-M", "-c", "-C", "-f", "-u", "-t", "--delete", "--move", "--copy", "--force", "--set-upstream-to=", "--unset-upstream", "--edit-description", "--track=", "--no-track", "--create-reflog") ||
    (positional(words).length && !has(words, "-l", "-v", "--list", "--verbose", "--contains=", "--no-contains=", "--merged=", "--no-merged=", "--points-at="))
      ? "changes branches; list them with --list"
      : null,
  config: (words) =>
    has(words, "--get=", "--get-all=", "--get-regexp=", "--get-urlmatch=", "--list", "-l") || ["get", "list"].includes(words[0])
      ? has(words, "--add", "--unset=", "--unset-all=", "--replace-all", "--rename-section", "--remove-section", "--edit", "-e") && "changes the config"
      : positional(words).length === 1 && !has(words, "--unset=", "--unset-all=", "--edit", "-e")
        ? null // `git config <key>` reads it
        : "changes the config unless it's --get, --list or a key alone",
  remote: (words) => (!positional(words).length || ["show", "get-url"].includes(positional(words)[0]) ? null : "changes the remotes"),
  reflog: (words) => (["expire", "delete", "drop"].includes(words[0]) ? "changes the reflog" : null),
  stash: (words) => (["list", "show"].includes(words[0]) ? null : "changes the stash"),
  worktree: (words) => (words[0] === "list" ? null : "changes the worktrees"),
};

// git's options before its subcommand that only say where to read
const GIT_GLOBAL = /^(?:--no-pager|-P|--no-optional-locks|--literal-pathspecs|--no-replace-objects|--git-dir=.*|--work-tree=.*|--version)$/;

const git = (words) => {
  let at = 0;
  for (; at < words.length && words[at].startsWith("-"); at++) {
    if (words[at] === "-C") at++;
    else if (!GIT_GLOBAL.test(words[at])) return `git's \`${words[at]}\` can change what git runs`;
  }
  const [sub, ...rest] = words.slice(at);
  if (sub === undefined) return null;
  if (!GIT[sub]) return `\`git ${sub}\` isn't one of git's reading subcommands (${Object.keys(GIT).slice(0, 8).join(", ")} …)`;
  if (has(rest, "--output=")) return "git's --output writes a file";
  const why = GIT[sub](rest);
  return why ? `\`git ${sub}\` ${why}` : null;
};

// gh: views and lists, and api calls that only GET
const gh = (words) => {
  // its group is its first word after gh's own options
  const [group, ...rest] = after(words, ["-R", "--repo"]);
  if (group === undefined || group === "help") return null; // --version, help
  if (!/^(?:repo|pr|issue|run|release|workflow|label|search|api)$/.test(group)) return `\`gh ${group}\` isn't a view or list`;
  if (group === "search") return null;
  if (group === "api") {
    const method = rest.findIndex((word) => word === "-X" || word === "--method");
    const verb =
      method >= 0 ? rest[method + 1] : (rest.find((word) => word.startsWith("--method="))?.slice(9) ?? rest.find((word) => /^-X./.test(word))?.slice(2));
    return (verb && verb.toUpperCase() !== "GET") || has(rest, "-f", "-F", "--field=", "--raw-field=", "--input=") ? "`gh api` sends more than a GET" : null;
  }
  const action = positional(rest)[0];
  return ["view", "list", "diff", "checks", "status"].includes(action) ? null : `\`gh ${group} ${action ?? ""}\` isn't a view or list`;
};

// the readers, each with the check its words need (null when they read)
const plain = () => null;
const READERS = {
  ...Object.fromEntries(
    "cd ls pwd cat head tail wc cut tr paste column diff cmp comm stat file du realpath readlink dirname basename nl tac od hexdump strings md5sum sha256sum base64 seq jq journalctl echo printf read test continue break [ [[ true false type which uptime date nproc free ps pgrep ss findmnt sleep unset"
      .split(" ")
      .map((name) => [name, plain]),
  ),
  git,
  gh,
  // these change what later commands run, as a VAR= prefix does
  // zsh reads an option's name in any case, with any underscores
  set: (words) =>
    has(words, "-a") || words.some((word) => word.toLowerCase().replaceAll("_", "") === "allexport") ? "`set -a` exports what's assigned after it" : null,
  xxd: (words) => positional(words).length > 1 && "xxd's second file is its output",
  systemctl: (words) =>
    ["show", "status", "cat", "list-units", "list-unit-files", "is-active", "is-enabled"].includes(positional(words)[0]) ? null : "systemctl changes a unit",
  rg: (words) => has(words, "--pre=") && "rg's --pre runs a command on each file",
  // ugrep: these run a command or a pager, or write a config file
  grep: (words) => has(words, "--filter=", "--save-config=", "--pager=", "--view=", "-Q", "--query=") && "this grep option runs a command or writes a file",
  sed: (words) => {
    if (has(words, "-i", "--in-place=", "-f", "--file="))
      return "sed edits a file in place, or runs a script file (to change your review, Write it whole)";
    const scripts = words.flatMap((word, at) => (words[at - 1] === "-e" ? [word] : word.startsWith("--expression=") ? [word.slice(13)] : []));
    if (!scripts.length) scripts.push(positional(words)[0] ?? "");
    const bad = scripts.find((script) => !printOnly(script));
    return bad !== undefined && `sed's script \`${bad}\` isn't only addresses with p, d, q, = or s/// (no w or e)`;
  },
  // gawk: options that edit in place, load code or write a dump, sandbox or
  // not; then each program (-e's, or the first word) has no AWK_WRITES,
  // or --sandbox turns those down
  awk: (words) => {
    const own = words.filter((word) => !/^-[Fv]./.test(word)); // -F, -v with their values attached
    if (has(own, "-f", "-i", "-l", "-E", "-d", "-D", "-o", "-p", "--file=", "--include=", "--load=", "--exec=", "--dump-variables=", "--debug=", "--pretty-print=", "--profile="))
      return "this awk option edits in place, loads code or writes a file";
    if (has(words, "--sandbox")) return null;
    const sources = words.flatMap((word, at) =>
      ["-e", "--source"].includes(words[at - 1]) ? [word] : word.startsWith("--source=") ? [word.slice(9)] : /^-e./.test(word) ? [word.slice(2)] : [],
    );
    const programs = sources.length ? sources : [after(words, ["-F", "-v"])[0] ?? ""];
    return programs.some((program) => AWK_WRITES.test(program)) && "awk's program writes or runs a command: add --sandbox";
  },
  find: (words) =>
    has(words, "-exec", "-execdir", "-ok", "-okdir", "-delete", "-fprint", "-fprint0", "-fprintf", "-fls") && "find's action runs a command or writes",
  fd: (words) => has(words, "-x", "-X", "--exec=", "--exec-batch=") && "fd's --exec runs a command",
  sort: (words) => has(words, "-o", "--output=", "--compress-program=") && "sort writes a file or runs a program",
  uniq: (words) => positional(words).length > 1 && "uniq's second file is its output",
  // Node's permission model (no writes, child processes, workers, addons
  // or inspector), with only the options on NODE_OWN before its script, `-`
  // or `--` (a script's own --permission is no option). It has no network
  // limit: such a script can still reach a database or a server. Or
  // --version, or --check (a syntax check) on files
  node: (words) => {
    // its version, or a syntax check, which runs nothing
    if (["--version", "-v"].includes(words[0]) && words.length === 1) return null;
    if (["--check", "-c"].includes(words[0]) && positional(words.slice(1)).length === words.length - 1) return null;
    const own = [];
    for (let at = 0; at < words.length && words[at].startsWith("-") && !["-", "--"].includes(words[at]); at++) {
      const valued = NODE_OWN[words[at]];
      if (valued === undefined && !/^--(?:allow-fs-read|eval|print|input-type)=/.test(words[at]))
        return `node's \`${words[at]}\` isn't one this reads: use only --permission, --allow-fs-read, -e, -p and --input-type`;
      own.push(words[at]);
      if (valued) at++;
    }
    return own.includes("--permission")
      ? null
      : "node runs only as `node --permission` (reads allowed with `--allow-fs-read='*'`), which turns down its writes and child processes";
  },
};

// node's options a reading script needs, each saying whether it takes the
// next word as its value
const NODE_OWN = { "--permission": false, "--allow-fs-read": true, "-e": true, "--eval": true, "-p": true, "--print": true, "--input-type": true };

// commands that run the command in their words: each runs a reader or not
const WRAPPERS = {
  command: (words) => (/^-[vV]$/.test(words[0]) ? [] : words),
  time: (words) => words,
  nice: (words) => after(words, ["-n"]),
  timeout: (words) => after(words, ["-s", "-k", "--signal", "--kill-after"]).slice(1),
  xargs: (words) => after(words, ["-I", "-i", "-n", "-P", "-L", "-l", "-s", "-d", "-E", "-e", "-a"]),
};

// shell words that start or end a loop or branch around the commands
const KEYWORD = /^(?:do|then|else|elif|if|while|until|!|\{)$/;
const CLOSER = /^(?:done|fi|\}|esac)$/;

// a variable no command reads from its environment: a name with a
// lowercase letter, or of two letters at most (S, B, wt, mb), or IFS (no
// shell takes it from the environment). zsh ties these lowercase names
// to PATH and its kin, so they are no local names
const LOCAL = /^(?:\w*[a-z]\w*|[A-Z_]{1,2}\d*|IFS)$/;
const TIED = ["path", "cdpath", "fpath", "manpath", "module_path", "mailpath"];

// the names a simple command sets: its NAME= words, for's name, read's
// names (any word that could be one) and printf -v's
const assigned = (words) => {
  if (words.every((word) => /^\w+=/.test(word))) return words.map((word) => word.split("=")[0]);
  if (words[0] === "for") return [words[1]];
  if (words[0] === "read") return words.slice(1).filter((word) => /^\w+$/.test(word));
  if (words[0] === "printf") return words.flatMap((word, at) => (words[at - 1] === "-v" ? [word] : []));
  return [];
};

// why one simple command isn't a reader, or null when it is
export const notReader = (words) => {
  words = unwrapped(words);
  if (!words.length || (words.length === 1 && CLOSER.test(words[0]))) return null;
  // an exported name (PATH, GIT_*, NODE_OPTIONS …) changes what later commands run
  const exported = assigned(words).find((name) => !LOCAL.test(name) || TIED.includes(name));
  if (exported) return `setting \`${exported}\` may change what later commands run: name a variable in lowercase, or two letters at most`;
  if (words[0] === "for" || words[0] === "case") return null; // `for x in …`, `case x in`: no command
  if (/^\w+=/.test(words[0]))
    return words.every((word) => /^\w+=/.test(word)) ? null : `\`${words[0]}\` before a command changes what it runs`;
  const [name, ...args] = words;
  if (WRAPPERS[name]) return null; // a wrapper alone runs nothing
  const check = READERS[name];
  if (!check) return `\`${name}\` isn't a reading command`;
  return check(args) || null;
};

// The parts of a shell command, as the shell would run them:
// - substitutions: each command substitution's own command (`inner`;
//   `arithmetic` for $(( )), whose substitutions are its commands), at
//   `start`; each then stands in the text as a word of underscores
// - backtick: a backtick left after them, which this can't read
// - redirects: each with its operator (`op`), its target unquoted (none
//   for a fd's `>&2`), and where it starts (`at`)
// - heredocs: each one's body, and where its `<<` starts (`at`)
// - commands: each simple command (a subshell's too, a case's patterns
//   aside), split at lib's boundaries, its words unquoted, from `start`
//   to `end` in the text, the redirects and heredoc bodies blanked out of
//   it. `text` is the command with its substitutions blanked
export const walk = (command) => {
  const chars = command.replace(/\\\n/g, "  ").split("");
  const subs = [];
  for (const { start, end, inner } of substitutions(chars.join(""))) {
    subs.push({ inner, arithmetic: /^\(.*\)$/s.test(inner), start });
    chars.fill("_", start, end);
  }
  const text = chars.join("");
  const hidden = masked(text);

  const blank = hidden.split("");
  const redirects = [];
  for (const found of hidden.matchAll(new RegExp(REDIRECT, "dg"))) {
    const op = found[0].match(/^(?:\d*|&)([<>|]+)/)?.[1] ?? "";
    redirects.push({ op, target: found[1] === undefined ? undefined : unquote(text.slice(...found.indices[1])), at: found.index, raw: text.slice(found.index, found.index + found[0].length).trim() });
    blank.fill(" ", found.index, found.index + found[0].length);
  }
  const heredocs = [];
  for (const found of text.matchAll(HEREDOC)) {
    heredocs.push({ body: found[4], at: found.index });
    blank.fill(" ", found.index + found[1].length, found.index + found[0].length);
  }
  // a case's patterns (`case x in a|b)`, and each after `;;`) are no commands
  const words = blank
    .join("")
    .replace(/(\bcase\s+(?:"[^"]*"|'[^']*'|\S)+\s+in\b|;;(?!\s*esac\b))(\s*\(?[^;()\n]*\))/g, (_, lead, pattern) => lead + " ".repeat(pattern.length));

  // each simple command's words found in the blanked text and read from the original
  const commands = [];
  let start = 0;
  for (const end of [...words.matchAll(new RegExp(BOUNDARY, "g"))].map((found) => found.index).concat(words.length)) {
    commands.push({
      words: [...words.slice(start, end).matchAll(WORD)].map((word) => unquote(text.slice(start + word.index, start + word.index + word[0].length))),
      start,
      end,
    });
    start = end + 1;
  }
  return { text, subs, backtick: hidden.includes("`"), redirects, heredocs, commands };
};

// the command one simple command runs, past a loop's or branch's keywords,
// IFS= and the wrappers that run the command in their words (`command`,
// `time`, `nice`, `timeout`, `xargs`)
export const unwrapped = (words) => {
  while (KEYWORD.test(words[0])) words = words.slice(1);
  // IFS= only says how `read` splits
  while (/^IFS=/.test(words[0]) && words.length > 1) words = words.slice(1);
  const [name, ...args] = words;
  return WRAPPERS[name] && args.length ? unwrapped(WRAPPERS[name](args)) : words;
};

// whether a redirect writes its target: out to a file, not to /dev/null,
// stdout, stderr or another fd
export const writes = ({ op, target }) => />/.test(op) && target !== undefined && !["/dev/null", "/dev/stdout", "/dev/stderr"].includes(target);

// why the command isn't only readers, or null when it is: each
// substitution's command first, then the redirects, then each simple command
export const notReading = (command) => {
  const parts = walk(command);
  for (const { inner, arithmetic } of parts.subs) {
    const why = arithmetic ? substitutions(inner).map((one) => notReading(one.inner)).find(Boolean) : notReading(inner);
    if (why) return why;
  }
  if (parts.backtick) return "a backtick this can't read";
  const written = parts.redirects.find(writes);
  if (written) return `\`${written.raw}\` writes a file`;
  for (const { words } of parts.commands) {
    const why = notReader(words);
    if (why) return why;
  }
  return null;
};
