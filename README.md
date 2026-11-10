# T3 Git History

Read-only repository history for the **prototype T3 plugin host fork**. This is
an independent plugin, not an upstream T3 Code feature or endorsement.

Install `https://github.com/digitalxero/t3-git-history` through Settings → Plugins,
then open the thread info bar and press **History**. The graph opens in a wide
dialog using that thread's repository/worktree on its owning environment.
There is no separate plugin settings page or repository-path form.

Browse HEAD, local branches, remote-tracking branches and tags together, or
select HEAD, a full ref name (`refs/heads/main`), or commit ID. Rows appear in
topological order with colored branch lanes, ref badges, subject, author and
author date. Select a row to inspect it. Inspect opens the full message and changed files. Open any
parent to follow ancestry; merge commits allow comparison with each parent.
Inspect diff opens a read-only textual patch; Back returns to changed files
or the newest history page. Paths are quoted so unusual names stay legible.
There are no checkout, fetch, rebase, staging or other repository writes.

## Host requirements

Requires API 1, Effect 4.1.2, supervised processes and the new
`portable-graphs` capability on `djgilcrease/t3code`'s
`t3/create-plugin-system` branch. The exact verified integrated host commit
will be recorded in the stable release verification receipt. Older prototypes
fail activation rather than showing controls that cannot work. Commands are
available to agents with `filesystem:read`; they return the same bounded views.

## Deliberate limits

- The host draws colored lanes from bounded ordered graph data. Each history
  page lays out independently; edges at the bottom continue beyond that page.
  Its portable patch view does not control the builtin diff pane.
- 15 commits/page, offsets through 10,000, at most 8 KiB of Git output/query,
  10 seconds/query. Large messages, histories with very many refs, or changed
  file lists exceeding that bound fail visibly: narrow the ref or use Git.
  Changed files page 20 at a time. Patches show at most 8,000 characters and
  explicitly mark truncation; binary files have Git's binary notice.
- Merge comparison defaults to the first parent and offers up to 20 parent
  comparisons and eight parent navigation buttons (unusual octopus merges may
  need Git). Rename detection follows Git heuristics.
- The all-ref list is live; concurrent branch changes can shift offset pages.
  Selecting a ref resolves and pins its commit for subsequent paging. Refresh
  reloads the thread's current repository history. No browsing state is shared between clients.
- Shallow clones show available history only. Empty repositories have no HEAD.
  Git output is decoded as UTF-8; filenames with invalid UTF-8 bytes are not
  supported. Git must be installed on the owning environment.
- Web and desktop's shared renderer and native mobile render the same finite
  data. All commands use the chosen environment's authenticated RPC; clients
  never read local paths or depend on localhost. Runtime verification and
  platform exclusions are recorded per release, not implied by this design.

## Development

Node 24.10+: `npm ci`, `npm test`, `npm run build`, `npm run verify`.
Task equivalents: `task test`, `task build`. The committed self-contained ESM
bundle is installed as-is; no npm install/build hooks run on the T3 host.
Repository policy and pinned svu/chglog release helpers are in `.repo-policy`.
