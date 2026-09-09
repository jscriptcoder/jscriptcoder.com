# Plan: Phase 3 slice 1 — a version is visible

**Branch**: `feat/phase3-a-version-is-visible` (1a), then `feat/phase3-nmap-sv` (1b)
**Status**: Active
**Parent**: [`legacy-parity-epic.md`](./legacy-parity-epic.md) → "Phase 3 — resolved scope &
decisions (grill-me, 2026-09-09)", slice 1 of 9.

## Goal

Every box in the world carries a real `/var/lib/dpkg/status`, and `nmap -sV` reads a version off
it — the fact all three CVE axes will be keyed on, landing before anything can be exploited.

**No CVEs in this slice.** The timeline walker, `WORLD_EPOCH` and the severity roll are slice 2.
What ships here is the *subject* those attach to: a package name, a version, and one place that
answers "what version is package P on box B?".

## Grounding that changed the plan before it was written

Four findings from the code, each of which moved something:

1. **The allowlist was already waiting.** `core/patches/readFilter.ts:61` already lists
   `/var/lib/dpkg/status` in `EXTERNALLY_OBSERVABLE_ALLOWLIST`, with a comment naming
   `nmap -sV` as the reader and a TRIPWIRE about the file leaking the whole package list rather
   than only running services. Decision 14's "already tier-3 allowlisted" is correct — **no
   read-path work is needed at all**, and the tripwire is a constraint on what the file may say
   (see the manifest rule below), not a task.

2. **"Running services" is the wrong basis for the manifest, and would have shipped two bugs.**
   The spine's wording is *"generated on every box from its running services"*, which is legacy's
   basis (`buildInitialDpkgStatus` takes a port list). Ported literally it breaks twice in v2:
   - `buildDeepHostFs` (`generation/deepHostFs.ts:41`) builds the NPC tree and *then* patches
     `sshd:22` onto it. A manifest generated inside `buildRemoteHostFs` cannot see that, so every
     deep host would show `22/tcp open ssh` with no `openssh-server` entry behind it.
   - The player's own box runs nothing at start — services are opt-in. Its manifest would hold
     libraries only, and `systemctl start sshd` would open a port with no package to upgrade,
     which breaks slice 4's `apt upgrade` on the one box the defence exists for.

   Both dissolve under the rule dpkg actually follows: **a manifest lists what is INSTALLED, not
   what is running.** The plan uses "the box carries this daemon's binary" as the test, which is
   derivable from the finished tree, equals the spine's wording on every NPC (a generated box gets
   its binaries from `binariesForService` precisely because it runs the service), and gives the
   player's box `openssh-server` + `vsftpd` because it genuinely has `/usr/sbin/sshd` and
   `/usr/sbin/vsftpd`.

3. **The service→package link half-exists.** `binariesForService` (`packages/aptPackages.ts:374`)
   already resolves a service to an apt package by `name` or `daemons`. What is missing is rows
   for the two pre-installed daemons — there is no `openssh-server` and no `vsftpd` package —
   and the 8 libraries are stamped by `generation/libraries.ts` without ever being packages.

4. **`nmap` has no flag parsing whatsoever.** `USAGE` (`commands/nmap.ts:56`) is
   `nmap <target>`, and `parseScanTarget` takes exactly one argument. `-sV` is the first flag the
   command will ever take, so the parse is new, not an extension.

## Decisions this plan settles

Three were left open by the grill for planning; the fourth is a consequence the grill did not
reach. Each names the alternative it beat.

#### A. A dpkg entry names the apt package, and its Version is the bare tuple

**Owner's call, 2026-09-09.** `Package: openssh-server` / `Version: 9.7.0`, never
`Package: ssh` / `Version: OpenSSH 9.7.0`. The vendor prefix (`OpenSSH `, `PCRE2 `, `BIND `) is
display-only, owned by the version template, and rendered by `nmap -sV` as `OpenSSH 9.7.0` — which
is what real `nmap -sV` prints and what real dpkg holds.

Legacy's verbatim model (the package IS the service label, prefix inline in `Version`) was
rejected for the reason decision 14 rejected version-bearing banners: it makes apt answer to two
names for one thing (`apt install bind9` to get it, `apt upgrade domain` to fix it). One package
namespace, owned by the apt catalog, on every surface.

