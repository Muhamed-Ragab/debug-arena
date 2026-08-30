"use client";

import {
  AlertCircle,
  AtSign,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  ImageIcon,
  Lock,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth/client";
import { CATEGORY_CONFIG, CATEGORY_ORDER } from "@/lib/domain/categories";
import type { Category } from "@/lib/domain/types";
import { flattenValidationErrors } from "@/lib/safe-action/validation";
import { cn } from "@/lib/utils";
import { updateProfileAction } from "../actions";
import { AVATAR_PRESETS } from "../constants";

const MAX_NAME = 50;
const MAX_BIO = 250;
const MAX_JOB = 80;
const HANDLE_RE = /^[a-z0-9_]+$/i;
const AT_PREFIX_REGEX = /^@/;

function getCategoryLabel(
  category: string,
  t: ReturnType<typeof useExtracted>
): string {
  switch (category) {
    case "Backend Concurrency":
      return t("Backend Concurrency");
    case "Logic Inversions":
      return t("Logic Inversions");
    case "Memory Leaks":
      return t("Memory Leaks");
    case "Off-by-One":
      return t("Off-by-One");
    case "Race Conditions":
      return t("Race Conditions");
    case "React Rendering":
      return t("React Rendering");
    case "Security Flaws":
      return t("Security Flaws");
    case "State Mutations":
      return t("State Mutations");
    default:
      return category;
  }
}

function HandleStatus({
  available,
  error,
}: {
  available: boolean;
  error: string | null;
}) {
  const t = useExtracted();
  if (error) {
    return (
      <span className="flex items-center gap-1 text-[12px] text-destructive">
        <AlertCircle size={12} /> {error}
      </span>
    );
  }
  if (available) {
    return (
      <span className="flex items-center gap-1 text-[12px] text-emerald-400">
        <CheckCircle2 size={12} /> {t("Handle looks good")}
      </span>
    );
  }
  return (
    <span className="text-[12px] text-muted-foreground/70">
      {t("No change.")}
    </span>
  );
}

function AvatarPickerSection({
  avatarColor,
  avatarUrl,
  avatarUrlError,
  setAvatarColor,
  setAvatarUrl,
}: {
  avatarColor: string;
  avatarUrl: string;
  avatarUrlError?: string | null;
  setAvatarColor: (c: string) => void;
  setAvatarUrl: (u: string) => void;
}) {
  const t = useExtracted();
  return (
    <div className="mt-6">
      <p className="mb-2 flex items-center gap-1.5 font-medium text-[12px] text-muted-foreground">
        <Camera size={13} /> {t("Preferred avatar color")}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {AVATAR_PRESETS.map((preset) => {
          const selected = preset.color === avatarColor;
          return (
            <Button
              aria-label={t("Select {id} avatar", { id: preset.id })}
              aria-pressed={selected}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full font-semibold text-[13px] text-white transition-all",
                selected
                  ? "scale-105 ring-2 ring-primary ring-offset-2"
                  : "opacity-80 hover:opacity-100"
              )}
              key={preset.id}
              onClick={() => setAvatarColor(preset.color)}
              size="icon"
              style={{ backgroundColor: preset.color }}
              type="button"
              variant="ghost"
            >
              {selected ? <Check size={15} /> : null}
            </Button>
          );
        })}
      </div>

      <div className="mt-3">
        <Label
          className="mb-1.5 block font-medium text-[11px] text-muted-foreground"
          htmlFor="avatarUrl"
        >
          {t("Or custom avatar image URL")}
        </Label>
        <div className="relative">
          <ImageIcon
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={14}
          />
          <Input
            className="h-8 ps-9 pe-3 text-[12px]"
            id="avatarUrl"
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder={t("https://...")}
            value={avatarUrl}
          />
        </div>
        {Boolean(avatarUrlError) && (
          <span className="mt-1 flex items-center gap-1 text-[12px] text-destructive">
            <AlertCircle size={12} /> {avatarUrlError}
          </span>
        )}
      </div>
    </div>
  );
}

