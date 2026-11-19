// Edited in github.com/CristianCrane/.dotfiles (home/.claude); user-level only, never copied into repos.
//
// Puts a settings.json in the exact bytes Claude Code writes, so a commit of
// home/.claude/settings.json can't hold a form Claude Code rewrites on its
// next save (an agent's hand edit did: the rewrite blocked a fast-forward
// pull on 2026-11-18). Claude Code is the only source of its key order and
// layout: the file goes through a `claude plugin disable`/`enable` round
// trip of one enabledPlugins entry, back to that entry's own value, in a
// throwaway config dir. Run by .githooks/pre-commit, or by hand:
//
//   node ~/.claude/hooks/settings-format.mjs <file>   (formats it in place)
//
// It refuses, writing nothing, on invalid JSON, on no enabledPlugins entry
// to flip, and when Claude Code's output holds other values than the input
// (a migration it runs on load, such as "opus" to "opus[1m]" before
// migrationVersion 14).
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { flagsOf } from "./lib.mjs";

// Claude Code's own state file in the throwaway config dir: the migrations it
// is told have already run, so it runs none on the file. Tests pass {} to
// see the values check catch one.
const MIGRATED = { migrationVersion: 14 };

export const formatSettings = (text, { claudeJson = MIGRATED } = {}) => {
  let settings;
  try {
    settings = JSON.parse(text);
  } catch (error) {
    throw new Error(`not valid JSON (${error.message})`);
  }
  const [plugin, enabled] =
    Object.entries(settings?.enabledPlugins ?? {}).find(([, value]) => typeof value === "boolean") ?? [];
  if (!plugin) throw new Error("no enabledPlugins entry to flip, so Claude Code can't be made to write the file");

  // an empty HOME and work dir and a scrubbed env, so no other settings,
  // project or credentials reach Claude Code
  const dir = mkdtempSync(join(tmpdir(), "settings-format-"));
  try {
    const [config, home, work] = ["config", "home", "work"].map((name) => join(dir, name));
    for (const each of [config, home, work]) mkdirSync(each);
    const file = join(config, "settings.json");
    writeFileSync(file, text);
    writeFileSync(join(config, ".claude.json"), JSON.stringify(claudeJson));
    for (const action of enabled ? ["disable", "enable"] : ["enable", "disable"]) {
      const ran = spawnSync("claude", ["plugin", action, plugin, "--scope", "user"], {
        cwd: work,
        encoding: "utf8",
        timeout: 30_000,
        env: { PATH: process.env.PATH, HOME: home, CLAUDE_CONFIG_DIR: config },
      });
      if (ran.status !== 0)
        throw new Error(
          `\`claude plugin ${action} ${plugin}\` failed: ${(ran.stderr || ran.stdout || "").trim() || ran.error?.message}`,
        );
    }
    const formatted = readFileSync(file, "utf8");
    if (!isDeepStrictEqual(JSON.parse(formatted), settings))
      throw new Error("Claude Code changed values, not only the form (a migration?); left as it was");
    return formatted;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

if (import.meta.main) {
  const { positionals } = flagsOf("settings-format", "<file>", { allowPositionals: true });
  if (positionals.length !== 1) {
    console.error("settings-format: takes one file\nUsage: node ~/.claude/hooks/settings-format.mjs <file>");
    process.exit(1);
  }
  const [file] = positionals;
  try {
    const text = readFileSync(file, "utf8");
    const formatted = formatSettings(text);
    if (formatted !== text) writeFileSync(file, formatted);
  } catch (error) {
    console.error(`settings-format: ${file}: ${error.message}`);
    process.exit(1);
  }
}