Consequences, all in this slice: `openssh-server` and `vsftpd` join `APT_PACKAGES`; the 8
libraries join it too, named exactly as their `.so` basenames so `apt upgrade libpcre` matches the
`/lib/libpcre.so` a player can already delete; `ServiceSpec` gains a `package` column.

#### B. One version module over all three axes, in `core/packages/`

The epic asked whether services, libraries and firmware share one entry point or three. **One**,
keyed by package name, living beside `aptPackages.ts` in `core/packages/`.

The manifest is already one flat namespace keyed by package name — inside it a service, a library
and a router's firmware are indistinguishable, which is exactly why legacy's three template tables
all share one `VersionTemplate` shape so `buildTimelineFromTemplate` walks them "without any
special-casing". Three entry points would re-introduce a distinction the file itself does not
make, and slices 8 and 9 would each have to re-attach to their own.

This fixes the home for slice 2's CVE derivation: same directory, same key.

#### C. `nmap -sV` covers every scan path in this slice, not just the client-computable ones

The tempting split is to do the paths the client can compute from its own seed (generated LAN
hosts, deep hosts, your own box) and leave the server-resolved ones (a fellow occupant, a
cross-player public IP, an inner gateway) for later. It is rejected: it ships a VERSION column that
is populated for NPCs and blank for players, which reads as a bug and points at exactly the boxes
worth attacking.

It is also cheaper than it looks. Every server-side path already materializes the target's tree to
read its pidfiles, so the manifest is in hand at each site; the cost is one optional field on
`OpenPort` and the wire schema that carries it.

This is D3.1's ordering lesson applied — *no shipped version shows a list the mechanism denies
exists* — and it is why 1b is one PR rather than two.

#### D. Firmware ships its vendor and version here, its CVEs in slice 9

The spine puts "(+ firmware on routers)" in slice 1, and decision 10 locks a `firmwareVendor` on
router-role machines plus a synthetic `firmware` package. Both land now: legacy's six vendors
(`generation/pools/routerFirmware.ts`) port verbatim, and **every** router-class box draws one on
its own seeded stream — AP gateway, inner gateway, deep gateway, switch, and the identity-built
router alike.

One rule across all five, no per-device-kind carve-out. The epic's open question ("legacy's vendor
set is a starting point, not an answer, now that v2 has three device kinds legacy did not") is
answered by giving every device kind the same pool; if slice 9 wants vendor sets that differ by
kind, it is adding content to a working axis rather than unpicking one.

`firmware` is the one package name not drawn from the apt catalog, because a router is not
apt-managed by the player. That is decision 10's wording, not a new exception.

## Acceptance criteria

- [ ] Every generated box — the player's workstation, an NPC LAN host, a deep host, and all five
      router-class boxes — carries `/var/lib/dpkg/status` in real dpkg RFC-822 format: blank-line
      separated blocks of `Package:` / `Status: install ok installed` / `Version:`.
- [ ] The manifest lists a service package iff the GENERATED box carries that service's daemon
      binary, all eight libraries on every box, and `firmware` on router-class boxes only.
- [ ] Package names are apt package names (`openssh-server`, `bind9`, `libpcre`); `Version` holds
      the bare tuple (`9.7.0`), never a vendor prefix.
- [ ] `cat /var/lib/dpkg/status` works on your own box, and on a box you hold a session on.
- [ ] A box you have NO session on does not leak more than the manifest: the tier-3 allowlist is
      unchanged, and `/etc/passwd` stays unreadable.
- [ ] `nmap -sV <target>` prints a VERSION column carrying `<prefix> <version>` for every open
      port whose package is in the target's manifest, and an empty cell for one that is not (a
      planted backdoor listener).
- [ ] `nmap <target>` without `-sV` prints exactly the three columns it prints today.
- [ ] The VERSION column is populated identically for a generated NPC, a fellow occupant's
      workstation, a cross-player public IP, an inner gateway, and a deep host.
- [ ] Two occupants of one ESSID scanning one box read the same versions.

## Slices

### Slice 1a: every box carries a package manifest, and you can read it

