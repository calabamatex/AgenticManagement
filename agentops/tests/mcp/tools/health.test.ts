/**
 * health.test.ts — Tests for agentops_health tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStats = {
  total_events: 42,
  by_type: {
    decision: 20,
    violation: 5,
    incident: 3,
    pattern: 10,
    handoff: 2,
    audit_finding: 2,
  },
  by_severity: {
    low: 25,
    medium: 10,
    high: 5,
    critical: 2,
  },
  by_skill: {
    save_points: 10,
    context_health: 8,
    standing_orders: 7,
    small_bets: 6,
    proactive_safety: 5,
    system: 6,
  },
  first_event: '2026-03-01T00:00:00.000Z',
  last_event: '2026-03-20T12:00:00.000Z',
};

vi.mock('../../../src/memory/store', () => {
  return {
    MemoryStore: vi.fn().mockImplementation(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      stats: vi.fn().mockResolvedValue(mockStats),
      close: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

import { handler } from '../../../src/mcp/tools/health';
import { MemoryStore } from '../../../src/memory/store';

describe('agentops_health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy status with stats', async () => {
    const result = await handler({});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.status).toBe('healthy');
    expect(parsed.total_events).toBe(42);
    expect(parsed.by_type.decision).toBe(20);
    expect(parsed.by_severity.low).toBe(25);
    expect(parsed.first_event).toBe('2026-03-01T00:00:00.000Z');
    expect(parsed.last_event).toBe('2026-03-20T12:00:00.000Z');
  });

  it('should return degraded status for many critical events', async () => {
    const storeModule = await import('../../../src/memory/store');
    (storeModule.MemoryStore as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      stats: vi.fn().mockResolvedValue({
        ...mockStats,
        by_severity: { ...mockStats.by_severity, critical: 15 },
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }));

    const result = await handler({});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.status).toBe('degraded');
  });

  it('should return error status on store failure', async () => {
    const storeModule = await import('../../../src/memory/store');
    (storeModule.MemoryStore as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      initialize: vi.fn().mockRejectedValue(new Error('DB unavailable')),
      close: vi.fn().mockResolvedValue(undefined),
    }));

    const result = await handler({});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.status).toBe('error');
    expect(parsed.error).toContain('DB unavailable');
    expect(parsed.total_events).toBe(0);
  });

  it('should close store after stats retrieval', async () => {
    await handler({});

    const storeInstance = (MemoryStore as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(storeInstance.close).toHaveBeenCalled();
  });

  it('should include all stat categories', async () => {
    const result = await handler({});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.by_type).toBeDefined();
    expect(parsed.by_severity).toBeDefined();
    expect(parsed.by_skill).toBeDefined();
  });
});
