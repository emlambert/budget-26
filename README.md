# The Household Ledger — budget-26

A personal budgeting, forecasting, and investment-tracking web app for Emily, hosted free on GitHub Pages. No backend — `data.json` is the entire database, and the site is just static HTML/CSS/JS reading it.

**Live site:** https://emlambert.github.io/budget-26/
**For Claude in a new chat:** read this whole file before making changes. It's written so a fresh session has everything it needs without re-explaining context in the prompt.

---

## How to make an edit (for Claude)

You have no GitHub connector/integration — access is via a Personal Access Token Emily pastes into chat, used with `bash_tool` and plain git.

1. Ask Emily for a token if you don't have a confirmed-working one in this session.
2. **Verify it before trusting it** — a fine-grained token previously showed `push: true` on the repo permissions API even though the token itself was read-only. That field reflects Emily's own account rights, not the token's actual scope. Always do a real write test first:
   ```
   curl -s -X PUT -H "Authorization: Bearer TOKEN" -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/emlambert/budget-26/contents/test-permission-check.txt \
     -d '{"message":"verify token","content":"dGVzdA=="}'
   ```
   Look for a `commit` key in the response, not just a 200. Delete the test file after.
3. Clone with the token embedded in the URL (never write it into a committed file):
   ```
   git clone https://x-access-token:TOKEN@github.com/emlambert/budget-26.git repo
   cd repo && git config user.email "budget-bot@local" && git config user.name "Emily's Budget Assistant"
   ```
4. Edit files. Validate before pushing:
   - `python3 -m json.tool data.json > /dev/null` — must not error
   - Sanity-check any changed calculation logic with a quick `node -e "..."` before trusting it
