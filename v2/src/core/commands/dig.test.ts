import { describe, expect, it } from 'vitest';
import { dig } from './dig';
import { nslookup } from './nslookup';
import type { CommandResult } from './types';
import {
  mockCommandEnv,
  mockIdentity,
  mockNetworkView,
  mockNetworkViewFromConnectivity,
  mockScanApi,
} from '../../test/factories/commandEnv';
import { buildColdStartConnectivity, type ConnectivityState } from '../network/interfaces';
import { assignHomeNetwork } from '../network/homeNetwork';
import { generateHomeLan, type LanHost } from '../generation/generateHomeLan';
import { zoneRecordsFor } from '../generation/generateDnsZone';
import type { OccupantProjection } from '../network/resolveOccupants';
import { asEpochMs, asPlayerKeyHex } from '../types';

/**
 * `dig <name>` — the same question `nslookup` asks, in the form the tool most
 * people reach for actually answers it: a record, a TTL, a class and a type, with
 * the resolver and the time it took reported underneath.
 *
 * The query time is REPORTED rather than spent. A lookup on the network you are
 * standing on is instant, and seeding the number off the name keeps it a stable
 * property of that name rather than fresh noise on every run.
 */

const PUBKEY = 'a'.repeat(64);
const ESSID = 'BEAN-THERE-WIFI';
const SLUG = 'bean-there-wifi';
/** Fri Jan 05 2024 09:07:03 UTC — a fixed clock, and deliberately one whose day,
 *  hour, minute and second are all single digits: `dig` zero-pads each of them, and
 *  a clock that never needed padding would agree with a build that did not pad. */
const NOW = 1704445623000;

const onlineConnectivity = (essid: string): ConnectivityState => {
  const cold = buildColdStartConnectivity(PUBKEY);
  const wlan0 = cold.interfaces.get('wlan0');
  if (wlan0 === undefined || wlan0.kind !== 'wireless') throw new Error('no wlan0 in cold start');
  const { localIp } = assignHomeNetwork(PUBKEY, essid);
  const connected = { ...wlan0, association: { essid, bssid: 'AA:BB:CC:DD:EE:FF' }, ipv4: localIp };
  return { interfaces: new Map(cold.interfaces).set('wlan0', connected) };
};

const onlineEnv = (occupants: readonly OccupantProjection[] = []) =>
  mockCommandEnv({
    identity: mockIdentity({ publicKeyHex: asPlayerKeyHex(PUBKEY) }),
    network: mockNetworkViewFromConnectivity(onlineConnectivity(ESSID)),
    scan: mockScanApi({ resolveOccupants: async () => occupants }),
    now: () => asEpochMs(NOW),
  });

const drain = async (
  result: CommandResult,
): Promise<{ lines: readonly string[]; exitCode: number }> => {
  if (result.kind === 'sync') {
    return { lines: result.lines.map((line) => line.content), exitCode: result.exitCode };
  }
  if (result.kind !== 'async') throw new Error('expected sync or async result');
  const lines: string[] = [];
  for await (const line of result.lines) lines.push(line.content);
  return { lines, exitCode: await result.exitCode() };
};

const run = async (...args: readonly string[]) =>
  drain(await dig.execute(onlineEnv(), args, new Map()));

const hostOnLan = (): LanHost => {
  const host = generateHomeLan(ESSID).hosts.find((candidate) => candidate.kind === 'machine');
  if (host === undefined) throw new Error('expected a generated host on the LAN');
  return host;
};

const gatewayIp = (): string => `${generateHomeLan(ESSID).subnet}.1`;

/** The `Query time:` line, whatever number it seeded — the numbers are the
 *  command's own business; that it reports one is the behaviour. */
const queryTimeLine = (lines: readonly string[]): string | undefined =>
  lines.find((line) => line.startsWith(';; Query time:'));

