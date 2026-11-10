import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rename, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import * as Effect from "effect/Effect";
import { contributions } from "../src/plugin.mjs";

const git = (cwd, ...args) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" },
  }).trim();
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), "t3-history-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  git(dir, "init", "-b", "main");
  git(dir, "config", "user.name", "History Tester");
  git(dir, "config", "user.email", "test@example.invalid");
  await writeFile(join(dir, "first.txt"), "original\n");
  git(dir, "add", ".");
  git(dir, "commit", "-m", "feat: root");
  return dir;
}
const context = (dir) => ({
  capabilities: ["portable-view-navigation", "portable-graphs"],
  threads: { describe: () => Effect.succeed({ directory: dir }) },
  runProcess: (input) =>
    Effect.sync(() => {
      assert.equal(input.command, "git");
      assert.equal(input.environment.GIT_OPTIONAL_LOCKS, "0");
      const stdout = execFileSync(input.command, input.args, {
        cwd: input.cwd,
        encoding: "utf8",
        env: { ...process.env, ...input.environment },
        maxBuffer: 1024 * 1024,
      });
      return {
        code: 0,
        timedOut: false,
        stdout: stdout.slice(0, 8192),
        stderr: "",
        stdoutTruncated: stdout.length > 8192,
        stderrTruncated: false,
      };
    }),
});
const browse = async (c, input) => Effect.runPromise(contributions(c).commands[0].run(input));
const block = (result, id) => result.view.blocks.find((b) => b.id === id);

test("repository-wide refs, merge parents, root diffs and renamed unusual paths navigate read-only", async (t) => {
  const dir = await fixture(t);
  const ctx = context(dir);
  const root = git(dir, "rev-parse", "HEAD");
  git(dir, "tag", "v-test");
  git(dir, "checkout", "-b", "side");
  await writeFile(join(dir, "side.txt"), "side\n");
  git(dir, "add", ".");
  git(dir, "commit", "-m", "feat: side");
  const side = git(dir, "rev-parse", "HEAD");
  git(dir, "checkout", "main");
  await writeFile(join(dir, "main.txt"), "main\n");
  git(dir, "add", ".");
  git(dir, "commit", "-m", "feat: main");
  git(dir, "merge", "--no-ff", "side", "-m", "feat: merge");
  const merge = git(dir, "rev-parse", "HEAD");
  const unusual = process.platform === "win32" ? "renamed file.txt" : "odd\tfile\nname.txt";
  await rename(join(dir, "first.txt"), join(dir, unusual));
  git(dir, "add", "-A");
  git(dir, "commit", "-m", "feat: rename");
  const head = git(dir, "rev-parse", "HEAD");
  const status = git(dir, "status", "--porcelain=v1");
  const refs = git(dir, "show-ref");
  const history = await browse(ctx, { thread: "example" });
  assert.equal(block(history, "commits").nodes.length, 5);
  assert.ok(JSON.stringify(history).includes("tag: v-test"));
  assert.ok(block(history, "commits").nodes.some((r) => r.id === side));
  const selected = await browse(ctx, { directory: dir, commit: merge });
  assert.equal(block(selected, "compare").actions.length, 2);
  const compared = await browse(ctx, block(selected, "compare").actions[1].input);
  assert.ok(block(compared, "files").rows.some((r) => r.cells[1].includes("main.txt")));
  const renamed = await browse(ctx, { directory: dir, commit: head });
  const row = block(renamed, "files").rows[0];
  assert.ok(row.cells[0].startsWith("R"));
  assert.ok(row.cells[1].includes(JSON.stringify(unusual)));
  const patch = await browse(ctx, row.actions[0].input);
  assert.ok(block(patch, "patch").text.includes("rename from first.txt"));
  const initial = await browse(ctx, { directory: dir, commit: root });
  const rootPatch = await browse(ctx, block(initial, "files").rows[0].actions[0].input);
  assert.ok(block(rootPatch, "patch").text.includes("+original"));
  assert.equal(git(dir, "status", "--porcelain=v1"), status);
  assert.equal(git(dir, "show-ref"), refs);
});

test("bounded history paging, pinned ref selection and independent clients", async (t) => {
  const dir = await fixture(t);
  const ctx = context(dir);
  for (let i = 0; i < 18; i++) git(dir, "commit", "--allow-empty", "-m", `feat: item ${i}`);
  const first = await browse(ctx, { directory: dir });
  assert.equal(block(first, "commits").nodes.length, 15);
  const older = block(first, "pages").actions.find((a) => a.id === "next");
  assert.ok(older);
  const second = await browse(ctx, older.input);
  assert.equal(block(second, "commits").nodes.length, 4);
  assert.equal(
    block(await browse(ctx, { directory: dir }), "commits").nodes[0].id,
    block(first, "commits").nodes[0].id,
  );
  const pinned = await browse(ctx, { directory: dir, ref: "refs/heads/main" });
  assert.ok(block(pinned, "scope").text.includes("Pinned history root:"));
  for (const input of [
    { commit: "--help" },
    { offset: -1 },
    { ref: "--all" },
    { commit: git(dir, "rev-parse", "HEAD"), parent: "0".repeat(40) },
    { directory: "relative" },
  ]) {
    assert.ok(block(await browse(ctx, { directory: dir, ...input }), "error"));
  }
});

test("large patches are visibly truncated and binary diffs stay inspectable", async (t) => {
  const dir = await fixture(t);
  const ctx = context(dir);
  await writeFile(join(dir, "large.txt"), "long content\n".repeat(5000));
  await writeFile(join(dir, "binary.bin"), Buffer.from([0, 1, 2, 3]));
  git(dir, "add", ".");
  git(dir, "commit", "-m", "feat: large");
  const commit = git(dir, "rev-parse", "HEAD");
  const patch = await browse(ctx, { directory: dir, commit, path: "large.txt" });
  assert.ok(block(patch, "truncated"));
  assert.ok(block(patch, "patch").text.length <= 8000);
  const binary = await browse(ctx, { directory: dir, commit, path: "binary.bin" });
  assert.ok(block(binary, "patch").text.includes("Binary files"));
});

test("thread info view resolves its worktree and contributes no settings page", async (t) => {
  const dir = await fixture(t);
  const views = contributions(context(dir)).views;
  assert.deepEqual(
    views.map((v) => v.location),
    ["thread-panel"],
  );
  assert.equal(views[0].presentation, "dialog");
  const view = await Effect.runPromise(views[0].read({ threadId: "thread-on-this-environment" }));
  assert.ok(view.blocks.find((b) => b.kind === "graph").nodes.length);
});

test("thread projects below the repository root inspect root-relative changed paths", async (t) => {
  const dir = await fixture(t);
  const nested = join(dir, "nested-project");
  await mkdir(nested);
  const ctx = context(nested);
  const view = await Effect.runPromise(
    contributions(ctx).views[0].read({ threadId: "nested-thread" }),
  );
  const history = { view };
  const selected = await browse(ctx, block(history, "commits").nodes[0].action.input);
  const patch = await browse(ctx, block(selected, "files").rows[0].actions[0].input);
  assert.ok(block(patch, "patch").text.includes("+original"));
});
