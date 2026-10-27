import { leaderboardService } from "@/features/leaderboard/service";
import { AI_PRIMARY_MODEL } from "@/lib/ai/constants";
import { getDailyAIQuota } from "@/lib/ai/rate-limit";
import { testProviderConnection } from "@/lib/ai/test-connection";
import type { AIProviderType } from "@/lib/ai/types";
import { maskIpAddress, parseUserAgent } from "@/lib/auth/user-agent";
import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
} from "@/lib/crypto/encryption";
import {
  calcPoints,
  countSolvedChallenges,
  getChallengeMaxPoints,
  getSubmissionPoints,
  isSolved,
  type ScoringSubmission,
} from "@/lib/domain/scoring";
import { getRedis } from "@/lib/redis";
import {
  CSV_FORMULA_TRIGGER_REGEX,
  DEFAULT_CATEGORIES,
  DEFAULT_SUBMISSION_EXPORT_LIMIT,
  EXPORT_SUBMISSION_CSV_HEADERS,
  NUMERIC_STRING_REGEX,
} from "./constants";
import { profileRepository } from "./repository";
import type {
  AccountRow,
  ActiveSessionRecord,
  CategoryStat,
  ExportFormat,
  ExportSubmissionsResult,
  LinkedAccount,
  ProfileRepository,
  RadarPoint,
  RecentSubmission,
  SessionData,
  StrengthPoint,
  SubmissionExportDto,
  UserAiConfigData,
  UserProfileData,
  UserSettingsData,
  UserWithRelations,
} from "./types";

export { calcPoints, isSolved } from "@/lib/domain/scoring";

type ChallengeSubmission = ScoringSubmission;

export function buildRadarData(
  input:
    | ChallengeSubmission[]
    | Map<
        string | undefined,
        { avgScore: number; rootCauseAccuracyPercent?: number | null }
      >
): RadarPoint[] {
  // Backwards-compatible: if Map, treat as statsMap (legacy)
  if (input instanceof Map) {
    const statsMap = input as Map<
      string | undefined,
      { avgScore: number; rootCauseAccuracyPercent?: number | null }
    >;
    return DEFAULT_CATEGORIES.map((catName) => {
      const cs = statsMap.get(catName);
      const score = cs ? cs.avgScore || cs.rootCauseAccuracyPercent || 0 : 0;
      return { fullMark: 100, score, subject: catName };
    });
  }
  const submissions = input as ChallengeSubmission[];
  return DEFAULT_CATEGORIES.map((catName) => {
    const catSubs = submissions.filter(
      (s) => s.challenge?.category?.name === catName
    );
    if (catSubs.length === 0) {
      return { fullMark: 100, score: 0, subject: catName };
    }
    const scored = catSubs.filter((s) => s.totalScore !== null);
    if (scored.length === 0) {
      return { fullMark: 100, score: 0, subject: catName };
    }
    const avg = Math.round(
      scored.reduce((acc, s) => acc + (s.totalScore ?? 0), 0) / scored.length
    );
    return { fullMark: 100, score: avg, subject: catName };
  });
}

export function buildRadarDataFromStatsMap(
  statsMap: Map<
    string | undefined,
    { avgScore: number; rootCauseAccuracyPercent?: number | null }
  >
): RadarPoint[] {
  return buildRadarData(statsMap);
}

export function buildCategoryStats(
  input: ChallengeSubmission[] | Map<string | undefined, { avgScore: number }>,
  maybeSubmissions?: ChallengeSubmission[]
): CategoryStat[] {
  // Legacy overload: (statsMap, submissions)
  if (input instanceof Map) {
    const statsMap = input as Map<string | undefined, { avgScore: number }>;
    const submissionsLegacy = (maybeSubmissions ?? []) as ChallengeSubmission[];
    return DEFAULT_CATEGORIES.map((catName) => {
      const cs = statsMap.get(catName);
      const catSolved = submissionsLegacy.filter(
        (s) => s.challenge?.category?.name === catName && isSolved(s)
      ).length;
      let score = 0;
      if (cs) {
        score = cs.avgScore;
      } else if (catSolved > 0) {
        score = 100;
      }
      return { category: catName, score, solved: catSolved };
    });
  }
  const submissions = input as ChallengeSubmission[];
  return DEFAULT_CATEGORIES.map((catName) => {
    const catSubs = submissions.filter(
      (s) => s.challenge?.category?.name === catName
    );
    const finalSolved = (() => {
      const hasChallengeId = catSubs.some((s) => Boolean(s.challengeId));
      if (hasChallengeId) {
        return new Set(catSubs.filter(isSolved).map((s) => s.challengeId)).size;
      }
      return catSubs.filter(isSolved).length;
    })();

    let score = 0;
    if (catSubs.length > 0) {
      const scored = catSubs.filter((s) => s.totalScore !== null);
      if (scored.length > 0) {
        const avg = Math.round(
          scored.reduce((acc, s) => acc + (s.totalScore ?? 0), 0) /
            scored.length
        );
        score = avg;
      }
    }
    return { category: catName, score, solved: finalSolved };
  });
}