describe('dig', () => {
  it('answers a name with an A record, the resolver, and the time it claims to have taken', async () => {
    const machine = hostOnLan();

    const { lines, exitCode } = await run(machine.hostname);

    // The WHOLE block, blank separators included: those lines are the shape real
    // `dig` output has, and a spot-check of the interesting rows would agree with a
    // build that ran them all together.
    expect(lines).toEqual([
      `; <<>> DiG 9.16.0 <<>> ${machine.hostname}`,
      ';; global options: +cmd',
      '',
      ';; ANSWER SECTION:',
      `${`${machine.hostname}.${SLUG}.lan.`.padEnd(23)} 3600  IN    A     ${machine.ip}`,
      '',
      // The number is seeded off the name, so it is pinned rather than matched: a
      // build that stopped seeding would still print SOME number here.
      ';; Query time: 4 msec',
      `;; SERVER: ${gatewayIp()}#53`,
      ';; WHEN: Fri Jan 05 09:07:03 UTC 2024',
    ]);
    expect(exitCode).toBe(0);
  });

  it('reports the same query time for the same name every run', async () => {
    // Seeded off the name: a shimmering number would read as noise, where a stable
    // one reads as a property of the lookup.
    const machine = hostOnLan();

    const first = await run(machine.hostname);
    const second = await run(machine.hostname);

    expect(queryTimeLine(first.lines)).toBe(queryTimeLine(second.lines));
  });

  it('answers NXDOMAIN for a name this network has never heard of', async () => {
    const { lines, exitCode } = await run('nosuchbox');

    // A miss drops the answer section and keeps everything else — what was asked,
    // who was asked, how long they took is what makes a failed lookup readable.
    expect(lines).toEqual([
      '; <<>> DiG 9.16.0 <<>> nosuchbox',
      ';; global options: +cmd',
      '',
      ';; status: NXDOMAIN',
      '',
      ';; Query time: 4 msec',
      `;; SERVER: ${gatewayIp()}#53`,
      ';; WHEN: Fri Jan 05 09:07:03 UTC 2024',
    ]);
    expect(exitCode).toBe(1);
  });

  it('resolves exactly what nslookup resolves, down to the address', async () => {
    // Two tools, one resolver. A player who learns an address from one and cannot
    // reach it with the other has found a bug, not a subtlety.
    const machine = hostOnLan();

    const digged = await run(machine.hostname);
    const looked = await drain(
      await nslookup.execute(onlineEnv(), [machine.hostname], new Map()),
    );

    expect(digged.lines.some((line) => line.includes(machine.ip))).toBe(true);
    expect(looked.lines).toContain(`Address: ${machine.ip}`);
  });

  it('answers for a fellow player on the network too', async () => {
    const alice: OccupantProjection = {
      workstation_machine_id: 'skylab-aaaa',
      localIp: `${generateHomeLan(ESSID).subnet}.88`,
      machineName: 'alice-rig',
    };

    const { lines } = await drain(
      await dig.execute(onlineEnv([alice]), ['alice-rig'], new Map()),
    );

    expect(lines).toContain(
      `${`alice-rig.${SLUG}.lan.`.padEnd(23)} 3600  IN    A     ${alice.localIp}`,
    );
  });

  it('answers at once, with nothing to wait for or interrupt', async () => {
    const result = await dig.execute(onlineEnv(), [hostOnLan().hostname], new Map());

    expect(result.kind).toBe('sync');
  });

  it('reports usage when asked to look up nothing', async () => {
    const { lines, exitCode } = await run();

    expect(lines).toEqual(['dig: usage: dig <name>']);
    expect(exitCode).toBe(1);
  });

  it('refuses while offline, even with a fully associated, addressed wlan0', async () => {
    const conn = onlineConnectivity(ESSID);
    const env = mockCommandEnv({
      identity: mockIdentity({ publicKeyHex: asPlayerKeyHex(PUBKEY) }),
      network: mockNetworkView({
        isOnline: () => false,
        interfaces: () => [...conn.interfaces.values()],
      }),
    });

    const { lines, exitCode } = await drain(await dig.execute(env, ['gw-main'], new Map()));

    expect(lines).toEqual(['dig: network is unreachable — connect to a network first']);
    expect(exitCode).toBe(1);
  });
});

/**
 * `dig @<server> axfr` — the zone transfer. A name server hands its WHOLE zone to
 * anyone who asks: every configured host on the LAN and every host on the layers
 * behind it, addresses included — unless an admin closed `allow-transfer`. The zone is
 * generated from the ESSID, so the transfer reads it client-side and answers at once,
 * the same way `dig <name>` resolves without a round-trip.
 *
 * The fixtures are real, not convenient inventions. The whole generated world has
 * exactly two name servers that allow a transfer and both are DEEP: `ns-116` on
 * GRAD-STUDENT-WIFI, three hops in at 10.165.42.116, is one. Both Layer-1 name servers
 * happen to be locked, so OSCORP-GUEST's `bind-224` at 192.168.118.224 is the refusal.
 */

const GRAD_ESSID = 'GRAD-STUDENT-WIFI';
const GRAD_SLUG = 'grad-student-wifi';
/** ns-116 — a deep name server on GRAD-STUDENT-WIFI, transfer OPEN. */
const GRAD_NS_IP = '10.165.42.116';
/** router01, the LAN gateway on GRAD-STUDENT-WIFI — a real host, but not a name
 *  server, so a transfer aimed at it has no zone to hand over. */
const GRAD_NON_NS_IP = '192.168.112.1';

/** bind-224 — a Layer-1 name server on OSCORP-GUEST whose `allow-transfer` is closed. */
const OSCORP_ESSID = 'OSCORP-GUEST';
const OSCORP_NS_IP = '192.168.118.224';

