import { describe, it, expect } from 'vitest';
import { voidFs } from './void';
import type { FileNode } from '../types';

const getNode = (root: FileNode, path: readonly string[]): FileNode | undefined =>
  path.reduce<FileNode | undefined>((node, segment) => node?.children?.[segment], root);

const getContent = (path: readonly string[]): string => getNode(voidFs, path)?.content ?? '';

const tableNames = [
  'table_01.csv',
  'table_02.csv',
  'table_03.csv',
  'table_04.csv',
  'table_05.csv',
] as const;

const recoveryPath = ['home', 'dbadmin', 'recovery'] as const;

const getTable = (name: string): string => getContent([...recoveryPath, name]);

describe('Flag 15 — Void Data Miner (CSV extraction)', () => {
  describe('extraction script produces flag', () => {
    it('extracts FLAG{void_data_miner} from row 13 column 3 of all tables', () => {
      const fragments = tableNames.map((name) => {
        const rows = getTable(name).split('\n');
        return rows[13].split('|')[3];
      });
      expect(fragments.join('')).toBe('FLAG{void_data_miner}');
    });

    it('simulated node script with cat() and echo() produces the flag', () => {
      let output = '';
      const cat = (path: string): string => {
        const match = path.match(/^recovery\/(.+)$/);
        return match ? getTable(match[1]) : '';
      };
      const echo = (value: string): void => {
        output = value;
      };

      const script = `
        const tables = ["table_01.csv","table_02.csv","table_03.csv","table_04.csv","table_05.csv"]
        const fragments = tables.map(t => {
          const rows = cat("recovery/" + t).split("\\n")
          return rows[13].split("|")[3]
        })
        echo(fragments.join(""))
      `;
      new Function('cat', 'echo', script)(cat, echo);
      expect(output).toBe('FLAG{void_data_miner}');
    });
  });

  describe('CSV table format', () => {
    tableNames.forEach((name) => {
      describe(name, () => {
        it('has exactly 20 rows (header + 19 data rows)', () => {
          const rows = getTable(name).split('\n');
          expect(rows).toHaveLength(20);
        });

        it('has pipe-delimited header with 5 columns', () => {
          const header = getTable(name).split('\n')[0];
          expect(header).toBe('id|timestamp|source|tag|status');
        });

        it('every data row has exactly 5 pipe-delimited fields', () => {
          const rows = getTable(name).split('\n').slice(1);
          rows.forEach((row: string) => {
            expect(row.split('|')).toHaveLength(5);
          });
        });

        it('row 13 has ERROR status (anomaly marker)', () => {
          const row = getTable(name).split('\n')[13];
          expect(row.split('|')[4]).toBe('ERROR');
        });
      });
    });
  });

  describe('credential hints', () => {
    it('auth.log leaks dbadmin password', () => {
      const authLog = getContent(['var', 'log', 'auth.log']);
      expect(authLog).toContain('dr0p_t4bl3s');
    });

    it('.abyss_notes contains phantom credentials for abyss', () => {
      const notes = getContent(['home', 'dbadmin', '.abyss_notes']);
      expect(notes).toContain('phantom');
      expect(notes).toContain('sp3ctr4l');
    });
  });

  describe('manifest hints', () => {
    it('mentions row 14 and column 4 for extraction', () => {
      const manifest = getContent([...recoveryPath, 'manifest.txt']);
      expect(manifest).toContain('Row 14');
      expect(manifest).toContain('column 4');
    });

    it('mentions pipe-delimited format', () => {
      const manifest = getContent([...recoveryPath, 'manifest.txt']);
      expect(manifest).toContain('pipe-delimited');
    });

    it('suggests using nano and node', () => {
      const manifest = getContent([...recoveryPath, 'manifest.txt']);
      expect(manifest).toContain('nano()');
      expect(manifest).toContain('node()');
    });
  });
});