export function buildStrengthData(
  submissions: ChallengeSubmission[]
): StrengthPoint[] {
  return DEFAULT_CATEGORIES.map((catName) => {
    const catSubmissions = submissions.filter(
      (s) => s.challenge?.category?.name === catName && isSolved(s)
    );
    const easyCount = catSubmissions.filter(
      (s) => s.challenge?.difficulty === "easy"
    ).length;
    const medCount = catSubmissions.filter(
      (s) => s.challenge?.difficulty === "medium"
    ).length;
    const hardCount = catSubmissions.filter(
      (s) => s.challenge?.difficulty === "hard"
    ).length;
    return {
      Easy: easyCount,
      Hard: hardCount,
      Medium: medCount,
      name: catName,
    };
  });
}

export function sanitizeCsvFormula(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  if (NUMERIC_STRING_REGEX.test(trimmed)) {
    return value;
  }
  if (CSV_FORMULA_TRIGGER_REGEX.test(trimmed)) {
    return `'${value}`;
  }
  return value;
}

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  const sanitized = sanitizeCsvFormula(String(value));
  if (
    sanitized.includes('"') ||
    sanitized.includes(",") ||
    sanitized.includes("\n") ||
    sanitized.includes("\r") ||
    sanitized.startsWith("'")
  ) {
    return `"${sanitized.replaceAll('"', '""')}"`;
  }
  return sanitized;
}

export function projectSubmissionToExportDto(
  submission: UserWithRelations["submissions"][number]
): SubmissionExportDto {
  return {
    aiFeedback: submission.aiFeedback ?? null,
    challengeCategory: submission.challenge?.category?.name ?? "General",
    challengeDifficulty: submission.challenge?.difficulty ?? "medium",
    challengeTitle: submission.challenge?.title || "Challenge",
    fixCorrect: submission.fixCorrect ?? null,
    hintsUsed: submission.hintsUsed ?? 0,
    id: submission.id,
    localizationCorrect: submission.localizationCorrect ?? null,
    preventionAnswer: submission.preventionAnswer ?? null,
    rootCauseExplanation: submission.rootCauseExplanation ?? null,
    submittedAt: submission.createdAt
      ? new Date(submission.createdAt).toISOString()
      : new Date().toISOString(),
    timeSpentSeconds: submission.timeSpentSeconds ?? null,
    totalScore: submission.totalScore ?? null,
  };
}

export function formatSubmissionsCsv(dtos: SubmissionExportDto[]): string {
  const headerLine = EXPORT_SUBMISSION_CSV_HEADERS.join(",");
  if (dtos.length === 0) {
    return headerLine;
  }
  const rows = dtos.map((dto) =>
    [
      escapeCsvField(dto.id),
      escapeCsvField(dto.challengeTitle),
      escapeCsvField(dto.challengeCategory),
      escapeCsvField(dto.challengeDifficulty),
      escapeCsvField(dto.totalScore),
      escapeCsvField(dto.fixCorrect),
      escapeCsvField(dto.localizationCorrect),
      escapeCsvField(dto.hintsUsed),
      escapeCsvField(dto.timeSpentSeconds),
      escapeCsvField(dto.rootCauseExplanation),
      escapeCsvField(dto.preventionAnswer),
      escapeCsvField(dto.aiFeedback),
      escapeCsvField(dto.submittedAt),
    ].join(",")
  );
  return [headerLine, ...rows].join("\r\n");
}

export function formatSubmissionsJson(dtos: SubmissionExportDto[]): string {
  return JSON.stringify(dtos, null, 2);
}

function computeAvgScore(
  submissions: Array<{ totalScore: number | null }>
): number {
  if (submissions.length === 0) {
    return 0;
  }
  const sum = submissions.reduce((acc, s) => acc + (s.totalScore ?? 0), 0);
  return Math.round(sum / submissions.length);
}