function CategoryInterestsSection({
  interests,
  toggleInterest,
}: {
  interests: Category[];
  toggleInterest: (c: Category) => void;
}) {
  const t = useExtracted();
  return (
    <div className="mt-6">
      <p className="mb-1 font-medium text-[12px] text-muted-foreground">
        {t("Category interests")}
      </p>
      <p className="mb-2.5 text-[12px] text-muted-foreground/70">
        {t("Preferred challenge classes surfaced first in your browser.")}
      </p>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const selected = interests.includes(cat);
          return (
            <Button
              aria-pressed={selected}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-[12px] transition-colors"
              key={cat}
              onClick={() => toggleInterest(cat)}
              size="sm"
              style={
                selected
                  ? {
                      backgroundColor: cfg.bg,
                      borderColor: cfg.border,
                      color: cfg.color,
                    }
                  : {
                      borderColor: "var(--border)",
                      color: "var(--muted-foreground)",
                    }
              }
              type="button"
              variant="ghost"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: cfg.color }}
              />
              {getCategoryLabel(cfg.label, t)}
              {Boolean(selected) && <Check className="ms-auto" size={12} />}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function PrivacySection({
  isPublic,
  setIsPublic,
}: {
  isPublic: boolean;
  setIsPublic: (p: boolean) => void;
}) {
  const t = useExtracted();
  return (
    <div className="mt-6 border-border border-t pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 font-medium text-[13px] text-heading">
            {isPublic ? (
              <Globe className="text-emerald-400" size={14} />
            ) : (
              <Lock className="text-amber-400" size={14} />
            )}
            {isPublic ? t("Public Profile") : t("Private Profile")}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {isPublic
              ? t(
                  "Your stats, solved challenges, and radar charts are visible on the leaderboard."
                )
              : t("Your profile is hidden from the public leaderboard.")}
          </p>
        </div>
        <Button
          onClick={() => setIsPublic(!isPublic)}
          size="sm"
          variant={isPublic ? "default" : "outline"}
        >
          {isPublic ? t("Enabled") : t("Private")}
        </Button>
      </div>
    </div>
  );
}

interface EditProfileFormProps {
  initialProfile?: {
    avatarColor?: string;
    avatarUrl?: string;
    bio?: string;
    displayName?: string;
    handle?: string;
    interests?: string[];
    isPublic?: boolean;
    jobTitle?: string;
  };
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps) {
  const t = useExtracted();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(
    initialProfile?.displayName || ""
  );
  const [handle, setHandle] = useState(
    initialProfile?.handle?.replace(AT_PREFIX_REGEX, "") || ""
  );
  const [jobTitle, setJobTitle] = useState(initialProfile?.jobTitle || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [avatarColor, setAvatarColor] = useState(
    initialProfile?.avatarColor || "#4f46e5"
  );
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || "");
  const [interests, setInterests] = useState<Category[]>(
    (initialProfile?.interests ?? []).filter((v): v is Category =>
      CATEGORY_ORDER.includes(v as Category)
    )
  );
  const [isPublic, setIsPublic] = useState(initialProfile?.isPublic ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [saved, setSaved] = useState(false);

  const nameError = useMemo(() => {
    if (fieldErrors.displayName) {
      return fieldErrors.displayName;
    }
    const v = displayName.trim();
    if (v.length === 0) {
      return t("Display name is required.");
    }
    if (v.length > MAX_NAME) {
      return t("Display name must be 50 characters or fewer.");
    }
    return null;
  }, [displayName, fieldErrors.displayName, t]);

  const handleError = useMemo(() => {
    if (fieldErrors.username) {
      return fieldErrors.username;
    }
    const v = handle.trim();
    if (v.length === 0) {
      return t("Handle is required.");
    }
    if (v.length < 3) {
      return t("Handle must be at least 3 characters.");
    }
    if (!HANDLE_RE.test(v)) {
      return t("Handle can only contain letters, numbers, and underscores.");
    }
    return null;
  }, [handle, fieldErrors.username, t]);

  const bioError = useMemo(() => {
    if (fieldErrors.bio) {
      return fieldErrors.bio;
    }
    if (bio.length > MAX_BIO) {
      return t("Bio must be 250 characters or fewer.");
    }
    return null;
  }, [bio, fieldErrors.bio, t]);

  const avatarUrlError = useMemo(() => {
    if (fieldErrors.avatarUrl) {
      return fieldErrors.avatarUrl;
    }
    return null;
  }, [fieldErrors.avatarUrl]);

  const handleAvailable = !handleError && handle.trim().length >= 3;
  const hasErrors = Boolean(nameError || handleError || bioError);

  const toggleInterest = (c: Category) =>
    setInterests((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const onSave = async () => {
    if (hasErrors || isSaving) {
      return;
    }
    setIsSaving(true);
    setServerError(null);
    setFieldErrors({});

    try {
      const res = await updateProfileAction({
        avatarUrl: avatarUrl.trim() || undefined,
        bio: bio.trim() || undefined,
        displayName: displayName.trim(),
        interests,
        isPublic,
        jobTitle: jobTitle.trim() || undefined,
        preferredColor: avatarColor,
        username: handle.trim(),
      });

      if (res?.data?.success) {
        // Sync better-auth session cookie so TopBar (useSession) shows fresh jobTitle/displayName without reload.
        // updateProfileAction writes directly via Drizzle, bypassing better-auth's session cache (secondaryStorage/JWT).
        // authClient.updateUser refreshes the cookie with updated user data via /api/auth/update-user.
        try {
          await authClient.updateUser({
            avatarUrl: avatarUrl.trim() || "",
            bio: bio.trim() || "",
            displayName: displayName.trim(),
            image: avatarUrl.trim() || undefined,
            isPublic,
            jobTitle: jobTitle.trim() || "",
            name: displayName.trim(),
            preferredColor: avatarColor,
            username: handle.trim(),
          } as unknown as Record<string, unknown>);
        } catch {
          // Non-fatal: DB already updated, session will refresh on next getSession fetch
        }
        router.refresh();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast.success(t("Profile updated"));
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        setFieldErrors(flat);
        const first =
          flat.displayName ??
          flat.username ??
          flat.bio ??
          flat.avatarUrl ??
          flat._errors ??
          t("Validation failed");
        setServerError(first);
        toast.error(t("Validation failed"));
      } else if (res?.serverError) {
        setServerError(res.serverError);
        toast.error(res.serverError);
      } else {
        setServerError(t("Something went wrong"));
        toast.error(t("Something went wrong"));
      }
    } catch {
      setServerError(t("Something went wrong"));
      toast.error(t("Something went wrong"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-1">
      <CardHeader>
        <CardTitle className="text-base">{t("Profile details")}</CardTitle>
        <CardDescription>
          {t(
            "Customize your public persona, job title, avatar color, and preferences."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Display name */}
          <div>
            <Label
              className="mb-1.5 block font-medium text-[12px] text-muted-foreground"
              htmlFor="displayName"
            >
              {t("Display name")}
            </Label>
            <div className="relative">
              <User
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={15}
              />
              <Input
                className="ps-9 pe-3 text-[13px]"
                id="displayName"
                maxLength={MAX_NAME + 10}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (fieldErrors.displayName) {
                    setFieldErrors((prev) => {
                      const { displayName: _omit, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                placeholder={t("e.g. Alex Morgan")}
                value={displayName}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              {nameError ? (
                <span className="flex items-center gap-1 text-[12px] text-destructive">
                  <AlertCircle size={12} /> {nameError}
                </span>
              ) : (
                <span className="text-[12px] text-muted-foreground/70">
                  {t("Public-facing name.")}
                </span>
              )}
              <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                {displayName.length}/{MAX_NAME}
              </span>
            </div>
          </div>

          {/* Handle */}
          <div>
            <Label
              className="mb-1.5 block font-medium text-[12px] text-muted-foreground"
              htmlFor="handle"
            >
              {t("Username / handle")}
            </Label>
            <div className="relative">
              <AtSign
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={15}
              />
              <Input
                className="ps-9 pe-3 font-mono text-[13px]"
                id="handle"
                onChange={(e) => {
                  setHandle(e.target.value);
                  if (fieldErrors.username) {
                    setFieldErrors((prev) => {
                      const { username: _omit, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                placeholder={t("username")}
                value={handle}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <HandleStatus available={handleAvailable} error={handleError} />
              <span className="text-[11px] text-muted-foreground/60">
                @debug.arena/{handle || "…"}
              </span>
            </div>
          </div>
        </div>

        {/* Job Title / Role */}
        <div className="mt-5">
          <Label
            className="mb-1.5 block font-medium text-[12px] text-muted-foreground"
            htmlFor="jobTitle"
          >
            {t("Job title / Role")}
          </Label>
          <div className="relative">
            <Briefcase
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={15}
            />
            <Input
              className="ps-9 pe-3 text-[13px]"
              id="jobTitle"
              maxLength={MAX_JOB}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder={t(
                "e.g. Senior Frontend Engineer, Distributed Systems"
              )}
              value={jobTitle}
            />
          </div>
        </div>

        {/* Bio */}
        <div className="mt-5">
          <Label
            className="mb-1.5 block font-medium text-[12px] text-muted-foreground"
            htmlFor="bio"
          >
            {t("Bio / tagline")}
          </Label>
          <div className="relative">
            <FileText
              className="pointer-events-none absolute start-3 top-3 text-muted-foreground"
              size={15}
            />
            <Textarea
              className="resize-none ps-9 pe-3 text-[13px] leading-relaxed"
              id="bio"
              maxLength={MAX_BIO + 20}
              onChange={(e) => {
                setBio(e.target.value);
                if (fieldErrors.bio) {
                  setFieldErrors((prev) => {
                    const { bio: _omit, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              placeholder={t(
                "Tell us a bit about your engineering interests or background..."
              )}
              rows={3}
              value={bio}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            {bioError ? (
              <span className="flex items-center gap-1 text-[12px] text-destructive">
                <AlertCircle size={12} /> {bioError}
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground/70">
                {t("Shown on your public profile.")}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/60 tabular-nums">
              {bio.length}/{MAX_BIO}
            </span>
          </div>
        </div>

        <AvatarPickerSection
          avatarColor={avatarColor}
          avatarUrl={avatarUrl}
          avatarUrlError={avatarUrlError}
          setAvatarColor={setAvatarColor}
          setAvatarUrl={(v) => {
            setAvatarUrl(v);
            if (fieldErrors.avatarUrl) {
              setFieldErrors((prev) => {
                const { avatarUrl: _omit, ...rest } = prev;
                return rest;
              });
            }
          }}
        />

        <CategoryInterestsSection
          interests={interests}
          toggleInterest={toggleInterest}
        />

        <PrivacySection isPublic={isPublic} setIsPublic={setIsPublic} />

        {/* Save bar */}
        <div className="mt-7 flex flex-wrap items-center gap-3 border-border border-t pt-5">
          <Button disabled={hasErrors || isSaving} onClick={onSave} size="md">
            {saved ? <Check size={14} /> : null}
            {(() => {
              if (isSaving) {
                return t("Saving...");
              }
              if (saved) {
                return t("Saved");
              }
              return t("Save changes");
            })()}
          </Button>
          {Boolean(saved) && (
            <span className="flex items-center gap-1 text-[12px] text-emerald-400">
              <CheckCircle2 size={13} /> {t("Profile updated successfully.")}
            </span>
          )}
          {Boolean(serverError) && (
            <span className="flex items-center gap-1 text-[12px] text-destructive">
              <AlertCircle size={13} /> {serverError}
            </span>
          )}
          {Boolean(hasErrors && !serverError) && (
            <span className="text-[12px] text-muted-foreground/70">
              {t("Fix the highlighted fields to save.")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
