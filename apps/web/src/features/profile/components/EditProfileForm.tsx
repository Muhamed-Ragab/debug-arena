import { useMemo, useState } from "react";
import {
  User,
  AtSign,
  FileText,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react";
import type { Category } from "../../../lib/types";
import { CATEGORY_CONFIG, CATEGORY_ORDER } from "../../../lib/categories";
import {
  PROFILE_DEFAULT,
  TAKEN_HANDLES,
  AVATAR_PRESETS,
} from "../data/settings";

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const MAX_NAME = 50;
const MAX_BIO = 160;
const HANDLE_RE = /^[a-z0-9_]+$/i;

export default function EditProfileForm() {
  const [displayName, setDisplayName] = useState(PROFILE_DEFAULT.displayName);
  const [handle, setHandle] = useState(PROFILE_DEFAULT.handle);
  const [bio, setBio] = useState(PROFILE_DEFAULT.bio);
  const [avatarColor, setAvatarColor] = useState(PROFILE_DEFAULT.avatarColor);
  const [interests, setInterests] = useState<Category[]>(PROFILE_DEFAULT.interests);
  const [saved, setSaved] = useState(false);

  const nameError = useMemo(() => {
    const v = displayName.trim();
    if (v.length === 0) return "Display name is required.";
    if (v.length > MAX_NAME) return `Display name must be ${MAX_NAME} characters or fewer.`;
    return null;
  }, [displayName]);

  const handleError = useMemo(() => {
    const v = handle.trim();
    if (v.length === 0) return "Handle is required.";
    if (v.length < 3) return "Handle must be at least 3 characters.";
    if (v.length > 20) return "Handle must be 20 characters or fewer.";
    if (!HANDLE_RE.test(v)) return "Use letters, numbers, and underscores only.";
    if (TAKEN_HANDLES.has(v.toLowerCase())) return "That handle is already taken.";
    return null;
  }, [handle]);

  const bioError = useMemo(
    () => (bio.length > MAX_BIO ? `Bio must be ${MAX_BIO} characters or fewer.` : null),
    [bio],
  );

  const handleChanged =
    handle.trim().toLowerCase() !== PROFILE_DEFAULT.handle.toLowerCase();
  const handleAvailable = !handleError && handleChanged;

  const hasErrors = Boolean(nameError || handleError || bioError);

  const toggleInterest = (cat: Category) => {
    setInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const onSave = () => {
    if (hasErrors) return;
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-heading">Profile</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            How you appear across Debug Arena. Changes are visible to other engineers.
          </p>
        </div>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
          style={{ backgroundColor: avatarColor }}
          aria-hidden
        >
          {initials(displayName)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Display name */}
        <div>
          <label htmlFor="displayName" className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Display name
          </label>
          <div className="relative">
            <User
              size={15}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={MAX_NAME + 10}
              className="w-full rounded-md border border-border bg-inset py-2 ps-9 pe-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              placeholder="Your name"
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            {nameError ? (
              <span className="flex items-center gap-1 text-[12px] text-danger-soft">
                <AlertCircle size={12} /> {nameError}
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground/70">Public-facing name.</span>
            )}
            <span className="text-[11px] tabular-nums text-muted-foreground/60">
              {displayName.length}/{MAX_NAME}
            </span>
          </div>
        </div>

        {/* Handle */}
        <div>
          <label htmlFor="handle" className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
            Username / handle
          </label>
          <div className="relative">
            <AtSign
              size={15}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full rounded-md border border-border bg-inset py-2 ps-9 pe-3 font-mono text-[13px] text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              placeholder="handle"
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            {handleError ? (
              <span className="flex items-center gap-1 text-[12px] text-danger-soft">
                <AlertCircle size={12} /> {handleError}
              </span>
            ) : handleAvailable ? (
              <span className="flex items-center gap-1 text-[12px] text-success">
                <CheckCircle2 size={12} /> Available
              </span>
            ) : (
              <span className="text-[12px] text-muted-foreground/70">No change.</span>
            )}
            <span className="text-[11px] text-muted-foreground/60">@debug.arena/{handle || "…"}</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="mt-5">
        <label htmlFor="bio" className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
          Bio / tagline
        </label>
        <div className="relative">
          <FileText
            size={15}
            className="pointer-events-none absolute start-3 top-3 text-muted-foreground"
          />
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={MAX_BIO + 20}
            className="w-full resize-none rounded-md border border-border bg-inset py-2 ps-9 pe-3 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder="One line about you."
          />
        </div>
        <div className="mt-1 flex items-center justify-between">
          {bioError ? (
            <span className="flex items-center gap-1 text-[12px] text-danger-soft">
              <AlertCircle size={12} /> {bioError}
            </span>
          ) : (
            <span className="text-[12px] text-muted-foreground/70">Shown on your profile.</span>
          )}
          <span className="text-[11px] tabular-nums text-muted-foreground/60">
            {bio.length}/{MAX_BIO}
          </span>
        </div>
      </div>

      {/* Avatar picker */}
      <div className="mt-6">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <Camera size={13} /> Avatar
        </p>
        <div className="flex flex-wrap gap-2.5">
          {AVATAR_PRESETS.map((preset) => {
            const selected = preset.color === avatarColor;
            return (
              <button
                key={preset.id}
                type="button"
                aria-label={`Select ${preset.id} avatar`}
                aria-pressed={selected}
                onClick={() => setAvatarColor(preset.color)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white transition-all ${
                  selected ? "ring-2 ring-offset-2 ring-offset-card" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: preset.color,
                  // @ts-expect-error CSS custom prop for ring color
                  "--tw-ring-color": preset.color,
                }}
              >
                {selected ? <Check size={15} /> : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category interests */}
      <div className="mt-6">
        <p className="mb-1 text-[12px] font-medium text-muted-foreground">
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
                key={cat}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleInterest(cat)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors"
                style={
                  selected
                    ? { backgroundColor: `${cfg.color}1a`, borderColor: `${cfg.color}55`, color: cfg.color }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                }
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                {cfg.label}
                {selected && <Check size={12} className="ms-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
        <button
          type="button"
          onClick={onSave}
          disabled={hasErrors}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved ? <Check size={14} /> : null}
          {saved ? "Saved" : "Save changes"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-[12px] text-success">
            <CheckCircle2 size={13} /> Profile updated.
          </span>
        )}
        {hasErrors && (
          <span className="text-[12px] text-muted-foreground/70">
            Fix the highlighted fields to save.
          </span>
        )}
      </div>
    </section>
  );
}
