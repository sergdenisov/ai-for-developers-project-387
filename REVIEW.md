# Review criteria

The independent reviewer (`.github/workflows/opencode-review.yml`) reads this file with every pull request; a person
reviewing by hand uses it too. `AGENTS.md` holds the rules of the code; this file says what a review hunts for and how
it reports.

## Scope

- Read the PR description first. It links the request, the spec, the tickets and the person's approval of the scope
  (the request's comment). Read them with `gh issue view`. A missing or unreadable link is a finding: the reviewer
  cannot compare the change with what was agreed.
- Compare the change with the spec and the tickets it closes: each acceptance criterion of a closed ticket is met, and
  nothing outside the agreed scope (its Out of Scope section, behaviour nobody approved) slipped in.
- Read the earlier review comments of the PR. Do not repeat a finding a person already resolved or rejected; check
  that the new commits fix what was confirmed and do not break the behaviour around it.

## What breaks the calendar

Each item is a defect class that has real consequences for the Owner or a Guest.

- **A taken Slot is bookable again.** Two Bookings must never overlap, whatever their Event Types. `book` in
  `backend/src/bookings.ts` checks the Slot and inserts the Booking in one synchronous step; an `await` between them,
  or a check that reads another copy of the store, lets two simultaneous requests book the same time.
- **A Free Slot that is not free, or a free one that is missing.** Working Hours, the Slot Grid, the Booking Window and
  the end of a call in progress live in `backend/src/slots.ts` as pure functions of `now`. Code that reads the clock
  directly, or computes Slots elsewhere, makes Free Slots and Upcoming Bookings disagree with the tests and with each
  other.
- **A time in the wrong zone.** Every moment the API returns is in the Owner Time Zone, `+03:00`, whole seconds
  (`formatOwnerInstant`); the UI shows it as Moscow time whatever the browser's zone.
- **A response the contract does not declare.** The contract in `spec/main.tsp` is the source; the generated
  `spec/openapi.yaml`, backend types and frontend SDK change only through `mise run generate`. A new field, status or
  error code that is not in the contract is a finding, and so is a hand-edited generated file.
- **An error in another shape.** Errors are `ApiError { code, message, fields? }`, declared per operation; a field
  error carries the field in `fields`.
- **Guest text rendered as markup.** Text a Guest types (name, email, a note) is shown as text, never as HTML.
- **A browser scenario that depends on luck.** Scenarios talk to the real server, create Event Types with unique names
  and ids, never assume an empty list and pick their day from the calendar.
- **A test that cannot fail.** A test for a new rule must fail without that rule: check that the assertion would
  catch the behaviour missing or broken, not only that it passes now.
- **Agent workflow permissions.** A change to `.github/workflows/` that widens a token's permissions, exposes a
  secret to code from a fork, or calls the model before the trusted-author and budget checks needs a separate decision
  of a person. Name it as such.

## Depth by risk

Choose how deep to check by what an error would cost, not by the number of changed lines.

| Change                                   | Check before merge                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Text or layout only (a label, a caption) | It matches the task's wording and shows in the UI                                     |
| Booking data or validation               | The spec's main, negative and neighbouring scenarios; the contract chain              |
| Free Slots, overlaps, time zones         | Main scenario, overlapping Bookings, neighbouring cases at the edges of hours and days |
| GitHub Actions permissions and secrets   | Who gets access to code and secrets; a separate decision of a person                  |

## How to report

- One finding per defect: **file and line**, **the condition** under which it goes wrong, and **the consequence** for
  the Owner, the Guest or the project. Mark how sure you are: confirmed (you traced the code path or a test shows it)
  or possible.
- Formatting, import order and anything else a linter reports are not findings: `mise run check` runs the linters.
- When no confirmed defect remains, say so plainly: «Подтверждённых дефектов не найдено». Do not invent a finding to
  have one.
- End with the CI state of the reviewed SHA: which checks passed, failed or were still running.
- Write the review in Russian, like the rest of the project's discussion.