**Value**: A player who holds a box can `cat /var/lib/dpkg/status` and learn exactly what software
it runs and at what version — the recon step every later Phase 3 slice is keyed on.
**Path**: FS generators (`workstationFs` / `remoteHostFs` / `deepHostFs` / `routerFs`) → the
generated tree → the existing read filter and session authorization → `cat`.
**Class**: Behavior change.
**Delivery**: Independent PR against trunk.
**Required implementation skills**: `tdd`, `testing`, `refactoring`; `mutation-testing` at the PR
gate.
**Reduction program**: `N/A`.
**Transition/terminal evidence**: `N/A`.

**Work**:
- `core/packages/dpkgStatus.ts` — `DPKG_STATUS_PATH`, `parseDpkgStatus`, `parseDpkgVersions`,
  `formatDpkgStatus`, `buildEntry`. Ported from legacy `src/network/dpkgStatus.ts`, minus
  `buildInitialDpkgStatus` (whose port-list basis decision 2 above replaces) and minus
  `setDpkgVersion` (nothing writes the file until slice 4's `apt upgrade`; adding a writer now
  would be a mechanism with no caller).
- `core/packages/packageVersions.ts` — the `VersionTemplate` table over the 7 service packages,
  8 libraries and 6 firmware vendors, plus `startingVersionOf(package)`. Templates port verbatim
  from legacy's three pool files; `snmp` is the one service with no legacy template and needs a
  new row (`net-snmp`).
- `ServiceSpec` gains `package`; `APT_PACKAGES` gains `openssh-server`, `vsftpd` and the 8
  library rows.
- `buildManifest(fs, { firmwareVendor })` — a pure final pass over the finished tree, so a
  builder that patches a service on afterwards (`buildDeepHostFs`) re-derives rather than
  disagrees.
- Router-class boxes draw a `firmwareVendor` on their own seeded stream.

**RED**: A generated NPC host that runs ssh and http has a `/var/lib/dpkg/status` naming
`openssh-server`, `nginx`, all eight libraries and no `firmware`; a router names `firmware`; the
player's own box names `openssh-server` and `vsftpd` while running neither.
**GREEN**: The generators stamp the file; no reader changes.
**REFACTOR**: `/var/lib` currently exists only where mysql or redis put a datadir
(`remoteHostFs.ts:306`), and two tests assert its absence with the reasoning that an empty
`/var/lib` promises a store that is not there. The manifest makes `/var/lib` universal and those
comments need rewriting to say what is now true: the directory is always there, and it is the
`redis`/`mysql` subdirectories whose absence is load-bearing.
**PRE-PR MUTATION**: Run for `core/packages/` + the changed generators. The version tuple and the
"iff the box carries the daemon" test are both boundary-shaped and worth mutating.
**PR-ready when**: All criteria above that do not mention `nmap` are met, and the human approves
the commit.
**Slice complete when**: Its PR lands.

### Slice 1b: `nmap -sV` prints the version, from every vantage

**Value**: A player scanning any box — NPC, neighbour, or a stranger across the internet — sees
what version each open port is running, which is the recon that makes slice 2's CVE line mean
something.
**Path**: `nmap -sV` → the five existing scan resolutions (own-LAN generated, deep, occupant,
public, inner gateway) → the target's manifest → the VERSION column.
**Class**: Behavior change.
**Delivery**: Independent PR against trunk, started after 1a lands.
**Required implementation skills**: `tdd`, `testing`, `refactoring`; `mutation-testing` at the PR
gate.
**Reduction program**: `N/A`.
**Transition/terminal evidence**: `N/A`.

**Work**:
- `nmap` gains its first flag parse. `-sV` before or after the target, `--` unsupported (no
  precedent in the codebase), usage line updated.
- `OpenPort` gains `version?: string` holding the already-rendered display string. One field, one
  meaning, identical on every path — the alternative (shipping package + tuple and joining
  client-side) puts the render prefix on the wire twice and gives two places to get the join
  wrong.
- Populate it at each read site: `readOpenPorts`, `scanResult` (both vantages, forwards included
  via `resolveTargetPorts`), `resolvePublicScan`, `resolveOccupantScan`,
  `resolveInnerGatewayScan`, `nmapScanDeep`.
- Widen the zod schemas on the `api/` endpoints that carry `PublicScanResolution`.

