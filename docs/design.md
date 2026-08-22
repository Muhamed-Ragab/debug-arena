# Design — Debug Arena (working title)

## 1. Design Principles
- **The explanation is the product.** Every screen should make writing a good root-cause explanation feel like the main event, not an afterthought bolted onto a code-fix exercise.
- **Feel like an incident, not a quiz.** Framing ("a customer reported...", "on-call paged you at 2am...") over dry "Question 4 of 10" framing.
- **Progressive disclosure of hints.** Hints cost points — the UI should make that trade-off visible before the user asks for one, not after.

## 2. Core User Flow

1. **Challenge browser** — grid/list of challenges, filterable by category (React rendering, backend concurrency, etc.) and difficulty. Each card shows category tag, difficulty badge, and a one-line scenario teaser (no spoilers).
2. **Challenge screen** — three-panel layout:
   - Left: scenario prompt + (for code_snippet format) file tree
   - Center: code viewer with line-click-to-annotate for the localization step
   - Right: tabbed panel — "Explain" (root cause textarea), "Fix" (diff editor), "Hints" (collapsed by default, shows point cost before reveal)
3. **Submit** — single submit action bundles localization + explanation + fix. Loading state while sandboxed test run + grading agent complete (a few seconds — show a lightweight "running your fix against hidden tests..." indicator).
4. **Results screen** — score broken into four visible components (localization / root cause / fix / prevention bonus), with the canonical root-cause summary revealed alongside the user's own explanation for direct comparison — this comparison is the main learning moment, more important than the score itself.
5. **Profile / stats page** — per-category radar or bar chart showing weak spots, streak tracker, rank on leaderboard.

## 3. Key Screen Notes

### Challenge screen
- Keep the "Explain" textarea prominent — same visual weight as the code/diff editor, not a small afterthought field.
- Hint button shows the point penalty inline: "Reveal hint (−10 pts)" rather than hiding the cost until after reveal.
- "On-call mode" challenges (later phase) hide the file tree/code entirely and show only a log/metrics panel — visually distinct dark "terminal" theme to reinforce the different mental mode.

### Results screen
- Side-by-side diff of user explanation vs. canonical root-cause summary, with the grading agent's short feedback annotated between them (not just a bare score).
- Explicit "what would prevent this bug class" section, expandable, shown regardless of whether the user attempted the optional prevention step — always teach it.

### Leaderboard
- Split into "This week" and "All-time" — weekly resets keep it approachable for newer users rather than always showing the same top 10.
- Per-category leaderboards in addition to overall, since a user might be a rendering-bug specialist and never top the concurrency board.

### Landing Page
Marketing surface for the "LeetCode for debugging" positioning. Same dark dev-tool aesthetic as the app — no consumer-marketing pastels, no stock-photo hero. The page should feel like it belongs to the same product the user logs into.

- **Hero**
  - Full-bleed dark canvas with a subtle terminal/scanline texture (low-opacity monospace grid or faint `>` prompt motif) — reinforces "this is a tool, not a course."
  - Headline: short, declarative, e.g. *"Debug like it's 2am on call."* or *"Stop guessing. Start diagnosing."* — never "Welcome to our platform."
  - Sub-headline states the value prop in one line: **"LeetCode for debugging — practice root-cause diagnosis on real-world bugs, not toy algorithms."**
  - A small, live-looking code/stack-trace snippet in the hero (syntax-highlighted, monospace) to signal the actual product surface immediately. Keep it static or lightly animated (typing caret), not a heavy demo.

- **Value prop ("LeetCode for debugging")**
  - Three or four compact feature blocks contrasting with algorithm practice:
    1. *Real bug classes* — React rendering, backend concurrency, singletons, race conditions.
    2. *Explain the root cause* — the graded deliverable is the diagnosis, not a passing test.
    3. *Hidden tests + grading agent* — your fix runs against hidden tests, then an agent grades the explanation.
    4. *Weak-spot analytics* — per-category radar shows where you keep getting paged.
  - Use the same category color-coding as the app (one color per category) so the marketing page and product feel continuous.

- **CTAs**
  - Primary: "Start a challenge" (links to challenge browser) — high-contrast accent button, same component as in-app primary actions.
  - Secondary: "See how grading works" (links to a results-screen explainer / sample challenge) — ghost/outline button.
  - One CTA above the fold and one repeated after the value-prop block; avoid CTA spam — two max per viewport.

- **Social proof**
  - Understated, engineering-credible, not testimonial-carousel kitsch: a row of "trusted by engineers at" wordmarks (text, monospace, muted) OR a compact stat strip ("12k bugs diagnosed", "4 bug classes", "hidden-test grading").
  - Optional: a single pull-quote from a recognizable eng handle, set in the same type as in-app copy, no quotation-mark decoration.
  - Keep social proof muted (low contrast, small) so it reads as credibility, not a sales push — consistent with the "engineering tool" tone.

### Profile Settings
Advanced account management surface (distinct from the read-only stats/profile page). Dark dev-tool aesthetic consistent with the rest of the app; forms use the same input/button primitives as in-app settings.

- **Managing multiple sessions**
  - "Active sessions" list showing device/browser, approximate location (IP-derived, coarse), and last-active time for each logged-in session.
  - Per-session "Revoke" action; a "Revoke all other sessions" bulk action at the top.
  - New-login events surface here (and optionally notify) so users can spot unexpected sessions — security-first, no gamification.

- **Linking OAuth accounts**
  - "Connected accounts" section listing providers (GitHub, Google, etc.) with connected/disconnected state.
  - Allow linking multiple providers to one account; show which provider is the current sign-in method and which is primary for avatar/name.
  - Unlinking a provider must require a password/secondary factor fallback if it's the only credential — never let an unlink orphan the account (block with inline guidance).

- **Editing profile info**
  - Editable fields: display name, username/handle (with availability check), avatar (upload or pick from a small set), and a short bio/tagline.
  - Category-interest selection (which bug classes to surface in the browser) reuses the same category color tokens.
  - Save state shows inline validation (handle taken, name too long) using the app's existing form-error styling — no separate "marketing" form look.
  - Danger zone (separate, muted-red section): delete account with explicit confirmation step.

## 4. Visual Direction
- Dark, developer-tool-adjacent theme by default (matches the audience's existing tools — VS Code, terminal), with a light mode toggle.
- Category color-coding used consistently across browser, challenge screen tags, and stats charts — one color per category, never reused for anything else.
- Avoid gamification kitsch (badges/confetti) beyond a subtle streak counter and score reveal animation — keep the tone closer to "engineering tool" than "consumer game," matching the audience's taste.

## 5. Open Design Questions
- Whether localization step should be click-to-select-line (lower friction, more guessable) or free-text function name (higher signal, more friction) — worth A/B testing once there's traffic.
- How much of the canonical fix to reveal on a wrong answer before letting the user retry vs. moving on.
