import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { posix, win32 } from "node:path";
import type {
  CodexUsageSnapshot,
  QuotaWindow,
} from "../../src/shared/contracts";

const APP_SERVER_TIMEOUT_MS = 10_000;
const MAX_STDOUT_BUFFER = 1024 * 1024;
const CLIENT_VERSION = "0.2.0";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toQuotaWindow(value: unknown): QuotaWindow | null {
  const raw = asRecord(value);
  if (raw === null) {
    return null;
  }

  const usedPercent = asFiniteNumber(raw.usedPercent);
  const windowMinutes = asFiniteNumber(raw.windowDurationMins);
  const resetsAt = asFiniteNumber(raw.resetsAt);
  if (usedPercent === null || windowMinutes === null || resetsAt === null) {
    return null;
  }

  const normalizedUsed = Math.min(100, Math.max(0, Math.round(usedPercent)));
  return {
    usedPercent: normalizedUsed,
    remainingPercent: 100 - normalizedUsed,
    windowMinutes: Math.round(windowMinutes),
    resetsAt: Math.round(resetsAt),
  };
}

/**
 * 把 Codex App Server 的只读额度响应缩减为渲染层需要的数据。
 * 重置券的标识、说明和有效期不会进入应用快照。
 */
export function parseAppServerRateLimits(
  value: unknown,
  observedAt = Date.now(),
): CodexUsageSnapshot | null {
  const result = asRecord(value);
  const rateLimits = asRecord(result?.rateLimits);
  if (rateLimits === null) {
    return null;
  }

  const quotas = [rateLimits.primary, rateLimits.secondary]
    .map(toQuotaWindow)
    .filter((quota): quota is QuotaWindow => quota !== null)
    .filter(
      (quota, index, items) =>
        items.findIndex(
          (candidate) => candidate.windowMinutes === quota.windowMinutes,
        ) === index,
    )
    .sort((left, right) => left.windowMinutes - right.windowMinutes);
  if (quotas.length === 0) {
    return null;
  }

  const resetCredits = asRecord(result?.rateLimitResetCredits);
  const availableCount = asFiniteNumber(resetCredits?.availableCount);

  return {
    source: "codex-app-server",
    planType:
      typeof rateLimits.planType === "string" ? rateLimits.planType : "unknown",
    quotas,
    availableResetCount:
      availableCount === null ? null : Math.max(0, Math.floor(availableCount)),
    model: null,
    observedAt,
    message: null,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(
      filePath,
      process.platform === "win32" ? constants.F_OK : constants.X_OK,
    );
    return true;
  } catch {
    return false;
  }
}

async function windowsVersionedBinCandidates(
  localAppData: string | undefined,
): Promise<string[]> {
  if (!localAppData) {
    return [];
  }

  const binRoot = win32.join(localAppData, "OpenAI", "Codex", "bin");
  let entries;
  try {
    entries = await readdir(binRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const versioned = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const executable = win32.join(binRoot, entry.name, "codex.exe");
        try {
          const details = await stat(executable);
          return { executable, modifiedAt: details.mtimeMs };
        } catch {
          return null;
        }
      }),
  );

  return [
    ...versioned
      .filter(
        (candidate): candidate is { executable: string; modifiedAt: number } =>
          candidate !== null,
      )
      .sort((left, right) => right.modifiedAt - left.modifiedAt)
      .map((candidate) => candidate.executable),
  ];
}

interface CodexExecutableCandidateOptions {
  codexHome: string;
  platform: NodeJS.Platform;
  homeDirectory: string;
  localAppData?: string;
  pathValue?: string;
}

/**
 * 生成各桌面平台的 Codex 可执行文件候选路径。
 * 使用显式平台路径实现，便于在 Windows CI 中验证 macOS 路径。
 */
