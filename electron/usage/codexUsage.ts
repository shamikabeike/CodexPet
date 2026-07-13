import { EventEmitter } from "node:events";
import { watch, type FSWatcher } from "node:fs";
import { open, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type {
  CodexUsageSnapshot,
  QuotaWindow,
} from "../../src/shared/contracts";

const MAX_TAIL_BYTES = 4 * 1024 * 1024;
const MAX_ROLLOUT_FILES = 16;
const POLL_INTERVAL_MS = 60_000;
const WATCH_DEBOUNCE_MS = 450;

type JsonRecord = Record<string, unknown>;

interface RolloutFile {
  path: string;
  modifiedAt: number;
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function toQuotaWindow(value: unknown): QuotaWindow | null {
  const raw = asRecord(value);
  if (raw === null) {
    return null;
  }

  const usedPercent = asFiniteNumber(raw.used_percent);
  const windowMinutes = asFiniteNumber(raw.window_minutes);
  const resetsAt = asFiniteNumber(raw.resets_at);
  if (usedPercent === null || windowMinutes === null || resetsAt === null) {
    return null;
  }

  const normalizedUsed = clampPercent(usedPercent);
  return {
    usedPercent: normalizedUsed,
    remainingPercent: 100 - normalizedUsed,
    windowMinutes: Math.round(windowMinutes),
    resetsAt: Math.round(resetsAt),
  };
}

function timestampToMilliseconds(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 10_000_000_000 ? value : value * 1_000;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function parseRolloutTail(
  text: string,
  fallbackObservedAt = Date.now(),
): CodexUsageSnapshot | null {
  const lines = text.split(/\r?\n/);
  let rateLimits: JsonRecord | null = null;
  let model: string | null = null;
  let observedAt = fallbackObservedAt;

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]?.trim();
    if (!line) {
      continue;
    }

    let entry: JsonRecord;
    try {
      const parsed = asRecord(JSON.parse(line));
      if (parsed === null) {
        continue;
      }
      entry = parsed;
    } catch {
      continue;
    }

    const payload = asRecord(entry.payload);
    if (
      model === null &&
      entry.type === "turn_context" &&
      typeof payload?.model === "string"
    ) {
      model = payload.model;
    }

    if (rateLimits === null) {
      const candidate = asRecord(payload?.rate_limits);
      if (candidate !== null) {
        rateLimits = candidate;
        observedAt = timestampToMilliseconds(entry.timestamp, fallbackObservedAt);
      }
    }

    if (rateLimits !== null && model !== null) {
      break;
    }
  }

  if (rateLimits === null) {
    return null;
  }

  const quotas = [rateLimits.primary, rateLimits.secondary]
    .map(toQuotaWindow)
    .filter((quota): quota is QuotaWindow => quota !== null)
    .filter(
      (quota, index, items) =>
        items.findIndex((candidate) => candidate.windowMinutes === quota.windowMinutes) ===
        index,
    )
    .sort((left, right) => left.windowMinutes - right.windowMinutes);
  if (quotas.length === 0) {
    return null;
  }

  return {
    source: "local-session",
    planType:
      typeof rateLimits.plan_type === "string" ? rateLimits.plan_type : "unknown",
    quotas,
    model,
    observedAt,
    message: null,
  };
}

export function buildDemoSnapshot(now = Date.now()): CodexUsageSnapshot {
  const nowSeconds = Math.floor(now / 1_000);
  return {
    source: "demo",
    planType: "demo",
    quotas: [{
      usedPercent: 48,
      remainingPercent: 52,
      windowMinutes: 10_080,
      resetsAt: nowSeconds + 6 * 24 * 60 * 60,
    }],
    model: null,
    observedAt: now,
    message: "未找到 Codex 本地额度事件，当前显示演示数据",
  };
}

async function readTail(filePath: string): Promise<string> {
  const handle = await open(filePath, "r");
  try {
    const fileStat = await handle.stat();
    const size = Math.min(fileStat.size, MAX_TAIL_BYTES);
    const start = Math.max(0, fileStat.size - size);
    const buffer = Buffer.alloc(size);
    await handle.read(buffer, 0, size, start);
    const text = buffer.toString("utf8");

    if (start === 0) {
      return text;
    }

    const firstLineBreak = text.indexOf("\n");
    return firstLineBreak === -1 ? text : text.slice(firstLineBreak + 1);
  } finally {
    await handle.close();
  }
}

async function collectRolloutFiles(root: string): Promise<RolloutFile[]> {
  const files: RolloutFile[] = [];
  const pending = [root];

  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) {
      continue;
    }

    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        pending.push(absolutePath);
        continue;
      }

      if (!entry.isFile() || !/^rollout-.*\.jsonl$/i.test(entry.name)) {
        continue;
      }

      try {
        const fileStat = await stat(absolutePath);
        files.push({ path: absolutePath, modifiedAt: fileStat.mtimeMs });
      } catch {
        // 文件可能正被 Codex 轮换；下一次刷新会重新发现它。
      }
    }
  }

  return files;
}

