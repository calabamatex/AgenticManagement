/**
 * benchmark-regression.test.ts — Performance regression tests for MemoryStore.
 *
 * Runs a subset of the benchmark suite and asserts that key operations
 * meet minimum performance thresholds. Designed to run in CI.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MemoryStore } from '../../src/memory/store';
import { SqliteProvider } from '../../src/memory/providers/sqlite-provider';
import { BenchmarkSuite, BenchmarkReport } from '../../src/memory/benchmark';

// Regression thresholds (conservative for CI environments)
const THRESHOLDS = {
  insert: {
    minOpsPerSecond: 500,    // single inserts: at least 500 ops/sec
    maxAvgMs: 2,             // avg insert under 2ms
  },
  search: {
    minOpsPerSecond: 100,    // keyword search: at least 100 ops/sec
    maxAvgMs: 10,            // avg search under 10ms
  },
  batch: {
    minOpsPerSecond: 1000,   // batch inserts: at least 1000 ops/sec
    maxAvgMs: 1,             // avg per-event under 1ms in batch
  },
  concurrent: {
    minOpsPerSecond: 200,    // concurrent r/w: at least 200 ops/sec
    maxP95Ms: 20,            // P95 under 20ms
  },
};

describe('MemoryStore performance regression', () => {
  let store: MemoryStore;
  let suite: BenchmarkSuite;
  let report: BenchmarkReport;
  const dbPath = path.join(__dirname, '.benchmark-regression-temp.db');

  beforeAll(async () => {
    // Clean up any previous temp DB
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    const provider = new SqliteProvider(dbPath);
    store = new MemoryStore({ provider });
    await store.initialize();

    // Use fewer iterations for CI speed (100 instead of 500)
    suite = new BenchmarkSuite({ store, iterations: 100 });
    report = await suite.runAll();

    // Log report for CI visibility
    console.log(suite.formatReport(report));
  }, 60_000); // 60s timeout for full benchmark suite

  afterAll(async () => {
    await store.close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  it('single insert meets throughput threshold', () => {
    const result = report.results.find((r) => r.name === 'Insert (single)');
    expect(result).toBeDefined();
    expect(result!.opsPerSecond).toBeGreaterThan(THRESHOLDS.insert.minOpsPerSecond);
    expect(result!.avgTimeMs).toBeLessThan(THRESHOLDS.insert.maxAvgMs);
  });

  it('keyword search meets latency threshold', () => {
    const result = report.results.find((r) => r.name === 'Search (keyword)');
    expect(result).toBeDefined();
    expect(result!.opsPerSecond).toBeGreaterThan(THRESHOLDS.search.minOpsPerSecond);
    expect(result!.avgTimeMs).toBeLessThan(THRESHOLDS.search.maxAvgMs);
  });

  it('batch insert meets throughput threshold', () => {
    const result = report.results.find((r) => r.name === 'Insert (batch)');
    expect(result).toBeDefined();
    expect(result!.opsPerSecond).toBeGreaterThan(THRESHOLDS.batch.minOpsPerSecond);
    expect(result!.avgTimeMs).toBeLessThan(THRESHOLDS.batch.maxAvgMs);
  });

  it('concurrent read/write meets performance threshold', () => {
    const result = report.results.find((r) => r.name === 'Concurrent R/W');
    expect(result).toBeDefined();
    expect(result!.opsPerSecond).toBeGreaterThan(THRESHOLDS.concurrent.minOpsPerSecond);
    expect(result!.p95Ms).toBeDefined();
    expect(result!.p95Ms!).toBeLessThan(THRESHOLDS.concurrent.maxP95Ms);
  });

  it('saves benchmark report as artifact', () => {
    const artifactDir = path.join(__dirname, '..', '..', 'benchmarks');
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    const artifactPath = path.join(artifactDir, 'ci-latest.json');
    fs.writeFileSync(artifactPath, suite.toJSON(report), 'utf-8');

    expect(fs.existsSync(artifactPath)).toBe(true);
  });
});
