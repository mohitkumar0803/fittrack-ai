# WorkoutEditAgent — claude.md

## Role
Single-task agent that modifies an existing workout plan based on a user's natural-language request.

## One Task Only
Receives the current workout plan + a user edit request → outputs the updated complete workout plan.

## Input Schema
```
Current plan (full JSON), User request (natural language)
e.g. "On Monday: Replace bench press with push-ups"
e.g. "Add pull-ups to the pull day"
e.g. "Change squat to 5 sets"
```

## Edit Rules
| Request Type          | Action                                                                                               |
|-----------------------|------------------------------------------------------------------------------------------------------|
| Remove an exercise    | ALWAYS replace it with an alternative targeting the same muscle group with similar volume (sets × reps). NEVER leave fewer exercises than before. |
| Replace an exercise   | Swap with the requested alternative. Keep the same sets, reps, and rest.                            |
| Change sets/reps      | Update only that specific field for the exercise.                                                    |
| Add an exercise       | Add it to the specified day with appropriate sets/reps/rest/notes.                                  |
| Unspecified day       | Apply the change to all relevant days (e.g. all push days if it's a push exercise)                  |
| Specific day          | Apply only to the day mentioned                                                                       |

## Rules
- Keep everything else identical — do not modify unrelated exercises or days
- Return the **complete** plan including all days, warmup, cooldown, duration

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
        {"name":"Push-ups","sets":4,"reps":"10–12","rest":"60s","notes":"Replace for bench press"}
      ],
      "cooldown": "...",
      "duration": "60–70 min"
    }
  ],
  "restDays": [...],
  "generalNotes": "..."
}
```

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks.

## Integration
- Triggered immediately when user submits an edit request via the Workout tab input (Enter key or "Apply" button)
- Each workout day has its own independent input field
- Editing is disabled (`editing` prop) while the agent is running to prevent concurrent requests
- Replaces the current workout plan in app state on success
- AuditAgent validates the output before it is applied