function computeAvgTimeMinutes(
  submissions: Array<{ timeSpentSeconds: number | null }>
): number {
  if (submissions.length === 0) {
    return 0;
  }
  const total = submissions.reduce(
    (acc, s) => acc + (s.timeSpentSeconds ?? 0),
    0
  );
  return Math.round(total / submissions.length / 60);
}

function computeAvgHints(submissions: Array<{ hintsUsed: number }>): string {
  if (submissions.length === 0) {
    return "0";
  }
  const total = submissions.reduce((acc, s) => acc + s.hintsUsed, 0);
  return (total / submissions.length).toFixed(1);
}

function formatJoinedDate(
  createdAt: Date | string | null | undefined
): string | null {
  if (!createdAt) {
    return null;
  }
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatJoinedLabelLegacy(
  createdAt: Date | string | null | undefined
): string {
  const d = formatJoinedDate(createdAt);
  if (!d) {
    return "Member";
  }
  return `Member since ${d}`;
}

function resolveHandleDisplay(
  username: string | null | undefined,
  email: string | null | undefined
): string {
  if (username) {
    return `@${username}`;
  }
  if (email) {
    return `@${email.split("@")[0]}`;
  }
  return "@coder";
}

function resolveDisplayName(user: {
  displayName: string | null | undefined;
  name: string | null | undefined;
  username: string | null | undefined;
}): string {
  return user.displayName || user.name || user.username || "";
}

function buildRecentSubmissions(
  submissions: UserWithRelations["submissions"]
): (RecentSubmission & { id?: string; submittedAt?: string })[] {
  return submissions.map((submission) => {
    const submittedAt = submission.createdAt
      ? new Date(submission.createdAt).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        })
      : undefined;
    return {
      category: submission.challenge?.category?.name ?? "",
      id: submission.id,
      pts: getChallengeMaxPoints(submission.challenge),
      score: getSubmissionPoints(submission),
      submittedAt,
      title: submission.challenge?.title || "Challenge",
    };
  });
}

function buildProfileStatsValues(params: {
  avgHintsUsed: string;
  avgScore: number;
  avgTimeMinutes: number;
  solvedCount: number;
  totalPublishedCount: number;
  totalSubmissionsCount: number;
}) {
  const {
    avgHintsUsed,
    avgScore,
    avgTimeMinutes,
    solvedCount,
    totalPublishedCount,
    totalSubmissionsCount,
  } = params;
  return [
    {
      label: "Challenges Solved",
      value: `${solvedCount} / ${totalPublishedCount}`,
    },
    {
      label: "Avg. Score",
      value: totalSubmissionsCount > 0 ? `${avgScore}` : "-",
    },
    {
      label: "Avg. Time to Fix",
      value: totalSubmissionsCount > 0 ? `${avgTimeMinutes}m` : "-",
    },
    {
      label: "Hints Used",
      value: totalSubmissionsCount > 0 ? `${avgHintsUsed}` : "0",
    },
  ];
}

function formatRelativeTime(
  dateInput: Date | string | number | null | undefined
): string {
  if (!dateInput) {
    return "Active now";
  }
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0 || diffMs < 5 * 60 * 1000) {
    return "Active now";
  }
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }
  return `${diffDays}d ago`;
}

function resolveSessionLocation(ip: string | null | undefined): string {
  if (!ip) {
    return "Local Network";
  }
  const trimmed = ip.trim().toLowerCase();
  if (
    trimmed === "127.0.0.1" ||
    trimmed === "::1" ||
    trimmed === "localhost" ||
    trimmed.startsWith("192.168.") ||
    trimmed.startsWith("10.") ||
    trimmed.startsWith("172.16.") ||
    trimmed.startsWith("172.17.") ||
    trimmed.startsWith("172.18.") ||
    trimmed.startsWith("172.19.") ||
    trimmed.startsWith("172.2") ||
    trimmed.startsWith("172.30.") ||
    trimmed.startsWith("172.31.") ||
    trimmed.startsWith("::ffff:192.168.") ||
    trimmed.startsWith("::ffff:10.") ||
    trimmed.startsWith("::ffff:127.")
  ) {
    return "Local Network";
  }
  return "Remote Network";
}

