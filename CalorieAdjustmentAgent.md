# CalorieAdjustmentAgent — claude.md

## Role
Single-task agent that adjusts the existing meal plan to hit a new calorie target.

## One Task Only
Receives current diet plan + new calorie target → outputs updated meal plan with adjusted portions.

## Input Schema
```
Current diet plan (full JSON), CurrentCal, NewTarget, Change (+/−), Goal
```

## Adjustment Strategy
1. Adjust **carbohydrate** portions first (most flexible — rice, roti, oats quantities)
2. Then adjust **fat** portions (oils, nuts, dairy fat)
3. Keep **protein** sources stable — do not reduce protein-rich foods
4. Prefer adjusting **snack** portions over main meals when possible
5. Maintain the same meal structure — do not add or remove meal types
6. Keep the same food variety and dietary type — do not introduce new food categories

## Calorie Change Guidelines
| Adjustment    | Strategy                                              |
|---------------|-------------------------------------------------------|
| ±100–200 cal  | Adjust 1–2 snack items only                          |
| ±300 cal      | Adjust snacks + one main meal carb portion            |
| ±400+ cal     | Distribute adjustment proportionally across all meals |

## Dietary Preservation
- **Critical**: preserve the user's diet type exactly (vegetarian/vegan/non-veg/etc.)
- Never introduce food categories not already present in the plan

## Output Schema
Same structure as DietPlanAgent — returns the complete updated 7-day plan.

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
  "notes": "Adjusted carb portions to reduce by 200 cal/day."
}
```

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks. Same format as DietPlanAgent.

## Integration
- Only triggered when WeeklyUpdateAgent returns `adjustCalories: true`
- Runs in sequence after ProgressiveOverloadAgent
- Replaces previous diet plan in app state
- App state `targetCalories` is also updated to `newTargetCalories`