**RED**: `nmap -sV` on a generated host prints `22/tcp open ssh OpenSSH 9.7.0`; the same scan
without `-sV` prints three columns; a port with no package in the manifest prints an empty VERSION
cell.
**GREEN**: Thread the field through; no generation changes.
**REFACTOR**: The PORT/STATE/SERVICE formatter (`nmap.ts:76-93`) currently hardcodes its column
set. Assess whether the VERSION column is a fourth `padRight` or whether the row builder wants to
take a column list — only if the second reads better.
**PRE-PR MUTATION**: Run for `commands/nmap.ts` + `core/scan/`.
**WIRE-CHECK**: **Required, not optional.** `PublicScanResolution` crosses the `api/` boundary, so
`tsc` cannot prove the field survives the round trip. Extend the existing scan wire-check script
against `vercel dev` + supabase, and prove the cross-player path specifically: A scans B's public
IP and reads B's real versions.
**PR-ready when**: Every acceptance criterion is met, the wire-check is green, and the human
approves the commit.
**Slice complete when**: Its PR lands.

## Pre-PR Quality Gate

Per PR, from `v2/`:

1. Implementation complete; refactoring assessed.
2. `mutation-testing` once for the accumulated scope; survivors addressed in the same gate.
3. `npm run typecheck` (`tsc -b` — a plain `tsc --noEmit` is a no-op here) and `npm run lint`.
4. Full non-watch test run.
5. Version bump in `v2/package.json` **and** `v2/package-lock.json`
   (`npm install --package-lock-only`). Currently 0.209.0.
6. 1b only: the wire-check against live `vercel dev` + supabase.

## Deliberately NOT in this slice

- **`WORLD_EPOCH`, the timeline walker, the severity roll, any CVE.** Slice 2. Every version this
  slice writes is a `startTuple`, and stays one until slice 2 walks it.
- **`setDpkgVersion` / any writer.** Slice 4 (`apt upgrade`) is the first caller.
- **Non-daemon packages in the manifest** (`nmap`, `hydra`, `john`). The `readFilter` tripwire
  warns that the file leaks the whole package list; keeping it to daemon-bearing packages plus
  libraries plus firmware keeps that leak to things a scan can already see, and keeps the version
  template table to the packages that can actually carry a CVE.
- **Version-bearing banners.** Decision 14 rejected them; `ServiceSpec.banner` stays
  version-free and its comment stays true.
- **`metadata.libraryLinks` deletion.** Decision 11, slice 8.

## Found during 1a, and owed to a later slice

- **`apt install` does not yet update the manifest.** The manifest is generated from the box's
  base tree, and `apt install nginx` adds `/usr/sbin/nginx` as a journal PATCH over that base — so
  a player who buys a daemon carries a binary the manifest does not name. It is the same class of
  staleness the "installed, not running" rule fixed for generated boxes, and it lands where the
  apt work already is: **slice 4 must write a manifest patch alongside the binary patch**, exactly
  as `apt install` already writes its data files. It is invisible until then because nothing reads
  the manifest for a player-installed daemon: slice 1b's VERSION column simply shows no version
  for a port whose package is unlisted, which is the same cell a planted backdoor gets.
- **`openssh-server`, `vsftpd` and the eight libraries are not yet rows in `APT_PACKAGES`.**
  Decision A says the manifest names apt packages, and nothing currently enforces that the two
  namespaces agree. Adding installable rows now would let a player `apt install openssh-server`
  for a daemon every box already has, and no test demands them. **Slice 4 owns closing this**, and
  should add a check that every package name the manifest can emit is one apt knows.

## Open, and deliberately carried forward

- **The exact `WORLD_EPOCH` date** — slice 2, and the only irreversible number in the phase.
- **Whether `formatExploit` is a required or optional catalog column** — slice 3. It does not
  touch anything here; `ServiceSpec` gains only `package` in this slice.
- **Whether `firmware` should be one package or `<vendor>-firmware`** — this slice writes
  `firmware`, per decision 10. Revisit only if slice 9 finds the vendor unreadable from the
  manifest alone.

---
*Delete this file when both PRs have landed, promoting anything durable into
`v2/docs/conventions-and-gotchas.md` and the epic's Phase 3 section.*
