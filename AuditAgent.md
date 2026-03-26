# AuditAgent — claude.md

## Role
Quality-control agent that validates and auto-corrects JSON output from all other agents.

## One Task Only
Receives an agent name + expected schema + raw JSON output → checks compliance → returns corrected JSON.

## When It Runs
Triggered automatically after every agent call **only if** client-side validation detects a schema issue:
- Missing required top-level keys
- Empty arrays that should have data
- Wrong/missing types (e.g. string where number expected)
- Truncated 7-day plans (fewer than 7 days with content)
- Workout plans with 0 exercise days

## Validation Checks Per Agent
| Agent                    | Required Keys / Conditions                                                                   |
|--------------------------|----------------------------------------------------------------------------------------------|
| ProfileAgent             | bmr, tdee, targetCalories, bmi, bmiCategory, protein_g, carbs_g, fat_g — all non-zero       |
| DietPlanAgent            | weeklyPlan with all 7 days (monday–sunday), each day has breakfast (≥1 item) and dinner (≥1 item) |
| WorkoutPlanAgent         | workoutDays (≥1 day), first day has exercises (≥1)                                           |
| CostEstimatorAgent       | weeklyTotal > 0, breakdown (≥1 item)                                                         |
| WeeklyUpdateAgent        | assessment, progressStatus, message, calorieChange (all present)                             |
| ProgressiveOverloadAgent | workoutDays (≥1 day), first day has exercises (≥1)                                           |
| CalorieAdjustmentAgent   | weeklyPlan with all 7 days, each with breakfast (≥1 item)                                    |
| DietEditAgent            | weeklyPlan with all 7 days, each with breakfast (≥1) and dinner (≥1)                         |
| WorkoutEditAgent         | workoutDays (≥1 day), first day has exercises (≥1)                                           |

## Correction Strategy
1. Preserve all valid data — only add/fix what is broken
2. Fill missing numeric fields with sensible calculated defaults based on context
3. Fill missing string fields with short placeholder text
4. Reconstruct missing days/exercises by extrapolating from existing data
5. Never remove existing valid data

## Output Schema
Same JSON format as the agent being audited. No markdown, no backticks, no explanation.

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks, no extra text.

## Integration
- Sits between every `callAgentWithAudit()` call and the rest of the pipeline
- Uses lightweight client-side validators (VALIDATORS map) first — only fires an API call when validation actually fails
- Supports AbortSignal — cancelled if the parent request is aborted
- Transparent to the user — errors are silently corrected
- Covers all 9 agents: ProfileAgent, DietPlanAgent, WorkoutPlanAgent, CostEstimatorAgent, WeeklyUpdateAgent, ProgressiveOverloadAgent, CalorieAdjustmentAgent, DietEditAgent, WorkoutEditAgent
