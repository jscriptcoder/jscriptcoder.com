/**
 * What version a package STARTS at, and what a version scan calls it.
 *
 * One table over all three CVE axes — service packages, system libraries and
 * router firmware — because `/var/lib/dpkg/status` is itself one flat namespace
 * keyed by package name, in which a daemon, a shared object and a router's
 * firmware are indistinguishable. Splitting this into three tables would
 * re-introduce a distinction the manifest does not make, and the timeline walker
 * that later advances these versions would have to learn all three.
 *
 * The version a manifest records is the bare tuple (`9.7.0`). `displayPrefix` is
 * presentation only — the product name `nmap -sV` prints in front of it
 * (`OpenSSH 9.7.0`), and the reason the service catalog's `banner` stays
 * version-free: the daemon announcing its own build would be a second authority
 * over the fact CVEs are keyed on.
 *
 * Tuples are ported from legacy's three template pools
 * (`pools/{serviceTemplates,systemLibraryTemplates,routerFirmware}.ts`) and chosen
 * to read as currently-shipping software. `net-snmp` is the one row with no legacy
 * counterpart — legacy had no SNMP door.
 */

import type { SystemLibrary } from '../generation/libraries';

export type VersionTemplate = {
  /** What a version scan prints in front of the tuple. Trailing space or slash is
   *  part of the name as the product writes it (`nginx/1.26.0`, `OpenSSH 9.7.0`). */
  readonly displayPrefix: string;
  readonly startTuple: readonly number[];
};

/** The vendors a router-class box's firmware can come from. */
export type FirmwareVendor = 'cisco' | 'mikrotik' | 'ddwrt' | 'openwrt' | 'pfsense' | 'ubiquiti';

/** The package name every router-class box records its firmware under. Synthetic:
 *  a router is not apt-managed by the player, so this is the one package name in
 *  the manifest that the apt catalog does not own. */
export const FIRMWARE_PACKAGE = 'firmware';

export const FIRMWARE_TEMPLATES: Readonly<Record<FirmwareVendor, VersionTemplate>> = {
  cisco: { displayPrefix: 'Cisco IOS ', startTuple: [15, 9, 3] },
  mikrotik: { displayPrefix: 'MikroTik RouterOS ', startTuple: [7, 14, 2] },
  ddwrt: { displayPrefix: 'DD-WRT v', startTuple: [24, 0, 1] },
  openwrt: { displayPrefix: 'OpenWRT ', startTuple: [23, 5, 0] },
  pfsense: { displayPrefix: 'pfSense ', startTuple: [2, 7, 2] },
  ubiquiti: { displayPrefix: 'EdgeOS ', startTuple: [2, 0, 9] },
};

export const FIRMWARE_VENDORS: readonly FirmwareVendor[] = Object.keys(
  FIRMWARE_TEMPLATES,
) as readonly FirmwareVendor[];

const LIBRARY_TEMPLATES: Readonly<Record<SystemLibrary, VersionTemplate>> = {
  libpam: { displayPrefix: 'libpam ', startTuple: [1, 5, 3] },
  libcrypt: { displayPrefix: 'libcrypt ', startTuple: [4, 4, 36] },
  libsystemd: { displayPrefix: 'libsystemd ', startTuple: [255, 4, 0] },
  libreadline: { displayPrefix: 'libreadline ', startTuple: [8, 2, 10] },
  libssl: { displayPrefix: 'OpenSSL ', startTuple: [3, 2, 1] },
  libz: { displayPrefix: 'zlib ', startTuple: [1, 3, 1] },
  libxml2: { displayPrefix: 'libxml2 ', startTuple: [2, 12, 5] },
  libpcre: { displayPrefix: 'PCRE2 ', startTuple: [10, 43, 0] },
};

/** Keyed by APT package name — the same name `/var/lib/dpkg/status` records and
 *  `apt upgrade` takes, never the service label a scan prints. */
const SERVICE_PACKAGE_TEMPLATES: Readonly<Record<string, VersionTemplate>> = {
  'openssh-server': { displayPrefix: 'OpenSSH ', startTuple: [9, 7, 0] },
  nginx: { displayPrefix: 'nginx/', startTuple: [1, 26, 0] },
  vsftpd: { displayPrefix: 'vsftpd ', startTuple: [3, 0, 6] },
  mysql: { displayPrefix: 'MySQL ', startTuple: [8, 0, 36] },
  redis: { displayPrefix: 'Redis ', startTuple: [7, 2, 5] },
  bind9: { displayPrefix: 'BIND ', startTuple: [9, 18, 22] },
  snmp: { displayPrefix: 'net-snmp ', startTuple: [5, 9, 4] },
};

/** Every package that carries a version, across all three axes. Firmware is keyed
 *  by VENDOR rather than by package name, because the six vendors share one
 *  package name and only the box knows which of them it runs. */
export const PACKAGE_TEMPLATES: Readonly<Record<string, VersionTemplate>> = {
  ...SERVICE_PACKAGE_TEMPLATES,
  ...LIBRARY_TEMPLATES,
};

export const formatVersion = (tuple: readonly number[]): string => tuple.join('.');

/** The version a freshly generated box records for `pkg`, or undefined for a
 *  package with no timeline. Nothing in the world moves off this until `apt
 *  upgrade` and the CVE timeline land. */
export const startingVersionOf = (pkg: string): string | undefined => {
  const template = PACKAGE_TEMPLATES[pkg];
  return template === undefined ? undefined : formatVersion(template.startTuple);
};

export const startingFirmwareVersionOf = (vendor: FirmwareVendor): string =>
  formatVersion(FIRMWARE_TEMPLATES[vendor].startTuple);

/** What a version scan shows for a package at a version: the product's own name in
 *  front of the tuple the manifest holds. A package with no template shows the bare
 *  version rather than inventing a name for it. */
export const displayVersion = (pkg: string, version: string): string => {
  const template = PACKAGE_TEMPLATES[pkg];
  return template === undefined ? version : `${template.displayPrefix}${version}`;
};
