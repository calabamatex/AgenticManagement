/**
 * stream.ts — CLI command: real-time event stream tail.
 *
 * Wraps EventStream with a callback transport that writes to stdout.
 * Handles stdout backpressure and clean SIGINT teardown.
 */

import { CommandDefinition, ParsedArgs, isJson } from '../parser';
import { EventStream, StreamFilter, StreamEvent } from '../../streaming/event-stream';

export const streamCommand: CommandDefinition = {
  name: 'stream',
  description: 'Tail live event stream to stdout',
  usage: [
    'Usage: agentops stream [options]',
    '',
    'Options:',
    '  --filter <key=value>   Filter events (type, severity, skill, agent, session)',
    '                         Can be specified multiple times',
    '  --replay <n>           Replay last n buffered events (default 0)',
    '  --json                 Output events as JSON lines (default)',
    '  --pretty               Pretty-print events (human-readable)',
    '',
    'Press Ctrl+C to stop.',
  ].join('\n'),

  async run(args: ParsedArgs): Promise<void> {
    const json = !args.flags['pretty'];
    const replay = typeof args.flags['replay'] === 'string' ? parseInt(args.flags['replay'], 10) : 0;

    // Build filter from --filter flags
    const filter = buildFilter(args);

    const eventStream = EventStream.getInstance();

    // Track whether stdout is writable (backpressure handling)
    let draining = true;
    process.stdout.on('drain', () => { draining = true; });

    const clientId = eventStream.addClient({
      id: `cli-${Date.now()}`,
      connectedAt: new Date().toISOString(),
      filter,
      transport: 'callback',
      send(event: StreamEvent): void {
        const line = json
          ? JSON.stringify(event)
          : formatEvent(event);

        if (draining) {
          draining = process.stdout.write(line + '\n');
        }
        // If stdout is full, drop the event (tail semantics — latest wins)
      },
      close(): void {
        // No-op for stdout
      },
    }, replay);

    // Clean SIGINT teardown
    const cleanup = (): void => {
      eventStream.removeClient(clientId);
      process.stdout.write('\n');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Keep process alive
    const keepAlive = setInterval(() => {}, 60_000);

    // Handle process exit
    process.on('beforeExit', () => {
      clearInterval(keepAlive);
      eventStream.removeClient(clientId);
    });
  },
};

function buildFilter(args: ParsedArgs): StreamFilter {
  const filter: StreamFilter = {};
  const raw = args.flags['filter'];

  if (typeof raw === 'string') {
    applyFilterPair(filter, raw);
  }

  // Also check positionals for extra filter pairs
  for (const pos of args.positionals) {
    if (pos.includes('=')) {
      applyFilterPair(filter, pos);
    }
  }

  return filter;
}

function applyFilterPair(filter: StreamFilter, pair: string): void {
  const eqIdx = pair.indexOf('=');
  if (eqIdx === -1) return;
  const key = pair.slice(0, eqIdx);
  const val = pair.slice(eqIdx + 1);

  switch (key) {
    case 'type': (filter.eventTypes ??= []).push(val); break;
    case 'severity': (filter.severities ??= []).push(val); break;
    case 'skill': (filter.skills ??= []).push(val); break;
    case 'agent': filter.agentId = val; break;
    case 'session': filter.sessionId = val; break;
    case 'tag': (filter.tags ??= []).push(val); break;
  }
}

function formatEvent(event: StreamEvent): string {
  const ts = event.timestamp.slice(11, 23); // HH:MM:SS.mmm
  return `[${ts}] ${event.type.padEnd(12)} ${JSON.stringify(event.data)}`;
}
