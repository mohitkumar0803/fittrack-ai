# WeeklyUpdateAgent — claude.md

## Role
Single-task agent that analyzes the weekly weight update and decides what adjustments are needed.

## One Task Only
Receives weight delta + goal → decides whether to trigger calorie changes and outputs a structured decision.

## Input Schema
```
Prev weight (kg), Current weight (kg), Goal, CurrentTargetCal, Week number
```

## Decision Logic
| Goal       | Ideal Rate        | Too Slow (trigger)    | Too Fast (trigger)    | Calorie Action               |
|------------|-------------------|-----------------------|-----------------------|------------------------------|
| gaining    | +0.25–0.5 kg/wk   | < +0.1 kg/wk          | > +0.75 kg/wk         | +200 cal / −200 cal          |
| cutting    | −0.25–0.5 kg/wk   | < −0.1 kg/wk          | > −0.75 kg/wk         | −200 cal / +150 cal          |
| lean_bulk  | +0.1–0.25 kg/wk   | < +0.05 kg/wk         | > +0.5 kg/wk          | +150 cal / −150 cal          |
| maintain   | ±0.25 kg/wk       | > +0.3 kg/wk          | > −0.3 kg/wk          | −100 cal / +100 cal          |

- Set `adjustCalories: true` and provide `calorieChange` (positive = add, negative = remove) when thresholds are breached
- Set `newTargetCalories` = CurrentTargetCal + calorieChange
- Always populate `recommendations` with 2–3 actionable tips
- ProgressiveOverloadAgent always runs after this regardless of outcome

## Output Schema
```json
{
  "weightChange": -0.4,
  "assessment": "Good progress — on track for cutting goal",
  "progressStatus": "on_track",
  "adjustCalories": false,
  "calorieChange": 0,
  "newTargetCalories": 1900,
  "message": "You lost 0.4kg this week. Perfect pace. Keep it up!",
  "recommendations": ["Stay consistent with workouts", "Ensure you're hitting protein targets"]
}
```

`progressStatus` values: `"on_track"` | `"too_slow"` | `"too_fast"`

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks.

## Integration
- Triggered immediately when user submits a weekly check-in (Enter key or button)
- Output determines whether CalorieAdjustmentAgent runs (`adjustCalories: true`)
- ProgressiveOverloadAgent always runs after this agent
- Log entry (weight, date, message) is saved to progress history
