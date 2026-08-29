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
import { useTranslations } from "next-intl";
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

const CATEGORY_KEY_MAP: Record<string, string> = {
  "Backend Concurrency": "category.names.backendConcurrency",
  "Logic Inversions": "category.names.logicInversions",
  "Memory Leaks": "category.names.memoryLeaks",
  "Off-by-One": "category.names.offByOne",
  "Race Conditions": "category.names.raceConditions",
  "React Rendering": "category.names.reactRendering",
  "Security Flaws": "category.names.securityFlaws",
  "State Mutations": "category.names.stateMutations",
};

function HandleStatus({
  available,
  error,
}: {
  available: boolean;
  error: string | null;
}) {
  const t = useTranslations();
  if (error) {
    return (
      <span className="flex items-center gap-1 text-[12px] text-destructive">
        <AlertCircle size={12} /> {t(error as string)}
      </span>
    );
  }
  if (available) {
    return (
      <span className="flex items-center gap-1 text-[12px] text-emerald-400">
        <CheckCircle2 size={12} /> {t("profile.form.handleGood")}
      </span>
    );
  }
  return (
    <span className="text-[12px] text-muted-foreground/70">
      {t("profile.form.noChange")}
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
  const t = useTranslations();
  return (
    <div className="mt-6">
      <p className="mb-2 flex items-center gap-1.5 font-medium text-[12px] text-muted-foreground">
        <Camera size={13} /> {t("profile.form.preferredColor")}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {AVATAR_PRESETS.map((preset) => {
          const selected = preset.color === avatarColor;
          return (
            <Button
              aria-label={t("profile.form.selectAvatar", { id: preset.id })}
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
          {t("profile.form.customAvatarUrl")}
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
            placeholder={t("profile.form.avatarPlaceholder")}
            value={avatarUrl}
          />
        </div>
        {Boolean(avatarUrlError) && (
          <span className="mt-1 flex items-center gap-1 text-[12px] text-destructive">
            <AlertCircle size={12} /> {t(avatarUrlError as string)}
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
  const t = useTranslations();
  return (
    <div className="mt-6">
      <p className="mb-1 font-medium text-[12px] text-muted-foreground">
        {t("profile.form.categoryInterests")}
      </p>
      <p className="mb-2.5 text-[12px] text-muted-foreground/70">
        {t("profile.form.categoryInterestsHint")}
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
              {t(CATEGORY_KEY_MAP[cfg.label] ?? cfg.label)}
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
  const t = useTranslations();
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
            {isPublic
              ? t("profile.form.publicProfile")
              : t("profile.form.privateProfile")}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {isPublic
              ? t("profile.form.publicHint")
              : t("profile.form.privateHint")}
          </p>
        </div>
        <Button
          onClick={() => setIsPublic(!isPublic)}
          size="sm"
          variant={isPublic ? "default" : "outline"}
        >
          {isPublic ? t("common.status.enabled") : t("common.status.private")}
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
  const t = useTranslations();
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
      return t("profile.validation.displayNameRequired");
    }
    if (v.length > MAX_NAME) {
      return t("profile.validation.displayNameMax");
    }
    return null;
  }, [displayName, fieldErrors.displayName, t]);

  const handleError = useMemo(() => {
    if (fieldErrors.username) {
      return fieldErrors.username;
    }
    const v = handle.trim();
    if (v.length === 0) {
      return t("profile.validation.handleRequired");
    }
    if (v.length < 3) {
      return t("profile.validation.handleMin");
    }
    if (!HANDLE_RE.test(v)) {
      return t("profile.validation.handleFormat");
    }
    return null;
  }, [handle, fieldErrors.username, t]);

  const bioError = useMemo(() => {
    if (fieldErrors.bio) {
      return fieldErrors.bio;
    }
    if (bio.length > MAX_BIO) {
      return t("profile.validation.bioMax");
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
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast.success(t("profile.toast.updated"));
      } else if (res?.validationErrors) {
        const flat = flattenValidationErrors(res.validationErrors);
        setFieldErrors(flat);
        const first =
          flat.displayName ??
          flat.username ??
          flat.bio ??
          flat.avatarUrl ??
          flat._errors ??
          t("error.validationFailed");
        setServerError(first);
        toast.error(t("error.validationFailed"));
      } else if (res?.serverError) {
        setServerError(res.serverError);
        toast.error(t(res.serverError as string));
      } else {
        setServerError(t("error.somethingWrong"));
        toast.error(t("error.somethingWrong"));
      }
    } catch {
      setServerError(t("error.somethingWrong"));
      toast.error(t("error.somethingWrong"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-1">
      <CardHeader>
        <CardTitle className="text-base">
          {t("profile.form.detailsTitle")}
        </CardTitle>
        <CardDescription>{t("profile.form.detailsSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Display name */}
          <div>
            <Label
              className="mb-1.5 block font-medium text-[12px] text-muted-foreground"
              htmlFor="displayName"
            >
              {t("profile.form.displayName")}
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
                placeholder={t("profile.form.displayNamePlaceholder")}
                value={displayName}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              {nameError ? (
                <span className="flex items-center gap-1 text-[12px] text-destructive">
                  <AlertCircle size={12} /> {t(nameError as string)}
                </span>
              ) : (
                <span className="text-[12px] text-muted-foreground/70">
                  {t("profile.form.displayNameHint")}
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
              {t("profile.form.username")}
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
                placeholder={t("profile.form.usernamePlaceholder")}
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
            {t("profile.form.jobTitle")}
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
              placeholder={t("profile.form.jobTitlePlaceholder")}
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
            {t("profile.form.bio")}
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
              placeholder={t("profile.form.bioPlaceholder")}
              rows={3}
              value={bio}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            {bioError ? (
              <span className="flex items-center gap-1 text-[12px] text-destructive">
                <AlertCircle size={12} /> {t(bioError as string)}
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground/70">
                {t("profile.form.bioHint")}
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
                return t("common.actions.saving");
              }
              if (saved) {
                return t("common.actions.saved");
              }
              return t("common.actions.saveChanges");
            })()}
          </Button>
          {Boolean(saved) && (
            <span className="flex items-center gap-1 text-[12px] text-emerald-400">
              <CheckCircle2 size={13} /> {t("profile.toast.updatedSuccess")}
            </span>
          )}
          {Boolean(serverError) && (
            <span className="flex items-center gap-1 text-[12px] text-destructive">
              <AlertCircle size={13} /> {t(serverError as string)}
            </span>
          )}
          {Boolean(hasErrors && !serverError) && (
            <span className="text-[12px] text-muted-foreground/70">
              {t("profile.form.fixFields")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
