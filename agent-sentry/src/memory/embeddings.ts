/**
 * embeddings.ts — Embedding provider abstraction with download-on-first-use ONNX.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';
import { Logger } from '../observability/logger';

const logger = new Logger({ module: 'embeddings' });

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  readonly dimension: number;
  readonly name: string;
}

const ONNX_MODEL_DIR = path.resolve(__dirname, '../../models');
const ONNX_MODEL_FILE = 'all-MiniLM-L6-v2.onnx';
const ONNX_TOKENIZER_FILE = 'tokenizer.json';
const ONNX_MODEL_URL = 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx';
const ONNX_TOKENIZER_URL = 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/tokenizer.json';

/**
 * SHA256 checksums for model files to prevent supply-chain attacks.
 * Update these when upgrading to a new model version.
 * To regenerate: sha256sum models/all-MiniLM-L6-v2.onnx models/tokenizer.json
 */
const ONNX_MODEL_CHECKSUMS: Record<string, string> = {
  [ONNX_MODEL_FILE]: 'sha256:VERIFY_ON_FIRST_DOWNLOAD',
  [ONNX_TOKENIZER_FILE]: 'sha256:VERIFY_ON_FIRST_DOWNLOAD',
};

/**
 * Path to a local checksums file that persists verified hashes after first download.
 * On first download, the checksum is recorded. On subsequent downloads, it is verified.
 */
const CHECKSUMS_FILE = path.join(ONNX_MODEL_DIR, 'checksums.sha256');

/**
 * Compute SHA256 hash of a file.
 */
function computeSha256(filePath: string): string {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

/**
 * Load persisted checksums from disk.
 */
function loadChecksums(): Record<string, string> {
  try {
    if (fs.existsSync(CHECKSUMS_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKSUMS_FILE, 'utf8'));
    }
  } catch {
    // Corrupted checksums file — treat as empty
  }
  return {};
}

/**
 * Save checksums to disk.
 */
function saveChecksums(checksums: Record<string, string>): void {
  const dir = path.dirname(CHECKSUMS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CHECKSUMS_FILE, JSON.stringify(checksums, null, 2));
}

/**
 * Verify a downloaded file's SHA256 checksum.
 *
 * Strategy:
 * 1. If a hardcoded checksum exists (not VERIFY_ON_FIRST_DOWNLOAD), verify against it.
 * 2. If a persisted checksum exists in checksums.sha256, verify against it.
 * 3. On first download (no prior checksum), record the hash (trust-on-first-use / TOFU).
 *
 * Throws on mismatch — the caller should clean up the file.
 */
async function verifyChecksum(filePath: string, filename: string): Promise<void> {
  const actualHash = computeSha256(filePath);
  const hardcoded = ONNX_MODEL_CHECKSUMS[filename];
  const persisted = loadChecksums();

  // Check hardcoded checksum first (if a real hash is set)
  if (hardcoded && !hardcoded.endsWith('VERIFY_ON_FIRST_DOWNLOAD')) {
    const expected = hardcoded.replace('sha256:', '');
    if (actualHash !== expected) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw new Error(
        `Checksum mismatch for ${filename}: expected ${expected}, got ${actualHash}. ` +
        'The downloaded model may have been tampered with. Aborting.',
      );
    }
    logger.info('Checksum verified (hardcoded)', { filename, hash: actualHash });
    return;
  }

  // Check persisted checksum
  if (persisted[filename]) {
    if (actualHash !== persisted[filename]) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw new Error(
        `Checksum mismatch for ${filename}: expected ${persisted[filename]}, got ${actualHash}. ` +
        'The model file has changed since first download. If this is intentional, ' +
        `delete ${CHECKSUMS_FILE} and re-download.`,
      );
    }
    logger.info('Checksum verified (persisted)', { filename, hash: actualHash });
    return;
  }

  // Trust-on-first-use: record the checksum
  persisted[filename] = actualHash;
  saveChecksums(persisted);
  logger.warn('First download — recording checksum (TOFU)', { filename, hash: actualHash });
}

export class NoopEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'noop';
  readonly dimension = 0;

  async embed(_text: string): Promise<number[]> {
    return [];
  }
}

