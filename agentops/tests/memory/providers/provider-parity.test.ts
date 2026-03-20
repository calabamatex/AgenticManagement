import { describe, it, expect } from 'vitest';
import { SupabaseProvider, NotImplementedError } from '../../../src/memory/providers/supabase-provider';

describe('SupabaseProvider (stub)', () => {
  const provider = new SupabaseProvider();

  it('has name "supabase" and mode "remote"', () => {
    expect(provider.name).toBe('supabase');
    expect(provider.mode).toBe('remote');
  });

  it('throws NotImplementedError on initialize', async () => {
    await expect(provider.initialize()).rejects.toThrow(NotImplementedError);
  });

  it('throws NotImplementedError on insert', async () => {
    await expect(provider.insert({} as any)).rejects.toThrow(NotImplementedError);
  });

  it('throws NotImplementedError on getById', async () => {
    await expect(provider.getById('id')).rejects.toThrow(NotImplementedError);
  });

  it('throws NotImplementedError on query', async () => {
    await expect(provider.query({})).rejects.toThrow(NotImplementedError);
  });

  it('throws NotImplementedError on vectorSearch', async () => {
    await expect(provider.vectorSearch([], {})).rejects.toThrow(NotImplementedError);
  });

  it('throws NotImplementedError on aggregate', async () => {
    await expect(provider.aggregate({})).rejects.toThrow(NotImplementedError);
  });
});