const axfrEnv = (essid: string) =>
  mockCommandEnv({
    identity: mockIdentity({ publicKeyHex: asPlayerKeyHex(PUBKEY) }),
    network: mockNetworkViewFromConnectivity(onlineConnectivity(essid)),
    scan: mockScanApi({ resolveOccupants: async () => [] }),
    now: () => asEpochMs(NOW),
  });

const transfer = async (essid: string, ...args: readonly string[]) =>
  drain(await dig.execute(axfrEnv(essid), args, new Map()));

/** One transferred record in the shape `dig` prints it: the fully qualified name,
 *  then TTL, class, type and address — the same columns `dig <name>` uses for a single
 *  answer. Written from the format here, so a build that re-rendered a record has to
 *  disagree with this line rather than agree with itself. */
const axfrRecordLine = ({ name, ip }: { readonly name: string; readonly ip: string }): string =>
  `${`${name}.${GRAD_SLUG}.lan.`.padEnd(23)} 3600  IN    A     ${ip}`;

/** The A lines a transfer emits — every one, and nothing else. */
const answerRecords = (lines: readonly string[]): readonly string[] =>
  lines.filter((line) => line.includes(' IN    A     '));

describe('dig — zone transfer', () => {
  it('hands the whole zone over, line for line, when the server allows it', async () => {
    const { lines, exitCode } = await transfer(GRAD_ESSID, `@${GRAD_NS_IP}`, 'axfr');

    // The records come from the zone (the authority); the columns, the footer and the
    // seeded time are pinned here. Every configured LAN host and every deep-layer host,
    // in the zone file's own order.
    const records = zoneRecordsFor(GRAD_ESSID).map(axfrRecordLine);

    expect(lines).toEqual([
      `; <<>> DiG 9.16.0 <<>> AXFR @${GRAD_NS_IP}`,
      ';; global options: +cmd',
      '',
      ';; ANSWER SECTION:',
      ...records,
      '',
      `;; XFR size: ${records.length} records`,
      // Seeded off (essid, ip): a build that stopped seeding still prints A number,
      // and a shimmering one would read as noise where this reads as the transfer's.
      ';; Query time: 2 msec',
      `;; SERVER: ${GRAD_NS_IP}#53`,
      ';; WHEN: Fri Jan 05 09:07:03 UTC 2024',
    ]);
    expect(exitCode).toBe(0);
    // The zone spans layers: a 192.168 host the player could scan, and a 10.x host on a
    // segment behind a gateway they have not rooted. Knowing it is not reaching it.
    expect(records.some((line) => / 192\.168\./.test(line))).toBe(true);
    expect(records.some((line) => / 10\.\d/.test(line))).toBe(true);
  });

  it('refuses, and says so, when the name server locks the transfer down', async () => {
    const { lines, exitCode } = await transfer(OSCORP_ESSID, `@${OSCORP_NS_IP}`, 'axfr');

    expect(answerRecords(lines)).toEqual([]);
    expect(lines).not.toContain(';; ANSWER SECTION:');
    expect(lines).toContain('; Transfer failed.');
    expect(exitCode).toBe(1);
  });

  it('refuses a target that is not a name server on this network', async () => {
    // A transfer aimed at the LAN gateway has no zone to hand over. Without this the
    // command would answer with the current network's zone for ANY address typed.
    const { lines, exitCode } = await transfer(GRAD_ESSID, `@${GRAD_NON_NS_IP}`, 'axfr');

    expect(lines).toEqual([`dig: ${GRAD_NON_NS_IP}: no DNS service on target`]);
    expect(exitCode).toBe(1);
  });

  it('reads the server and the keyword in any order and any case', async () => {
    const canonical = await transfer(GRAD_ESSID, `@${GRAD_NS_IP}`, 'axfr');
    const reversed = await transfer(GRAD_ESSID, 'axfr', `@${GRAD_NS_IP}`);
    const shouted = await transfer(GRAD_ESSID, `@${GRAD_NS_IP}`, 'AXFR');

    expect(reversed).toEqual(canonical);
    expect(shouted).toEqual(canonical);
  });

  it('reports the same transfer every run, for every occupant of the network', async () => {
    // The gate and the query time are seeded off (network, server) and nothing about
    // who ran it, so two players on one access point read one answer and a find repeats.
    const first = await transfer(GRAD_ESSID, `@${GRAD_NS_IP}`, 'axfr');
    const second = await transfer(GRAD_ESSID, `@${GRAD_NS_IP}`, 'axfr');

    expect(second).toEqual(first);
  });

  it('reports usage when asked to transfer from nowhere', async () => {
    const { lines, exitCode } = await transfer(GRAD_ESSID, 'axfr');

    expect(lines).toEqual(['dig: usage: dig @<server> axfr']);
    expect(exitCode).toBe(1);
  });
});