5. `git add -A && git commit -m "..." && git push origin main`
6. Confirm the deploy actually went live (pushing isn't the same as deployed):
   ```
   curl -s -H "Authorization: Bearer TOKEN" -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/emlambert/budget-26/pages/builds/latest
   ```
   Poll until `"status": "built"` — takes roughly 30-60 seconds after push.
7. **Emily also edits `data.json` directly on GitHub's web UI sometimes** — for simple balance/number updates she doesn't need Claude for this. Don't assume you're the only writer; always re-check current file state (`git log --oneline -10`, `git show <hash> -- data.json`) before editing, in case she's made changes in a session you don't have visibility into.

---

## File structure

```
index.html          Page shell — 5 tabs (Overview, Commitments, Allocation, Investments, Forecast)
style.css            "Household ledger" design system (see below)
data.json            All data — the only thing that changes on a normal update
js/
  utils.js           GBP/PCT formatters, date math, fundType() derivation
  computeFunds.js     Per-fund calculations (still-needed, monthly contribution, status) + totals
  forecast.js         24-month projection: sinking funds, emergency/Fund C waterfall, lifestyle plan, investments
  dashboard.js        Overview page: stat cards + the dahlia bloom indicator
  sinkingFunds.js      Sinking funds table
  allocation.js        Monthly savings allocation + emergency floor warning
  annualPlan.js        Annual lifestyle spending categories (editable in-browser)
  categoryCeilings.js  Yearly spending caps with pool breakdown
  investments.js        Investment portfolio + compound growth projection
  charts.js            All Chart.js rendering (pie, tracker, forecast)
  router.js            Hash-based page navigation (#overview, #commitments, etc.)
  main.js              Orchestrator — fetches data.json, calls every render function
```

No build step. Plain ES modules (`<script type="module">`), Chart.js loaded from cdnjs with a jsDelivr fallback if that's blocked.

---

## Data model (`data.json`)

- **`takeHome`** — Emily's monthly take-home, solo income. Student loan is already deducted before this figure.
- **`budgetItems`** — `[{name, type: "Spending"|"Savings", amount, notes}]`. `Bills` (£830) is Emily's *share* of joint costs with her partner Louis — **the mortgage is already folded into this line**, do not add it separately.
- **`sinkingFunds`** — `[{name, category, notes, target, targetDate, balance, role?}]`
  - `category` is one of `Trip | Occasion | Buffer | Long-term`
  - `role` is only set on two funds: `"emergency"` and `"secondary-reserve"` — the forecast logic looks these up by role, **not by name**. This was deliberately added after a rename broke name-matching; never revert to matching on `name`.
- **`annualSpendingPlan`** — `[{category, annualAmount, notes}]`. Recurring yearly lifestyle categories (weekend trips, Christmas, birthdays, garden, wardrobe, days out, the cat). Editable directly in the browser (changes are client-side only, not saved back to the repo — ask Claude to commit anything meaningful).
- **`categoryCeilings`** — `[{name, ceilingPerYear, sinkingFundNames: [...], annualPlanCategories: [...]}]`. A yearly cap that sums matching items from *both* sinking funds and the annual plan, with a full breakdown of which pot contributes what. This is how double-counting between "named trip" and "generic holiday budget" gets resolved — see Design Decisions below.
- **`monthlySavingsAllocation`** — `{emergencyFloor, babyMonthly, carMonthly}`. `emergencyFloor` is a protected minimum that must reach the Emergency fund even in a heavy-spending month.
- **`investments`** — `{platform, accountType, portfolioName, monthlyContribution, expectedAnnualReturnPct, asOf, holdings: [{name, ticker, value, targetAllocationPct}]}`. Real InvestEngine ISA portfolio.
- **`savingsTracker`** — quarterly real-balance log, currently empty (fresh start as of Aug 2026 — see note below).
- **`savingsTrackerNote`** — displayed note about the Monzo CSV/screenshot upload workflow for filling in the tracker.

---

## Design decisions — don't relitigate these without reason

- **Fund Type (Spending vs Growth) is *derived*, not stored.** `Trip`/`Occasion` → Spending, `Buffer`/`Long-term` → Growth. See `fundType()` in `utils.js`.
- **"True growth savings rate"** = headline savings rate minus money already committed to Spending-type sinking funds *and* the annual lifestyle plan. This is the honest number — the headline rate alone overstates real "growth" because it includes money already earmarked to be spent on trips/weddings.
- **The Considering/what-if feature was removed entirely** at Emily's request (she didn't like it). Don't re-add it.
- **Category ceilings exist to prevent double-counting.** Example: "Big holiday(s) abroad" in the annual plan was zeroed out because named Sinking Fund trip pots already cover that spending — counting both would overstate committed spend. If you add a new recurring category that overlaps a named pot, either zero one of them out or add a ceiling that nets them against each other, the same way.
- **Forecast chart (24 months)** has 5 lines: net worth (bold, = everything combined), total sinking funds (sawtooth — dips to zero on a pot's target date, simulating the money being spent), growth-only (Emergency + Fund C + Car — never dips), annual lifestyle plan (builds up, resets every 12 months), investments (compounding via the assumed return rate).
- **Investment return assumption is conservative (~6.5%), not Emily's actual recent gains.** Her portfolio has had a short, unrepresentative hot streak — using that as a forward assumption would be misleading. Always caveat forecasts as planning estimates, not predictions or advice — Claude isn't a financial advisor.
- **Target allocation % on holdings drifts over time as contributions get added unevenly** (e.g. lump sums into one fund) — this is expected and not something that needs "fixing" or flagging as a problem each time.

---

## Design system

- **Colors:** ink `#1B3A34`, paper/background `#EEF1EA`, gold accent `#A97F2E`, terracotta warning `#B5533C`, growth green `#4C7A5E`
- **Fonts:** Fraunces (display headers), IBM Plex Sans (body), IBM Plex Mono (all numbers — tabular alignment matters for a finance tool)
- **Signature element:** a dahlia bloom SVG on the Overview page whose petals fill in proportionally to the true growth savings rate — a deliberate personal touch, not decoration to remove.

---

## Privacy — important

The repo is public and Emily is fine with that for financial figures generally, **with one exception**: one sinking fund is deliberately named **"Fund C"** with scrubbed, non-identifying notes. It was originally a baby/family-planning fund. **Do not restore that name or add identifying details back**, even if it seems more "complete" or helpful to do so — this was an explicit, considered request, not an oversight.

---

## Preferences for how Claude should work on this

- Concise, mobile-friendly responses — Emily mostly uses this from her phone.
- Confirm before making judgment calls on real money amounts where the right answer genuinely isn't obvious (e.g. how to split an unallocated sum) — but once she says "use your judgment," make a clear, reasoned call and state it plainly rather than asking again.
- Prefer thinking through financial/design decisions together over silently changing things.
