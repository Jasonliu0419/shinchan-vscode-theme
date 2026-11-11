import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd();
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]);
}
describe('pure core architecture', () => {
  it('contains core sources with no platform imports or globals', () => {
    expect(existsSync(join(root, 'src/core'))).toBe(true);
    const sources = files(join(root, 'src/core')).filter(f => f.endsWith('.ts'));
    expect(sources.length).toBeGreaterThan(0);
    for (const file of sources) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/(?:from\s*|import\s*\()['"](?:vscode|node:)/);
      expect(source, file).not.toMatch(/\b(?:document|window|acquireVsCodeApi)\b/);
      expect(source, file).not.toMatch(/\b(?:Date\.now|Math\.random)\s*\(/);
    }
  });
  it('never logs from production sources', () => {
    if (!existsSync(join(root, 'src'))) return;
    for (const file of files(join(root, 'src')).filter(f => f.endsWith('.ts'))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/console\.log/);
    }
  });
});
