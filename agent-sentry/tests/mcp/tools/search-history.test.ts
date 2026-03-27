/**
 * search-history.test.ts — Tests for agent_sentry_search_history tool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSearchResults = [
  {
    event: {
      id: 'evt-1',
      timestamp: '2026-03-20T00:00:00.000Z',
      session_id: 'session-1',
      agent_id: 'agent-1',
      event_type: 'decision',
      severity: 'low',
      skill: 'system',
      title: 'Test decision',
      detail: 'Made a test decision',
      affected_files: [],
      tags: [],
      metadata: {},
      hash: 'hash1',
      prev_hash: '0'.repeat(64),
    },
    score: 0.95,
  },
  {
    event: {
      id: 'evt-2',
      timestamp: '2026-03-20T01:00:00.000Z',
      session_id: 'session-1',
      agent_id: 'agent-1',
      event_type: 'violation',
      severity: 'high',
      skill: 'proactive_safety',
      title: 'Safety violation',
      detail: 'A safety rule was violated',
      affected_files: ['src/test.ts'],
      tags: ['safety'],
      metadata: {},
      hash: 'hash2',
      prev_hash: 'hash1',
    },
    score: 0.8,
  },
];

const mockSearch = vi.fn();

vi.mock('../../../src/mcp/shared-store', () => {
  return {
    getSharedStore: vi.fn(),
  };
});

import { handler } from '../../../src/mcp/tools/search-history';
import { getSharedStore } from '../../../src/mcp/shared-store';

const mockGetSharedStore = getSharedStore as unknown as ReturnType<typeof vi.fn>;

describe('agent_sentry_search_history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue(mockSearchResults);
    mockGetSharedStore.mockResolvedValue({
      search: mockSearch,
      close: vi.fn(),
    });
  });

  it('should search with query and return results', async () => {
    const result = await handler({ query: 'test decision' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.results).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.results[0].event.title).toBe('Test decision');
    expect(parsed.results[0].score).toBe(0.95);
  });

  it('should pass limit option to store', async () => {
    await handler({ query: 'test', limit: 5 });

    expect(mockSearch).toHaveBeenCalledWith('test', expect.objectContaining({ limit: 5 }));
  });

  it('should pass event_type filter', async () => {
    await handler({ query: 'test', event_type: 'violation' });

    expect(mockSearch).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({ event_type: 'violation' }),
    );
  });

  it('should pass severity filter', async () => {
    await handler({ query: 'test', severity: 'high' });

    expect(mockSearch).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({ severity: 'high' }),
    );
  });

  it('should pass since filter', async () => {
    await handler({ query: 'test', since: '2026-03-19T00:00:00.000Z' });

    expect(mockSearch).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({ since: '2026-03-19T00:00:00.000Z' }),
    );
  });

  it('should default limit to 10', async () => {
    await handler({ query: 'test' });

    expect(mockSearch).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({ limit: 10 }),
    );
  });

  it('should require query parameter', async () => {
    const result = await handler({});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.error).toBeDefined();
  });

  it('should use the shared store singleton', async () => {
    await handler({ query: 'test' });

    expect(mockGetSharedStore).toHaveBeenCalled();
  });

  it('should handle store errors gracefully', async () => {
    mockGetSharedStore.mockRejectedValueOnce(new Error('Search failed'));

    const result = await handler({ query: 'test' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.error).toContain('Search failed');
  });
});