function extractValidTokens(rawList: string, now: number): string[] {
  let items: unknown;
  try {
    items = JSON.parse(rawList);
  } catch {
    return [];
  }
  if (!Array.isArray(items)) {
    return [];
  }

  const tokens: string[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      tokens.push(item);
    } else if (item && typeof item === "object") {
      const { token, expiresAt } = item as {
        expiresAt?: number;
        token?: string;
      };
      if (token && (!expiresAt || expiresAt > now)) {
        tokens.push(token);
      }
    }
  }
  return tokens;
}

function parseSessionRecord(
  raw: string,
  fallbackToken: string,
  userId: string,
  now: number
): ActiveSessionRecord | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const sess = (
      parsed && typeof parsed === "object" && "session" in parsed
        ? (parsed as { session: unknown }).session
        : parsed
    ) as Record<string, unknown> | null;

    if (!sess || typeof sess !== "object") {
      return null;
    }

    const expiresAtMs = sess.expiresAt
      ? new Date(sess.expiresAt as string | number | Date).getTime()
      : 0;
    if (expiresAtMs && expiresAtMs <= now) {
      return null;
    }

    const sessId = typeof sess.id === "string" ? sess.id : fallbackToken;
    const sessToken =
      typeof sess.token === "string" ? sess.token : fallbackToken;
    const sessIp = typeof sess.ipAddress === "string" ? sess.ipAddress : null;
    const sessUa = typeof sess.userAgent === "string" ? sess.userAgent : null;
    const sessUserId = typeof sess.userId === "string" ? sess.userId : userId;

    return {
      createdAt: sess.createdAt as Date | string | number | null | undefined,
      expiresAt: sess.expiresAt as Date | string | number,
      id: sessId,
      ipAddress: sessIp,
      token: sessToken,
      updatedAt: sess.updatedAt as Date | string | number | null | undefined,
      userAgent: sessUa,
      userId: sessUserId,
    };
  } catch {
    return null;
  }
}

async function fetchRedisActiveSessions(
  userId: string
): Promise<ActiveSessionRecord[]> {
  try {
    const redis = getRedis();
    let rawList = await redis.get(`better-auth:active-sessions-${userId}`);
    if (!rawList) {
      rawList = await redis.get(`active-sessions-${userId}`);
    }
    if (!rawList) {
      return [];
    }

    const now = Date.now();
    const tokens = extractValidTokens(rawList, now);
    if (tokens.length === 0) {
      return [];
    }

    const prefixedKeys = tokens.map((t) => `better-auth:${t}`);
    let rawSessions = await redis.mget(...prefixedKeys);
    if (rawSessions.every((r) => r === null)) {
      rawSessions = await redis.mget(...tokens);
    }
    const results: ActiveSessionRecord[] = [];

    for (let i = 0; i < tokens.length; i += 1) {
      const raw = rawSessions[i];
      if (!raw) {
        continue;
      }
      const record = parseSessionRecord(raw, tokens[i] as string, userId, now);
      if (record) {
        results.push(record);
      }
    }

    return results;
  } catch (err) {
    console.warn(
      "[ProfileService] Notice while retrieving active sessions from Redis:",
      err
    );
    return [];
  }
}

function buildAccountsList(
  userAccounts: AccountRow[],
  userEmail: string
): LinkedAccount[] {
  const supportedProviders = [
    { label: "GitHub", provider: "github" as const },
    { label: "Google", provider: "google" as const },
    { label: "GitLab", provider: "gitlab" as const },
    { label: "Discord", provider: "discord" as const },
  ];
  const userAccountsMap = new Map(userAccounts.map((a) => [a.providerId, a]));
  return supportedProviders.map((p) => {
    const acc = userAccountsMap.get(p.provider);
    return {
      accountId: acc?.id,
      connected: Boolean(acc),
      email: acc?.accountId || (acc ? userEmail : undefined),
      isCurrentSignIn: Boolean(acc),
      isPrimary:
        p.provider === "github" || (Boolean(acc) && userAccounts.length === 1),
      label: p.label,
      provider: p.provider,
    };
  });
}

