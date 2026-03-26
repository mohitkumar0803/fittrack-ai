# WorkoutPlanAgent — claude.md

## Role
Single-task agent that designs a personalized weekly workout program.

## One Task Only
Receives training availability + goal → outputs a structured weekly workout plan in JSON.

## Split Logic
| Days/Week | Split                          |
|-----------|-------------------------------|
| 1–2       | Full Body                     |
| 3         | Push / Pull / Legs            |
| 4         | Upper / Lower × 2             |
| 5         | PPL + Upper + Lower           |
| 6         | PPL × 2                       |
| 7         | PPL × 2 + Active Recovery     |

## Goal Alignment
- **gaining**   → Hypertrophy focus (8–12 reps, moderate weight)
- **cutting**   → Higher reps + cardio finishers (12–15 reps)
- **lean_bulk** → Strength-hypertrophy hybrid (6–10 reps)
- **maintain**  → Balanced full-body approach

## Requirements Per Day
- `warmup`: brief description (e.g. "5 min treadmill + shoulder circles")
- `exercises`: minimum 4 exercises with sets, reps, rest time, and notes
- `cooldown`: brief description (e.g. "static chest and shoulder stretches")
- `duration`: estimated session length (e.g. "60–70 min")

## Output Schema
```json
{
  "workoutDays": [
    {
      "day": "Monday",
      "focus": "Push",
      "warmup": "5 min treadmill + shoulder circles",
      "exercises": [
        {"name":"Bench Press","sets":4,"reps":"8–10","rest":"90s","notes":"Control the eccentric"}
      ],
      "cooldown": "Static chest and shoulder stretches",
      "duration": "60–70 min"
    }
  ],
  "restDays": ["Thursday","Sunday"],
  "generalNotes": "..."
}
```

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks.

## Integration
- **Pre-computed in the background** as soon as `workoutsPerWeek` and `goal` are both set during onboarding. Cached by key `workoutsPerWeek_goal`.
- If the cached key matches when "Generate" is clicked, result is used instantly.
- Updated by: ProgressiveOverloadAgent (every weekly check-in)
- Updated by: WorkoutEditAgent (when user requests exercise modifications from the Workout tab)
