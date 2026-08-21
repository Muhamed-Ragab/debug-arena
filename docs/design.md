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

## 4. Visual Direction
- Dark, developer-tool-adjacent theme by default (matches the audience's existing tools — VS Code, terminal), with a light mode toggle.
- Category color-coding used consistently across browser, challenge screen tags, and stats charts — one color per category, never reused for anything else.
- Avoid gamification kitsch (badges/confetti) beyond a subtle streak counter and score reveal animation — keep the tone closer to "engineering tool" than "consumer game," matching the audience's taste.

## 5. Open Design Questions
- Whether localization step should be click-to-select-line (lower friction, more guessable) or free-text function name (higher signal, more friction) — worth A/B testing once there's traffic.
- How much of the canonical fix to reveal on a wrong answer before letting the user retry vs. moving on.