function mapActiveSessions(
  activeSessions: ActiveSessionRecord[],
  currentSessionId: string | undefined,
  defaultIp: string
): SessionData[] {
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const now = Date.now();
  const sessions = activeSessions.map((s) => {
    const parsedUa = parseUserAgent(s.userAgent);
    const isCurrent = Boolean(
      currentSessionId &&
        (s.id === currentSessionId || s.token === currentSessionId)
    );
    const createdAtTime = s.createdAt ? new Date(s.createdAt).getTime() : 0;
    const isRecent = createdAtTime > 0 && now - createdAtTime < twoHoursMs;
    const newLogin = Boolean(!isCurrent && isRecent);
    const ip = maskIpAddress(s.ipAddress || defaultIp);
    const lastActive = formatRelativeTime(s.updatedAt ?? s.createdAt);
    const location = resolveSessionLocation(s.ipAddress);

    return {
      browser: parsedUa.browser,
      current: isCurrent,
      device: parsedUa.device,
      deviceType: parsedUa.deviceType,
      id: s.id || s.token || "session",
      ip,
      lastActive,
      location,
      newLogin,
      os: parsedUa.os,
    };
  });

  sessions.sort((a, b) => {
    if (a.current && !b.current) {
      return -1;
    }
    if (!a.current && b.current) {
      return 1;
    }
    return 0;
  });

  return sessions;
}

function buildFallbackSession(
  currentSessionId: string | undefined,
  currentUa: string | null,
  currentIp: string | null,
  defaultIp: string
): SessionData[] {
  const fallbackParsedUa = parseUserAgent(currentUa);
  const fallbackIp = maskIpAddress(currentIp || defaultIp);
  const fallbackLocation = resolveSessionLocation(currentIp);

  return [
    {
      browser: fallbackParsedUa.browser,
      current: true,
      device:
        fallbackParsedUa.device === "Unknown Device"
          ? "Current Session"
          : fallbackParsedUa.device,
      deviceType: fallbackParsedUa.deviceType,
      id: currentSessionId || "current_session",
      ip: fallbackIp,
      lastActive: "Active now",
      location: fallbackLocation,
      os: fallbackParsedUa.os,
    },
  ];
}

async function resolveSessions(
  userId: string,
  currentSessionOrId: string | ActiveSessionRecord | null | undefined,
  defaultIp: string,
  deps?: { getSessions?: (userId: string) => Promise<ActiveSessionRecord[]> }
): Promise<SessionData[]> {
  const currentSessionId =
    typeof currentSessionOrId === "string"
      ? currentSessionOrId
      : currentSessionOrId?.id || currentSessionOrId?.token;

  const currentObj =
    typeof currentSessionOrId === "object" && currentSessionOrId !== null
      ? currentSessionOrId
      : null;

  let activeSessions: ActiveSessionRecord[] = [];
  try {
    if (deps?.getSessions) {
      activeSessions = await deps.getSessions(userId);
    } else {
      activeSessions = await fetchRedisActiveSessions(userId);
    }
  } catch (err) {
    console.warn("[ProfileService] Failed to resolve active sessions:", err);
    activeSessions = [];
  }

  if (currentObj) {
    const hasCurrent = activeSessions.some(
      (s) =>
        (currentSessionId && s.id === currentSessionId) ||
        (currentObj.token && s.token === currentObj.token)
    );
    if (!hasCurrent) {
      activeSessions.push(currentObj);
    }
  }

  if (activeSessions.length > 0) {
    return mapActiveSessions(activeSessions, currentSessionId, defaultIp);
  }

  return buildFallbackSession(
    currentSessionId,
    currentObj?.userAgent ?? null,
    currentObj?.ipAddress ?? null,
    defaultIp
  );
}

