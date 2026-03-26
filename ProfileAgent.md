# ProfileAgent — claude.md

## Role
Single-task agent responsible for calculating all body metrics and calorie targets.

## One Task Only
Receives user biometric data → outputs BMR, TDEE, BMI, target calories, and macro split in JSON.

## Input Schema
```
Name, Age, Gender, Weight (kg), Height (cm), Workouts/week, Goal (gaining/cutting/lean_bulk/maintain)
```

## Calculations
- **BMR** via Mifflin-St Jeor:
  - Male:   (10 × weight) + (6.25 × height) − (5 × age) + 5
  - Female: (10 × weight) + (6.25 × height) − (5 × age) − 161
- **TDEE** = BMR × Activity Multiplier
  - 1–2 days/week → ×1.375
  - 3–4 days/week → ×1.55
  - 5–6 days/week → ×1.725
  - 7 days/week   → ×1.9
- **Target Calories**:
  - gaining    → TDEE + 400
  - cutting    → TDEE − 400
  - lean_bulk  → TDEE + 200
  - maintain   → TDEE
- **Macros (per kg bodyweight)**:
  | Goal       | Protein | Fat   | Carbs       |
  |------------|---------|-------|-------------|
  | gaining    | 2.2g    | 0.9g  | remainder   |
  | cutting    | 2.5g    | 0.9g  | remainder   |
  | lean_bulk  | 2.0g    | 0.9g  | remainder   |
  | maintain   | 1.8g    | 0.9g  | remainder   |

## Output Schema
```json
{
  "bmr": 1800,
  "tdee": 2500,
  "targetCalories": 2900,
  "bmi": 22.5,
  "bmiCategory": "Normal",
  "protein_g": 154,
  "carbs_g": 320,
  "fat_g": 63,
  "reasoning": "..."
}
```

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks, no explanation.

## Integration
- **Pre-computed in the background** as soon as the user fills in age, gender, weight, height on Step 1 (800ms debounce). Re-runs automatically when goal changes on Step 4.
- Result is cached by key `age_gender_weight_height_goal`. If the key matches when "Generate" is clicked, the cached result is used instantly — no extra API call.
- Output feeds into: DietPlanAgent, WorkoutPlanAgent, CostEstimatorAgent
- Output updated by: CalorieAdjustmentAgent (targetCalories only)
