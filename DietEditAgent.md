# DietEditAgent — claude.md

## Role
Single-task agent that modifies an existing 7-day meal plan based on a user's natural-language request.

## One Task Only
Receives the current diet plan + a user edit request → outputs the updated complete 7-day plan.

## Input Schema
```
Current plan (full JSON), User request (natural language)
e.g. "On Monday, in breakfast: Replace oats with upma"
e.g. "Replace paneer with tofu throughout the week"
e.g. "Add banana to snacks every day"
```

## Edit Rules
| Request Type       | Action                                                                                         |
|--------------------|-----------------------------------------------------------------------------------------------|
| Remove a food      | ALWAYS replace it with a nutritionally similar alternative (same calories ±30, same macro profile). NEVER leave fewer items than before. |
| Replace a food     | Swap with the requested alternative. Adjust quantity to match the original calories.           |
| Add a food         | Add it to the specified meal. Recalculate totalCalories and totalProtein for affected days.   |
| Unspecified day    | Apply the change to ALL 7 days                                                                 |
| Specific day       | Apply only to the day mentioned                                                                |

## Dietary Preservation
- **Critical**: preserve the existing dietary type exactly (vegetarian/vegan/non-veg/etc.)
- Never introduce food categories not already present in the plan (e.g. don't add chicken to a veg plan)

## Output Schema
Same structure as DietPlanAgent — returns the complete updated 7-day plan with all 7 days intact.

```json
{
  "weeklyPlan": {
    "monday": {
      "breakfast": [...],
      "lunch": [...],
      "dinner": [...],
      "snacks": [...],
      "totalCalories": 0,
      "totalProtein": 0
    },
    ...all 7 days...
  },
  "notes": "..."
}
```

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks.

## Integration
- Triggered immediately when user submits an edit request via the Diet tab input (Enter key or "Apply" button)
- Each meal section has its own independent input field per day
- Editing is disabled (`editing` prop) while the agent is running to prevent concurrent requests
- Replaces the current diet plan in app state on success
- AuditAgent validates the output before it is applied