export function resolveCodexHome(): string {
  return process.env.CODEX_HOME?.trim() || join(homedir(), ".codex");
}

export async function readLatestCodexUsage(
  codexHome = resolveCodexHome(),
): Promise<CodexUsageSnapshot> {
  const roots = [join(codexHome, "sessions"), join(codexHome, "archived_sessions")];
  const groups = await Promise.all(roots.map(collectRolloutFiles));
  const candidates = groups
    .flat()
    .sort((left, right) => right.modifiedAt - left.modifiedAt)
    .slice(0, MAX_ROLLOUT_FILES);

  for (const candidate of candidates) {
    try {
      const snapshot = parseRolloutTail(
        await readTail(candidate.path),
        candidate.modifiedAt,
      );
      if (snapshot !== null) {
        return snapshot;
      }
    } catch {
      // 单个会话损坏或被占用不应阻断其余候选文件。
    }
  }

  return buildDemoSnapshot();
}

export class CodexUsageMonitor extends EventEmitter {
  private readonly codexHome: string;

  private current: CodexUsageSnapshot = buildDemoSnapshot();

  private watchers: FSWatcher[] = [];

  private pollingTimer: NodeJS.Timeout | null = null;

  private debounceTimer: NodeJS.Timeout | null = null;

  private inFlight: Promise<CodexUsageSnapshot> | null = null;

  constructor(codexHome = resolveCodexHome()) {
    super();
    this.codexHome = codexHome;
  }

  async start(): Promise<CodexUsageSnapshot> {
    const initial = await this.refresh();
    this.startWatching();
    this.pollingTimer = setInterval(() => {
      void this.refresh();
    }, POLL_INTERVAL_MS);
    this.pollingTimer.unref();
    return initial;
  }

  read(): CodexUsageSnapshot {
    return this.current;
  }

  refresh(): Promise<CodexUsageSnapshot> {
    if (this.inFlight !== null) {
      return this.inFlight;
    }

    this.inFlight = readLatestCodexUsage(this.codexHome)
      .then((snapshot) => {
        this.current = snapshot;
        this.emit("update", snapshot);
        return snapshot;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  dispose(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];

    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private startWatching(): void {
    const sessionsRoot = join(this.codexHome, "sessions");
    try {
      const watcher = watch(sessionsRoot, { recursive: true }, (_event, fileName) => {
        if (typeof fileName !== "string" || !fileName.endsWith(".jsonl")) {
          return;
        }

        if (this.debounceTimer !== null) {
          clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
          void this.refresh();
        }, WATCH_DEBOUNCE_MS);
      });
      watcher.on("error", () => watcher.close());
      this.watchers.push(watcher);
    } catch {
      // fs.watch 不可用时仍有一分钟一次的轮询兜底。
    }
  }
}
