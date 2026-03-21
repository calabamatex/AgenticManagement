import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const agentopsRoot = path.resolve(__dirname, '../../..');

describe('Build contracts', () => {
  it('dist/src/mcp/server.js exists after build', () => {
    const filePath = path.join(agentopsRoot, 'dist/src/mcp/server.js');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('dist/src/memory/store.js exists after build', () => {
    const filePath = path.join(agentopsRoot, 'dist/src/memory/store.js');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('dist/src/primitives/risk-scoring.js exists after build', () => {
    const filePath = path.join(agentopsRoot, 'dist/src/primitives/risk-scoring.js');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('dist/src/enablement/engine.js exists after build', () => {
    const filePath = path.join(agentopsRoot, 'dist/src/enablement/engine.js');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('package.json main field points to a path that exists in dist/', () => {
    const pkgPath = path.join(agentopsRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.main).toBeDefined();
    const mainPath = path.join(agentopsRoot, pkg.main);
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  it('plugin commit-monitor metadata.json exists and has required fields', () => {
    const metadataPath = path.join(
      agentopsRoot,
      'plugins/core/commit-monitor/metadata.json',
    );
    expect(fs.existsSync(metadataPath)).toBe(true);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    expect(metadata).toHaveProperty('name');
    expect(metadata).toHaveProperty('version');
    expect(metadata).toHaveProperty('category');
    expect(metadata).toHaveProperty('author');
  });

  it('agentops.config.json exists and is valid JSON', () => {
    const configPath = path.join(agentopsRoot, 'agentops.config.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });
});