export function buildCodexExecutableCandidates({
  codexHome,
  platform,
  homeDirectory,
  localAppData,
  pathValue,
}: CodexExecutableCandidateOptions): string[] {
  const pathApi = platform === "win32" ? win32 : posix;
  const executableName = platform === "win32" ? "codex.exe" : "codex";
  const pathSeparator = platform === "win32" ? ";" : ":";
  const pathCandidates = (pathValue ?? "")
    .split(pathSeparator)
    .map((entry) => entry.trim().replace(/^"(.*)"$/, "$1"))
    .filter(Boolean)
    .map((entry) => pathApi.join(entry, executableName));

  const candidates = [
    pathApi.join(codexHome, ".sandbox-bin", executableName),
    pathApi.join(codexHome, "plugins", ".plugin-appserver", executableName),
  ];

  if (platform === "win32" && localAppData) {
    candidates.push(
      pathApi.join(localAppData, "OpenAI", "Codex", "bin", executableName),
    );
  }

  if (platform === "darwin") {
    for (const applicationName of ["Codex.app", "ChatGPT.app"]) {
      candidates.push(
        pathApi.join(
          "/Applications",
          applicationName,
          "Contents",
          "Resources",
          executableName,
        ),
        pathApi.join(
          homeDirectory,
          "Applications",
          applicationName,
          "Contents",
          "Resources",
          executableName,
        ),
      );
    }
    candidates.push(
      "/opt/homebrew/bin/codex",
      "/usr/local/bin/codex",
      pathApi.join(homeDirectory, ".local", "bin", executableName),
    );
  }

  candidates.push(...pathCandidates);
  return [...new Set(candidates)];
}

export async function resolveCodexExecutables(
  codexHome: string,
): Promise<string[]> {
  const localAppData = process.env.LOCALAPPDATA?.trim();
  const versionedWindowsCandidates = process.platform === "win32"
    ? await windowsVersionedBinCandidates(localAppData)
    : [];
  const candidates = [
    ...versionedWindowsCandidates,
    ...buildCodexExecutableCandidates({
      codexHome,
      platform: process.platform,
      homeDirectory: homedir(),
      localAppData,
      pathValue: process.env.PATH,
    }),
  ];
  const unique = [...new Set(candidates)];
  const existing = await Promise.all(
    unique.map(async (candidate) => ({
      candidate,
      exists: await fileExists(candidate),
    })),
  );
  return existing.filter(({ exists }) => exists).map(({ candidate }) => candidate);
}

function queryRateLimits(
  executable: string,
  observedAt: number,
): Promise<CodexUsageSnapshot | null> {
  return new Promise((resolve) => {
    const child = spawn(executable, ["app-server"], {
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "ignore"],
    });
    let settled = false;
    let initialized = false;
    let stdoutBuffer = "";

    const finish = (snapshot: CodexUsageSnapshot | null) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      child.kill();
      resolve(snapshot);
    };

    const timeout = setTimeout(() => finish(null), APP_SERVER_TIMEOUT_MS);
    timeout.unref();

    child.once("error", () => finish(null));
    child.once("exit", () => finish(null));
    child.stdin.once("error", () => finish(null));
    child.stdout.once("error", () => finish(null));
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdoutBuffer += chunk;
      if (stdoutBuffer.length > MAX_STDOUT_BUFFER) {
        finish(null);
        return;
      }

      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        let message: JsonRecord | null = null;
        try {
          message = asRecord(JSON.parse(line));
        } catch {
          continue;
        }

        if (message?.id === 1 && !initialized) {
          initialized = true;
          child.stdin.write('{"method":"initialized"}\n');
          child.stdin.write(
            '{"method":"account/rateLimits/read","id":2}\n',
          );
          continue;
        }

        if (message?.id === 2) {
          finish(parseAppServerRateLimits(message.result, observedAt));
          return;
        }
      }
    });

    child.stdin.write(
      `${JSON.stringify({
        method: "initialize",
        id: 1,
        params: {
          clientInfo: { name: "codex-pet", title: "Miao", version: CLIENT_VERSION },
          capabilities: {
            experimentalApi: true,
            requestAttestation: false,
          },
        },
      })}\n`,
    );
  });
}

export async function readCodexUsageFromAppServer(
  codexHome: string,
  observedAt = Date.now(),
): Promise<CodexUsageSnapshot | null> {
  if (process.env.CODEX_PET_DISABLE_APP_SERVER === "1") {
    return null;
  }

  const candidates = await resolveCodexExecutables(codexHome);
  for (const executable of candidates) {
    const snapshot = await queryRateLimits(executable, observedAt);
    if (snapshot !== null) {
      return snapshot;
    }
  }
  return null;
}