export function createProfileService(
  repo: ProfileRepository = profileRepository,
  profileRepo: ProfileRepository = repo
) {
  async function getUserProfileData(
    userId: string
  ): Promise<UserProfileData | null> {
    const { user, publishedChallenges } =
      await repo.findByIdWithRelations(userId);
    if (!user) {
      return null;
    }
    const typedUser = user as UserWithRelations;
    const totalPublishedCount = publishedChallenges.length;
    const allSubmissions =
      typedUser.submissions as unknown as ChallengeSubmission[];
    const solvedCount = countSolvedChallenges(allSubmissions);
    const totalSubmissionsCount = allSubmissions.length;
    const avgScore = computeAvgScore(
      allSubmissions as Array<{ totalScore: number | null }>
    );
    const avgTimeMinutes = computeAvgTimeMinutes(
      allSubmissions as unknown as Array<{ timeSpentSeconds: number | null }>
    );
    const avgHintsUsed = computeAvgHints(
      allSubmissions as unknown as Array<{ hintsUsed: number }>
    );
    const joinedDate = formatJoinedDate(typedUser.createdAt);
    const joinedFormatted = formatJoinedLabelLegacy(typedUser.createdAt);
    const handleDisplay = resolveHandleDisplay(
      typedUser.username,
      typedUser.email
    );
    const totalPoints = calcPoints(allSubmissions);
    const liveRank = await leaderboardService.calculateUserRank(userId);
    const radarData = buildRadarData(allSubmissions);
    const categoryStats = buildCategoryStats(allSubmissions);
    const strengthData = buildStrengthData(allSubmissions);
    const recentSlice = [...typedUser.submissions]
      .sort(
        (a, b) =>
          new Date(b.createdAt as unknown as string).getTime() -
          new Date(a.createdAt as unknown as string).getTime()
      )
      .slice(0, 10);
    const recentSubmissions = buildRecentSubmissions(recentSlice);
    const displayName = resolveDisplayName(typedUser);
    const profileStats = buildProfileStatsValues({
      avgHintsUsed,
      avgScore,
      avgTimeMinutes,
      solvedCount,
      totalPublishedCount,
      totalSubmissionsCount,
    });
    return {
      categoryStats,
      profile: {
        avatarColor: typedUser.preferredColor || "#4f46e5",
        bio: typedUser.bio || "",
        displayName,
        handle: handleDisplay,
        image: typedUser.image || typedUser.avatarUrl,
        jobTitle: typedUser.jobTitle || "",
        joined: joinedFormatted,
        joinedDate,
        name: displayName,
        points: totalPoints.toLocaleString("en-US"),
        rank: liveRank,
        streak: `${typedUser.streakCount}-day streak`,
        streakCount: typedUser.streakCount ?? 0,
      },
      profileStats,
      radarData,
      recentSubmissions,
      strengthData,
    };
  }

  async function getUserSettingsData(
    userId: string,
    currentSessionOrId?: string | ActiveSessionRecord | null,
    deps?: {
      getSessions?: (userId: string) => Promise<ActiveSessionRecord[]>;
    }
  ): Promise<UserSettingsData | null> {
    const user = await profileRepo.findByIdForSettings(userId);
    if (!user) {
      return null;
    }

    const accounts = buildAccountsList(user.accounts, user.email);
    const defaultIp = user.loginAttempts[0]?.ipAddress || "127.0.0.1";
    const sessions = await resolveSessions(
      userId,
      currentSessionOrId,
      defaultIp,
      deps
    );

    return {
      accounts,
      profile: {
        avatarColor: user.preferredColor || "#4f46e5",
        avatarUrl: user.avatarUrl || user.image || "",
        bio: user.bio || "",
        displayName: user.displayName || user.name || "",
        handle: user.username || user.email.split("@")[0] || "",
        interests: (user.interests as string[]) || [],
        isPublic: user.isPublic ?? true,
        jobTitle: user.jobTitle || "",
      },
      sessions,
    };
  }

  async function exportUserSubmissions(
    userId: string,
    format: ExportFormat,
    limit = DEFAULT_SUBMISSION_EXPORT_LIMIT
  ): Promise<ExportSubmissionsResult> {
    const rawSubmissions = await repo.findAllSubmissionsByUserId(userId, limit);
    const dtos = rawSubmissions.map(projectSubmissionToExportDto);

    const timestamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      return {
        content: formatSubmissionsCsv(dtos),
        filename: `submissions-${timestamp}.csv`,
        mimeType: "text/csv;charset=utf-8;",
      };
    }

    return {
      content: formatSubmissionsJson(dtos),
      filename: `submissions-${timestamp}.json`,
      mimeType: "application/json;charset=utf-8;",
    };
  }

  async function saveApiKey(
    userId: string,
    provider: string,
    apiKey: string
  ): Promise<{ id: string; keyPreview: string; provider: string }> {
    const encryptedApiKey = encryptApiKey(apiKey);
    const keyPreview = maskApiKey(apiKey);
    const saved = await repo.upsertApiKey({
      encryptedApiKey,
      keyPreview,
      provider,
      updatedAt: new Date(),
      userId,
    });
    return {
      id: saved.id,
      keyPreview: saved.keyPreview,
      provider: saved.provider,
    };
  }

  async function deleteApiKey(
    userId: string,
    provider: string
  ): Promise<{ success: boolean }> {
    await repo.deleteApiKey(userId, provider);
    const settings = await repo.findAiSettingsByUserId(userId);
    if (settings?.activeProvider === provider) {
      await repo.upsertAiSettings({
        activeModel: "openai/gpt-oss-120b",
        activeProvider: "platform",
        customModel: null,
        updatedAt: new Date(),
        userId,
      });
    }
    return { success: true };
  }

  async function getAiConfig(userId: string): Promise<UserAiConfigData> {
    const [keys, settings] = await Promise.all([
      repo.findApiKeysByUserId(userId),
      repo.findAiSettingsByUserId(userId),
    ]);
    const activeProvider = settings?.activeProvider ?? "platform";
    const isByok = activeProvider !== "platform";
    const dailyQuota = await getDailyAIQuota(userId, isByok);

    return {
      apiKeys: keys.map((k) => ({
        createdAt: k.createdAt.toISOString(),
        id: k.id,
        keyPreview: k.keyPreview,
        provider: k.provider,
        updatedAt: k.updatedAt.toISOString(),
      })),
      dailyQuota,
      settings: {
        activeModel: settings?.activeModel ?? "openai/gpt-oss-120b",
        activeProvider,
        customModel: settings?.customModel ?? null,
        id: settings?.id,
        updatedAt: settings?.updatedAt
          ? settings.updatedAt.toISOString()
          : undefined,
      },
    };
  }

  async function updateAiSettings(
    userId: string,
    data: {
      activeModel: string;
      activeProvider: string;
      customModel?: string | null;
    }
  ): Promise<{
    activeModel: string;
    activeProvider: string;
    customModel: string | null;
    success: boolean;
  }> {
    if (data.activeProvider !== "platform") {
      const key = await repo.findApiKeyByProvider(userId, data.activeProvider);
      if (!key) {
        throw new Error(
          `Cannot activate provider ${data.activeProvider} without configured API key`
        );
      }
    }
    const saved = await repo.upsertAiSettings({
      activeModel: data.activeModel,
      activeProvider: data.activeProvider,
      customModel: data.customModel ?? null,
      updatedAt: new Date(),
      userId,
    });
    return {
      activeModel: saved.activeModel,
      activeProvider: saved.activeProvider,
      customModel: saved.customModel,
      success: true,
    };
  }

  async function getActiveAiCredentials(userId: string): Promise<{
    apiKey: string | undefined;
    isByok: boolean;
    modelName: string;
    provider: AIProviderType;
  }> {
    const aiSettings = await repo.findAiSettingsByUserId(userId);
    let isByok = false;
    let provider: AIProviderType = "platform";
    let modelName: string = AI_PRIMARY_MODEL;
    let apiKey: string | undefined;

    if (aiSettings && aiSettings.activeProvider !== "platform") {
      const keyRow = await repo.findApiKeyByProvider(
        userId,
        aiSettings.activeProvider
      );
      if (keyRow) {
        try {
          apiKey = decryptApiKey(keyRow.encryptedApiKey);
          provider = aiSettings.activeProvider as AIProviderType;
          modelName =
            aiSettings.customModel ||
            aiSettings.activeModel ||
            AI_PRIMARY_MODEL;
          isByok = true;
        } catch (err) {
          console.warn(
            "[profileService.getActiveAiCredentials] Failed to decrypt user key:",
            err
          );
        }
      }
    }

    return { apiKey, isByok, modelName, provider };
  }

  async function testConnection(
    userId: string,
    provider: AIProviderType,
    apiKey?: string,
    modelId?: string
  ): Promise<{ error?: string; latencyMs: number; success: boolean }> {
    let effectiveKey = apiKey?.trim();

    if (!effectiveKey && provider !== "platform") {
      const existingKeyRow = await repo.findApiKeyByProvider(userId, provider);
      if (!existingKeyRow) {
        return {
          error: `No saved API key found for ${provider}`,
          latencyMs: 0,
          success: false,
        };
      }
      effectiveKey = decryptApiKey(existingKeyRow.encryptedApiKey);
    }

    return await testProviderConnection(provider, effectiveKey || "", modelId);
  }

  return {
    buildCategoryStats,
    buildRadarData,
    buildStrengthData,
    calcPoints,
    deleteApiKey,
    exportUserSubmissions,
    getActiveAiCredentials,
    getAiConfig,
    getUserProfileData,
    getUserSettingsData,
    isSolved,
    saveApiKey,
    testConnection,
    updateAiSettings,
  };
}

export const profileService = createProfileService(
  profileRepository,
  profileRepository
);
