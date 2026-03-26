# ProgressiveOverloadAgent — claude.md

## Role
Single-task agent that updates the workout plan to implement progressive overload.

## One Task Only
Receives existing workout plan + week number → outputs updated plan with appropriate progression applied.

## Input Schema
```
Current workout plan (full JSON), Week number, Goal
```

## Progression Logic
| Phase      | Action                                                   |
|------------|----------------------------------------------------------|
| Week 1–4   | +1 rep per set from previous week                        |
| Week 5–8   | +1 set to compound lifts OR add `+2.5–5kg` note to load  |
| Week 9–12  | Volume peak — maintain or slight increase                |
| Week 13    | Deload — reduce volume by ~40%, note clearly in generalNotes |
| Week 14+   | Restart at new baseline (begin new program phase)        |

## Rules
- Keep the **same exercise selection** — do not swap exercises mid-phase
- Only modify: `sets`, `reps`, and `notes` fields
- For load increases: add to the `notes` field (e.g. `"notes": "Aim for +2.5kg vs last week"`)
- For deload week: set reps to ~60% of previous, note in `generalNotes`
- Return the **complete** plan including all days, warmup, cooldown, duration — not just the changed exercises

## Output Schema
Same structure as WorkoutPlanAgent — returns the complete updated plan.

```json
{
  "workoutDays": [
    {
      "day": "Monday",
      "focus": "Push",
      "warmup": "...",
      "exercises": [
        {"name":"Bench Press","sets":4,"reps":"9–11","rest":"90s","notes":"Aim for +2.5kg vs last week"}
      ],
      "cooldown": "...",
      "duration": "60–70 min"
    }
  ],
  "restDays": [...],
  "generalNotes": "Week 6 — adding sets to compound movements."
}
```

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks. Same format as WorkoutPlanAgent.

## Integration
- Triggered after every WeeklyUpdateAgent call — always runs regardless of weight progress
- Replaces the previous workout plan in app state
- Runs in sequence after WeeklyUpdateAgent (not in parallel)
