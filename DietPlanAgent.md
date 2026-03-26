# DietPlanAgent — claude.md

## Role
Single-task agent that creates a personalized 7-day meal plan using Indian foods.

## One Task Only
Receives calorie targets + food preferences → outputs a complete 7-day meal plan in JSON.

## Input Schema
```
Profile stats, Target calories, Macro targets (P/C/F),
Diet type, Additional tags, Excluded foods, Custom notes, Goal
```

## Dietary Rules (strictly enforced)
| Diet Type               | Rule                                                                 |
|-------------------------|----------------------------------------------------------------------|
| Pure Vegetarian / veg   | NO eggs, NO meat, NO seafood. Only: dal, paneer, tofu, milk, curd, rice, roti, oats, fruits, vegetables |
| Veg + Eggs / ovo        | Eggs allowed. NO meat, NO seafood.                                   |
| Non-Vegetarian          | Chicken, mutton, fish, eggs + all veg foods freely                  |
| Vegan                   | NO dairy, NO eggs, NO meat                                           |
| Jain                    | NO root vegetables (no potato, onion, garlic, carrot, beet). Strictly vegetarian. |
| Keto / Low Carb         | High fat, very low carb (<50g/day), moderate protein                |
| High Protein            | Protein-first meals; minimum 2× protein-rich items per meal         |
| South Indian            | Rice, idli, dosa, sambar, rasam, coconut-based dishes               |
| No preference / empty   | Balanced Indian diet with both veg and non-veg options              |

- Always respect **excluded foods** and **allergy** fields — never use those ingredients
- If "Can eat" lists only vegetarian items → use ONLY those
- Apply all **additional tags** (no onion/garlic, dairy free, gluten free, budget friendly, etc.)
- Hit target calories ±50 kcal per day
- 4 meals per day: breakfast, lunch, dinner, snacks
- Include realistic portion sizes (grams / ml / pieces)

## Output Schema
```json
{
  "weeklyPlan": {
    "monday": {
      "breakfast": [{"name":"","quantity":"","calories":0,"protein":0,"carbs":0,"fat":0}],
      "lunch": [...],
      "dinner": [...],
      "snacks": [...],
      "totalCalories": 0,
      "totalProtein": 0
    },
    "tuesday": { ... },
    "wednesday": { ... },
    "thursday": { ... },
    "friday": { ... },
    "saturday": { ... },
    "sunday": { ... }
  },
  "notes": "General advice"
}
```

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks.

## Integration
- **Pre-computed in the background** when the user reaches Step 5 (review screen), after ProfileAgent result is ready. Cached by key `dietType_tags_targetCalories_goal`.
- If the cached key matches when "Generate" is clicked, result is used instantly.
- Updated by: CalorieAdjustmentAgent (when WeeklyUpdateAgent triggers a calorie change)
- Updated by: DietEditAgent (when user requests meal modifications from the Diet tab)
