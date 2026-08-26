"use client";

import {
  AlertCircle,
  AtSign,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORY_CONFIG, CATEGORY_ORDER } from "@/lib/domain/categories";
import type { Category } from "@/lib/domain/types";
import {
  AVATAR_PRESETS,
  PROFILE_DEFAULT,
  TAKEN_HANDLES,
} from "../data/settings";

const MAX_NAME = 50;
const MAX_BIO = 160;
const HANDLE_RE = /^[a-z0-9_]+$/i;

function renderHandleStatus(error: string | null, available: boolean) {
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
        <CheckCircle2 size={12} /> Available
      </span>
    );
  }
  return (
    <span className="text-[12px] text-muted-foreground/70">No change.</span>
  );
}

export function EditProfileForm() {
  const [displayName, setDisplayName] = useState(PROFILE_DEFAULT.displayName);
  const [handle, setHandle] = useState(PROFILE_DEFAULT.handle);
  const [bio, setBio] = useState(PROFILE_DEFAULT.bio);
  const [avatarColor, setAvatarColor] = useState(PROFILE_DEFAULT.avatarColor);
  const [interests, setInterests] = useState<Category[]>(
    PROFILE_DEFAULT.interests
  );
  const [saved, setSaved] = useState(false);

  const nameError = useMemo(() => {
    const v = displayName.trim();
    if (v.length === 0) {
      return "Display name is required.";
    }
    if (v.length > MAX_NAME) {
      return `Display name must be ${MAX_NAME} characters or fewer.`;
    }
    return null;
  }, [displayName]);

  const handleError = useMemo(() => {
    const v = handle.trim();
    if (v.length === 0) {
      return "Handle is required.";
    }
    if (!HANDLE_RE.test(v)) {
      return "Handle can only contain letters, numbers, and underscores.";
    }
    if (TAKEN_HANDLES.has(v.toLowerCase()) && v !== PROFILE_DEFAULT.handle) {
      return "Handle is already taken.";
    }
    return null;
  }, [handle]);

  const bioError = useMemo(() => {
    if (bio.length > MAX_BIO) {
      return `Bio must be ${MAX_BIO} characters or fewer.`;
    }
    return null;
  }, [bio]);

  const handleAvailable =
    !handleError && handle.trim() !== PROFILE_DEFAULT.handle;
  const hasErrors = Boolean(nameError || handleError || bioError);

  const toggleInterest = (c: Category) =>
    setInterests((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const onSave = () => {
    if (hasErrors) {
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <h2 className="font-semibold text-[15px] text-heading">
        Profile details
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Customize your public persona, avatar color, and preferred challenge
        categories.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Display name */}
        <div>
          <label
            className="mb-1.5 block font-medium text-[12px] text-muted-foreground"
            htmlFor="displayName"
          >
            Display name
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={15}
            />
            <input
              className="w-full rounded-md border border-border bg-inset py-2 ps-9 pe-3 text-[13px] text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              id="displayName"
              maxLength={MAX_NAME + 10}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
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
                Public-facing name.
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/60 tabular-nums">
              {displayName.length}/{MAX_NAME}
            </span>
          </div>
        </div>

        {/* Handle */}
        <div>
          <label
            className="mb-1.5 block font-medium text-[12px] text-muted-foreground"
            htmlFor="handle"
          >
            Username / handle
          </label>
          <div className="relative">
            <AtSign
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={15}
            />
            <input
              className="w-full rounded-md border border-border bg-inset py-2 ps-9 pe-3 font-mono text-[13px] text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              id="handle"
              onChange={(e) => setHandle(e.target.value)}
              placeholder="handle"
              value={handle}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            {renderHandleStatus(handleError, handleAvailable)}
            <span className="text-[11px] text-muted-foreground/60">
              @debug.arena/{handle || "…"}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="mt-5">
        <label
          className="mb-1.5 block font-medium text-[12px] text-muted-foreground"
          htmlFor="bio"
        >
          Bio / tagline
        </label>
        <div className="relative">
          <FileText
            className="pointer-events-none absolute start-3 top-3 text-muted-foreground"
            size={15}
          />
          <textarea
            className="w-full resize-none rounded-md border border-border bg-inset py-2 ps-9 pe-3 text-[13px] text-foreground leading-relaxed transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            id="bio"
            maxLength={MAX_BIO + 20}
            onChange={(e) => setBio(e.target.value)}
            placeholder="One line about you."
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
              Shown on your profile.
            </span>
          )}
          <span className="text-[11px] text-muted-foreground/60 tabular-nums">
            {bio.length}/{MAX_BIO}
          </span>
        </div>
      </div>

      {/* Avatar picker */}
      <div className="mt-6">
        <p className="mb-2 flex items-center gap-1.5 font-medium text-[12px] text-muted-foreground">
          <Camera size={13} /> Avatar
        </p>
        <div className="flex flex-wrap gap-2.5">
          {AVATAR_PRESETS.map((preset) => {
            const selected = preset.color === avatarColor;
            return (
              <button
                aria-label={`Select ${preset.id} avatar`}
                aria-pressed={selected}
                className={`flex h-9 w-9 items-center justify-center rounded-full font-semibold text-[13px] text-white transition-all ${
                  selected
                    ? "ring-2 ring-primary ring-offset-2"
                    : "opacity-80 hover:opacity-100"
                }`}
                key={preset.id}
                onClick={() => setAvatarColor(preset.color)}
                style={{ backgroundColor: preset.color }}
                type="button"
              >
                {selected ? <Check size={15} /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category interests */}
      <div className="mt-6">
        <p className="mb-1 font-medium text-[12px] text-muted-foreground">
          Category interests
        </p>
        <p className="mb-2.5 text-[12px] text-muted-foreground/70">
          Bug classes surfaced first in your challenge browser.
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const selected = interests.includes(cat);
            return (
              <button
                aria-pressed={selected}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-[12px] transition-colors"
                key={cat}
                onClick={() => toggleInterest(cat)}
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
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                {cfg.label}
                {Boolean(selected) && <Check className="ms-auto" size={12} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      <div className="mt-7 flex items-center gap-3 border-border border-t pt-5">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-[13px] text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={hasErrors}
          onClick={onSave}
          type="button"
        >
          {saved ? <Check size={14} /> : null}
          {saved ? "Saved" : "Save changes"}
        </button>
        {Boolean(saved) && (
          <span className="flex items-center gap-1 text-[12px] text-emerald-400">
            <CheckCircle2 size={13} /> Profile updated.
          </span>
        )}
        {Boolean(hasErrors) && (
          <span className="text-[12px] text-muted-foreground/70">
            Fix the highlighted fields to save.
          </span>
        )}
      </div>
    </section>
  );
}
