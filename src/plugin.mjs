import * as Effect from "effect/Effect";

const hash = (value) => typeof value === "string" && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value);
const integer = (value, max) =>
  Number.isSafeInteger(value ?? 0) && (value ?? 0) >= 0 && (value ?? 0) <= max;
const short = (value) => value.slice(0, 10);
const text = (id, value) => ({ id, kind: "text", text: value.slice(0, 8192) });
const action = (id, label, input) => ({ id, label, command: "browse", input });
const actions = (id, values) => ({ id, kind: "actions", actions: values });
const page = (title, blocks) => ({ $t3: "view", view: { title, blocks } });


export function contributions(context) {
  if (!context.capabilities?.includes("portable-graphs") || !context.runProcess)
    throw new Error(
      "Requires a prototype host with portable-graphs and supervised-processes.",
    );
  async function git(directory, args, allowTruncated = false) {
    const result = await Effect.runPromise(
      context.runProcess({
        command: "git",
        args: ["--no-pager", "--literal-pathspecs", "-c", "color.ui=false", ...args],
        cwd: directory,
        environment: { GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0" },
        timeoutMs: 10000,
      }),
    );
    if (result.timedOut || result.code !== 0)
      throw new Error("Git could not read this repository or object (10 second query limit).");
    if (result.stdoutTruncated && !allowTruncated)
      throw new Error(
        "Git output exceeds the host limit. Narrow the ref or inspect a smaller commit.",
      );
    return result;
  }
  async function browse(input) {
    let directory = input.directory;
    if (input.thread) {
      if (typeof input.thread !== "string" || !context.threads)
        throw new Error("Thread context unavailable.");
      directory = (await Effect.runPromise(context.threads.describe(input.thread))).directory;
    }
    if (
      typeof directory !== "string" ||
      !/^(?:\/|[A-Za-z]:[\\/])/.test(directory) ||
      directory.includes("\0") ||
      directory.length > 4096
    )
      throw new Error("Enter an absolute directory on the selected environment, or its thread ID.");
    const common = { directory };
    const back = action("history", "Back to history", common);
    if (input.commit !== undefined) {
      if (!hash(input.commit)) throw new Error("Invalid commit ID.");
      const commit = input.commit;
      const meta = (
        await git(directory, ["show", "-s", "--format=%H%x00%P%x00%an%x00%aI%x00%B", commit, "--"])
      ).stdout.split("\0");
      const parents = meta[1].split(" ").filter(Boolean);
      const parent = input.parent ?? parents[0];
      if (parent !== undefined && (!hash(parent) || !parents.includes(parent)))
        throw new Error("Select a parent of this commit.");
      const base = { ...common, commit, ...(parent ? { parent } : {}) };
      const nav = [
        back,
        ...parents
          .slice(0, 8)
          .map((p, i) =>
            action(`parent-${i}`, `Open parent ${short(p)}`, { ...common, commit: p }),
          ),
      ];
      const blocks = [
        actions("navigation", nav),
        text(
          "metadata",
          `${commit}\n${meta[2]} · ${meta[3]}\n${meta.slice(4).join("\0")}\nParents: ${parents.join(", ") || "(root commit)"}`,
        ),
      ];
      if (parents.length > 1)
        blocks.push(
          actions(
            "compare",
            parents
              .slice(0, 20)
              .map((p, i) =>
                action(`compare-${i}`, `Compare parent ${i + 1}: ${short(p)}`, {
                  ...base,
                  parent: p,
                }),
              ),
          ),
        );
      if (input.path !== undefined) {
        if (
          typeof input.path !== "string" ||
          input.path.includes("\0") ||
          input.path.length > 12000
        )
          throw new Error("Invalid file path.");
        const paths = [input.path];
        if (input.oldPath !== undefined) {
          if (
            typeof input.oldPath !== "string" ||
            input.oldPath.includes("\0") ||
            input.oldPath.length > 12000
          )
            throw new Error("Invalid old path.");
          paths.push(input.oldPath);
        }
        const diff = await git(
          directory,
          parent
            ? [
                "diff",
                "--no-ext-diff",
                "--no-textconv",
                "--find-renames",
                parent,
                commit,
                "--",
                ...paths,
              ]
            : [
                "show",
                "--format=",
                "--no-ext-diff",
                "--no-textconv",
                "--find-renames",
                commit,
                "--",
                ...paths,
              ],
          true,
        );
        blocks.push(
          actions("files", [action("files", "Back to changed files", base)]),
          text("file", JSON.stringify(input.path)),
          {
            id: "patch",
            kind: "code",
            text:
              diff.stdout.slice(0, 8000) ||
              "(No textual patch; the file may be binary or unchanged against this parent.)",
          },
        );
        if (diff.stdoutTruncated || diff.stdout.length > 8000)
          blocks.push(
            text(
              "truncated",
              "Patch truncated to 8,000 characters. Use local Git for the full patch.",
            ),
          );
        return page(`Commit ${short(commit)} · diff`, blocks);
      }
      const raw = (
        await git(
          directory,
          parent
            ? ["diff", "--name-status", "-z", "--find-renames", parent, commit, "--"]
            : [
                "diff-tree",
                "--root",
                "--no-commit-id",
                "-r",
                "--name-status",
                "-z",
                "--find-renames",
                commit,
                "--",
              ],
        )
      ).stdout;
      const parts = raw.split("\0");
      const files = [];
      for (let i = 0; i < parts.length && parts[i];) {
        const status = parts[i++];
        const first = parts[i++];
        const renamed = /^[RC]/.test(status);
        const path = renamed ? parts[i++] : first;
        if (path === undefined) throw new Error("Incomplete changed-file output.");
        files.push({ status, path, ...(renamed ? { oldPath: first } : {}) });
      }
      if (!integer(input.files, 10000)) throw new Error("Invalid file page.");
      const offset = input.files ?? 0;
      blocks.push(
        text(
          "comparison",
          `Compared against ${parent ?? "the empty tree (root commit)"}. ${files.length} changed files. Paths are JSON-quoted to preserve tabs and newlines.`,
        ),
        {
          id: "files",
          kind: "table",
          columns: ["Status", "Path"],
          rows: files
            .slice(offset, offset + 20)
            .map((f, i) => ({
              id: `file-${i}`,
              cells: [
                f.status,
                f.oldPath
                  ? `${JSON.stringify(f.oldPath)} → ${JSON.stringify(f.path)}`
                  : JSON.stringify(f.path),
              ],
              actions: [action("diff", "Inspect diff", { ...base, ...f })],
            })),
        },
      );
      blocks.push(
        actions("file-pages", [
          ...(offset > 0
            ? [action("previous", "Previous files", { ...base, files: Math.max(0, offset - 20) })]
            : []),
          ...(files.length > offset + 20 && offset < 10000
            ? [action("next", "Next files", { ...base, files: offset + 20 })]
            : []),
        ]),
      );
      return page(`Commit ${short(commit)}`, blocks);
    }
    if (!integer(input.offset, 10000)) throw new Error("Invalid history page.");
    const offset = input.offset ?? 0;
    let ref = input.ref;
    if (ref !== undefined && ref !== "" && !hash(ref)) {
      if (
        typeof ref !== "string" ||
        !/^(?:HEAD|refs\/(?:heads|tags|remotes)\/.+)$/.test(ref) ||
        ref.includes("\0") ||
        ref.length > 1024
      )
        throw new Error(
          "Use HEAD, a full refs/heads, refs/remotes, refs/tags name, or a commit ID.",
        );
      ref = (
        await git(directory, ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`])
      ).stdout.trim();
      if (!hash(ref)) throw new Error("Ref does not resolve to a commit.");
    }
    const scope = ref ? [ref] : ["HEAD", "--branches", "--remotes", "--tags"];
    const raw = (
      await git(directory, [
        "log",
        "--topo-order",
        "--max-count=16",
        `--skip=${offset}`,
        "--format=%H%x00%P%x00%an%x00%aI%x00%s%x00%D%x00",
        ...scope,
        "--",
      ])
    ).stdout;
    const fields = raw.split("\0");
    const commits = [];
    for (let i = 0; i + 5 < fields.length; i += 6) {
      const sha = fields[i].trim();
      if (!hash(sha)) throw new Error("Invalid history output.");
      commits.push({
        sha,
        parents: fields[i + 1],
        author: fields[i + 2],
        date: fields[i + 3],
        subject: fields[i + 4],
        refs: fields[i + 5],
      });
    }
    const state = { ...common, ...(ref ? { ref } : {}) };
    return page("Git history", [
      text(
        "scope",
        `${directory}\n${ref ? `Pinned history root: ${ref}` : "HEAD + local branches + remote-tracking branches + tags"}\nTopological history · lines join each commit to its parents · lines at the bottom continue beyond this page. All-ref pages are live; selected refs are pinned.`,
      ),
      {
        id: "filter",
        kind: "form",
        label: "Browse ref",
        command: "browse",
        input: common,
        fields: [
          {
            name: "ref",
            label: "HEAD, full ref name, or commit ID (empty = all branches/tags)",
            kind: "text",
            value: ref ?? "",
          },
        ],
      },
      {
        id: "commits", kind: "graph", label: "Repository history",
        nodes: commits.slice(0, 15).map((c) => ({
          id: c.sha,
          parents: c.parents.split(" ").filter(Boolean).slice(0,20),
          label: c.subject.slice(0,200),
          detail: `${c.author} · ${c.date}`.slice(0,200),
          annotation: short(c.sha),
          badges: c.refs ? [c.refs.slice(0,160)] : [],
          action: action("inspect", "Inspect commit", { ...common, commit: c.sha }),
        })),
      },
      text(
        "count",
        `${commits.length ? offset + 1 : 0}–${offset + Math.min(commits.length, 15)} · 15 commits per page · first 10,015 commits accessible. Empty repositories have no HEAD; commit once to browse.`,
      ),
      actions("pages", [
        action("first", "Newest", state),
        ...(offset > 0
          ? [action("previous", "Previous", { ...state, offset: Math.max(0, offset - 15) })]
          : []),
        ...(commits.length > 15 && offset + 15 <= 10000
          ? [action("next", "Older", { ...state, offset: offset + 15 })]
          : []),
      ]),
    ]);
  }
  return {
    commands: [
      {
        id: "browse",
        title: "Browse repository history",
        description:
          "Read bounded repository history, commit parents, changed files and patches. Accepts an absolute environment directory or thread ID.",
        permission: "filesystem:read",
        agent: true,
        run: (input) =>
          Effect.tryPromise(() => browse(input)).pipe(
            Effect.catch(() =>
              Effect.succeed(
                page("Git history", [
                  text(
                    "error",
                    "Unable to read history. Check the absolute environment directory/thread ID, ref and object availability. Queries have a 10 second timeout and 8 KiB output limit; narrow the ref for large commits or messages.",
                  ),
                  actions("retry", [action("retry", "Try again", input)]),
                ]),
              ),
            ),
          ),
      },
    ],
    views: [
      {
        id: "history",
        title: "History",
        location: "thread-panel",
        presentation: "dialog",
        permission: "filesystem:read",
        read: (input) => Effect.tryPromise(() => browse({ thread: input?.threadId })).pipe(
          Effect.map((result) => result.view),
          Effect.catch(() => Effect.succeed({ title: "Git history", blocks: [text("error", "History is unavailable for this thread. Its worktree must contain a Git repository with a commit.")] })),
        ),
      },
    ],
  };
}
export default {
  apiVersion: 1,
  id: "git-history",
  name: "Git history",
  version: "0.2.0",
  description: "Read-only repository-wide history and commit relationships.",
  activate: (context) => Effect.sync(() => contributions(context)),
};
