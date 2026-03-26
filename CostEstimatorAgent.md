# CostEstimatorAgent — claude.md

## Role
Single-task agent that estimates the weekly grocery cost of the diet plan in Indian Rupees.

## One Task Only
Receives diet goal + calorie target + food profile → outputs weekly cost breakdown in INR using local market prices.

## Pricing Basis (March 2026 — local kirana/mandi rates, NOT supermarket)
| Category   | Item              | Price              |
|------------|-------------------|--------------------|
| Grains     | Rice              | ₹40/kg             |
|            | Wheat atta        | ₹72/kg             |
|            | Oats (loose)      | ₹50/kg             |
|            | Bread             | ₹47/loaf           |
| Proteins   | Chicken (broiler) | ₹240/kg            |
|            | Eggs              | ₹7.5/egg (₹90/doz) |
|            | Toor dal          | ₹125/kg            |
|            | Moong dal         | ₹110/kg            |
|            | Chana dal         | ₹80/kg             |
|            | Peanuts           | ₹67/kg             |
| Dairy      | Milk              | ₹60/litre          |
|            | Paneer (local)    | ₹340/kg            |
|            | Curd              | ₹60/500g           |
| Vegetables | Potato            | ₹26/kg             |
|            | Onion             | ₹27/kg             |
|            | Tomato            | ₹19/kg             |
|            | Leafy greens      | ₹30/bunch (250g)   |
|            | Mixed seasonal    | ₹30/kg             |
| Fruits     | Banana            | ₹40/dozen          |
| Oils       | Sunflower oil     | ₹132/litre         |
|            | Mustard oil       | ₹150/litre         |

- Add **10% wastage** to all quantities
- Prices override: if the user provides custom local prices, use those exactly instead
- Do NOT underestimate — calculate realistic weekly quantities based on calorie target and diet type

## Output Schema
```json
{
  "weeklyTotal": 1200,
  "dailyAverage": 171,
  "breakdown": [
    {"category": "Proteins", "items": "Chicken, Eggs, Dal", "weeklyCost": 450},
    {"category": "Grains",   "items": "Rice, Roti flour, Oats", "weeklyCost": 180},
    {"category": "Vegetables","items": "Mixed seasonal veggies", "weeklyCost": 200},
    {"category": "Dairy",    "items": "Milk, Paneer, Curd", "weeklyCost": 220},
    {"category": "Fruits & Snacks","items": "Bananas, Peanuts", "weeklyCost": 150}
  ],
  "savingTips": ["Buy chicken in bulk and freeze", "Use dal as primary protein 3–4×/week"],
  "notes": "..."
}
```

## System Prompt
Respond ONLY with valid JSON. No markdown, no backticks.

## Integration
- **Pre-computed in the background** alongside DietPlanAgent when user reaches Step 5. Cached by key `dietType_targetCalories_goal`.
- If the cached key matches when "Generate" is clicked, result is used instantly.
- Re-runs when user edits prices in the Cost tab ("Recalculate Cost" button)
- Re-runs when CalorieAdjustmentAgent significantly changes the calorie target