export class OnnxEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'onnx-local';
  readonly dimension = 384;
  private session: { run: (feeds: Record<string, unknown>) => Promise<Record<string, { data: Float32Array }>> } | null = null;
  private tokenizer: { model?: { vocab?: Record<string, number> } } | null = null;

  async embed(text: string): Promise<number[]> {
    await this.ensureLoaded();
    if (!this.session) {
      throw new Error('ONNX model not loaded');
    }
    return this.runInference(text);
  }

  private async ensureLoaded(): Promise<void> {
    if (this.session) return;

    const modelPath = path.join(ONNX_MODEL_DIR, ONNX_MODEL_FILE);
    const tokenizerPath = path.join(ONNX_MODEL_DIR, ONNX_TOKENIZER_FILE);

    if (!fs.existsSync(modelPath)) {
      await this.downloadModel(modelPath);
    }
    if (!fs.existsSync(tokenizerPath)) {
      await this.downloadFile(ONNX_TOKENIZER_URL, tokenizerPath, ONNX_TOKENIZER_FILE);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- onnxruntime-node is an optional peer dependency loaded dynamically
      const ort = require('onnxruntime-node') as { InferenceSession: { create(path: string): Promise<{ run(feeds: Record<string, unknown>): Promise<Record<string, { data: Float32Array }>> }> }; Tensor: new (type: string, data: BigInt64Array, shape: number[]) => unknown };
      this.session = await ort.InferenceSession.create(modelPath);
      const tokenizerData = JSON.parse(fs.readFileSync(tokenizerPath, 'utf8'));
      this.tokenizer = tokenizerData;
    } catch (err) {
      this.session = null;
      throw new Error(`Failed to load ONNX model: ${err}`);
    }
  }

  private async runInference(text: string): Promise<number[]> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- onnxruntime-node is an optional peer dependency loaded dynamically
    const ort = require('onnxruntime-node') as { Tensor: new (type: string, data: BigInt64Array, shape: number[]) => unknown };
    const inputIds = this.tokenize(text);
    const attentionMask = new Array(inputIds.length).fill(1);
    const tokenTypeIds = new Array(inputIds.length).fill(0);

    const feeds: Record<string, unknown> = {
      input_ids: new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, inputIds.length]),
      attention_mask: new ort.Tensor('int64', BigInt64Array.from(attentionMask.map(BigInt)), [1, inputIds.length]),
      token_type_ids: new ort.Tensor('int64', BigInt64Array.from(tokenTypeIds.map(BigInt)), [1, inputIds.length]),
    };

    const results = await this.session!.run(feeds);
    const output = results['last_hidden_state'] || results[Object.keys(results)[0]];
    const data = Array.from(output.data as Float32Array);

    // Mean pooling over token dimension
    const seqLen = inputIds.length;
    const embedding = new Array(this.dimension).fill(0);
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < this.dimension; j++) {
        embedding[j] += data[i * this.dimension + j];
      }
    }
    for (let j = 0; j < this.dimension; j++) {
      embedding[j] /= seqLen;
    }

    // L2 normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let j = 0; j < this.dimension; j++) {
        embedding[j] /= norm;
      }
    }
    return embedding;
  }

  private tokenize(text: string): number[] {
    // Simple whitespace tokenizer with vocab lookup fallback
    // Real tokenizer.json has a vocab — use it if available
    if (this.tokenizer?.model?.vocab) {
      const vocab = this.tokenizer.model.vocab as Record<string, number>;
      const tokens: number[] = [vocab['[CLS]'] ?? 101];
      const words = text.toLowerCase().split(/\s+/);
      for (const word of words) {
        const id = vocab[word] ?? vocab['[UNK]'] ?? 100;
        tokens.push(id);
      }
      tokens.push(vocab['[SEP]'] ?? 102);
      // Truncate to max 128 tokens
      return tokens.slice(0, 128);
    }
    // Fallback: CLS + hash-based IDs + SEP
    const tokens: number[] = [101];
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash + word.charCodeAt(i)) & 0x7fff;
      }
      tokens.push(hash % 30000 + 1000);
    }
    tokens.push(102);
    return tokens.slice(0, 128);
  }

  private async downloadModel(destPath: string): Promise<void> {
    await this.downloadFile(ONNX_MODEL_URL, destPath, ONNX_MODEL_FILE);
  }

  private async downloadFile(url: string, destPath: string, filename?: string): Promise<void> {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tmpPath = destPath + '.tmp';

    await new Promise<void>((resolve, reject) => {
      const follow = (url: string, redirects: number) => {
        if (redirects > 5) {
          reject(new Error('Too many redirects'));
          return;
        }
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let redirectUrl = res.headers.location;
            if (redirectUrl.startsWith('/')) {
              const parsed = new URL(url);
              redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
            }
            follow(redirectUrl, redirects + 1);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed: HTTP ${res.statusCode}`));
            return;
          }
          const file = fs.createWriteStream(tmpPath);
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
          file.on('error', (err) => {
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
            reject(err);
          });
        }).on('error', reject);
      };
      follow(url, 0);
    });

    // Verify checksum after download
    if (filename) {
      await verifyChecksum(tmpPath, filename);
    }

    // Atomic rename from tmp to final path
    fs.renameSync(tmpPath, destPath);
  }
}

export type EmbeddingProviderChoice = 'auto' | 'onnx' | 'ollama' | 'openai' | 'voyage' | 'noop';

export async function detectEmbeddingProvider(
  preferred?: EmbeddingProviderChoice,
): Promise<EmbeddingProvider> {
  // If a specific provider is requested (not 'auto'), try only that one
  if (preferred && preferred !== 'auto') {
    switch (preferred) {
      case 'noop':
        return new NoopEmbeddingProvider();
      case 'onnx':
        try {
          require.resolve('onnxruntime-node');
          return new OnnxEmbeddingProvider();
        } catch (e) {
          logger.debug('ONNX runtime not available', { error: e instanceof Error ? e.message : String(e) });
          throw new Error('ONNX provider requested but onnxruntime-node is not available');
        }
      case 'ollama': {
        const ollamaAvailable = await checkOllama();
        if (ollamaAvailable) {
          return new OllamaEmbeddingProvider();
        }
        throw new Error('Ollama provider requested but Ollama is not reachable at 127.0.0.1:11434');
      }
      case 'openai':
        if (process.env.OPENAI_API_KEY) {
          return new OpenAIEmbeddingProvider();
        }
        throw new Error('OpenAI provider requested but OPENAI_API_KEY is not set');
      case 'voyage':
        if (process.env.VOYAGE_API_KEY) {
          return new VoyageEmbeddingProvider();
        }
        throw new Error('Voyage provider requested but VOYAGE_API_KEY is not set');
      default:
        throw new Error(`Unknown embedding provider: ${preferred}`);
    }
  }

  // Auto-detect: ONNX -> Ollama -> OpenAI -> Voyage -> Noop
  // 1. Try ONNX local
  try {
    require.resolve('onnxruntime-node');
    const provider = new OnnxEmbeddingProvider();
    return provider;
  } catch (e) {
    logger.debug('ONNX runtime not available for auto-detection', { error: e instanceof Error ? e.message : String(e) });
  }

  // 2. Try Ollama (if running locally)
  try {
    const ollamaAvailable = await checkOllama();
    if (ollamaAvailable) {
      return new OllamaEmbeddingProvider();
    }
  } catch (e) {
    logger.debug('Ollama not available for auto-detection', { error: e instanceof Error ? e.message : String(e) });
  }

  // 3. Try OpenAI
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIEmbeddingProvider();
  }

  // 4. Try Voyage AI
  if (process.env.VOYAGE_API_KEY) {
    return new VoyageEmbeddingProvider();
  }

  // 5. Fallback to noop
  return new NoopEmbeddingProvider();
}

async function checkOllama(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:11434/api/tags', (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'ollama';
  readonly dimension = 384;

  async embed(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ model: 'all-minilm', prompt: text });
      const req = http.request({
        hostname: '127.0.0.1',
        port: 11434,
        path: '/api/embeddings',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result.embedding || []);
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'openai';
  readonly dimension = 384;

  async embed(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 384,
      });
      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/embeddings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result.data?.[0]?.embedding || []);
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

export class VoyageEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'voyage';
  readonly dimension = 384;

  async embed(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'voyage-3-lite',
        input: [text],
        output_dimension: 384,
      });
      const req = https.request({
        hostname: 'api.voyageai.com',
        path: '/v1/embeddings',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve(result.data?.[0]?.embedding || []);
          } catch (err) {
            reject(err);
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}
