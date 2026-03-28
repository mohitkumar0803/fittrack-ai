import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#080808!important;font-family:'DM Sans',sans-serif}
  ::-webkit-scrollbar{width:3px}
  ::-webkit-scrollbar-track{background:#111}
  ::-webkit-scrollbar-thumb{background:#AAFF00;border-radius:2px}
  input,textarea,select{background:#111;color:#fff;border:1px solid #1E1E1E;border-radius:8px;padding:10px 14px;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;width:100%;transition:border-color .2s}
  input:focus,textarea:focus,select:focus{border-color:#AAFF00;box-shadow:0 0 0 3px rgba(170,255,0,.08)}
  input[type=range]{-webkit-appearance:none;height:3px;background:#1E1E1E;border-radius:2px;outline:none;border:none;box-shadow:none;padding:0}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;background:#AAFF00;border-radius:50%;cursor:pointer;box-shadow:0 0 8px rgba(170,255,0,.4)}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  select option{background:#111;color:#fff}
  button{cursor:pointer;font-family:'DM Sans',sans-serif}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
  .fu{animation:fadeUp .5s ease forwards}
  .si{animation:slideIn .4s ease forwards}
  .spin{animation:spin 1s linear infinite}
  .pulse{animation:pulse 1.8s ease-in-out infinite}
`;
if (typeof document !== "undefined" && !document.getElementById("ft-styles")) {
  const s = document.createElement("style");
  s.id = "ft-styles";
  s.textContent = STYLE;
  document.head.appendChild(s);
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#080808", card:"#111111", cardHov:"#151515", border:"#1E1E1E",
  accent:"#AAFF00", accentDim:"rgba(170,255,0,.1)", accentBorder:"rgba(170,255,0,.3)",
  text:"#FFFFFF", sub:"#888888", dim:"#3A3A3A",
  green:"#00FF87", yellow:"#FFB800", red:"#FF4D4D", purple:"#A78BFA",
};

// ─── AGENT SYSTEM PROMPTS ─────────────────────────────────────────────────────
const PROMPTS = {
  DietPlanAgent:`You are DietPlanAgent. Your ONLY task: create a 7-day meal plan using Indian foods.
DIETARY RULES (apply strictly, all fields are optional — only use what is provided):
- If "Can eat" is empty → use any appropriate Indian foods for the goal
- If "Can eat" lists only vegetarian items → use ONLY vegetarian foods throughout
- If "Can eat" lists non-veg items → you may include them
- If "Diet type" says "Pure Vegetarian" or "veg" → NO eggs, NO meat, NO seafood. Use ONLY: dal,paneer,tofu,milk,curd,rice,roti,oats,fruits,vegetables
- If "Diet type" says "Veg + Eggs" or "ovo" → eggs are allowed, but NO meat, NO seafood
- If "Diet type" says non-vegetarian/non-veg → freely use chicken,eggs,fish,mutton etc alongside veg foods
- If "Diet type" says vegan → NO dairy, NO eggs, NO meat
- Always respect any allergy or exclusion mentioned
- If no preferences given → default balanced Indian diet with both veg and non-veg options
Hit daily targets STRICTLY: calories ±30kcal, protein ±5g, carbs ±10g, fat ±5g. 4 meals/day. Realistic Indian portions. Verify each day: totalCalories = sum of all item calories. Adjust quantities until all macros match.
Respond ONLY valid JSON no markdown no backticks:
{"weeklyPlan":{"monday":{"breakfast":[{"name":"","quantity":"","calories":0,"protein":0,"carbs":0,"fat":0}],"lunch":[...],"dinner":[...],"snacks":[...],"totalCalories":0,"totalProtein":0},"tuesday":{...},"wednesday":{...},"thursday":{...},"friday":{...},"saturday":{...},"sunday":{...}},"notes":""}`,

  WorkoutPlanAgent:`You are WorkoutPlanAgent. Your ONLY task: create a weekly workout plan.
Split: 1-2days=Full Body,3days=PPL,4days=Upper/Lower x2,5days=PPL+Upper+Lower,6days=PPL x2,7days=PPL x2+Active Recovery.
gaining=hypertrophy 8-12reps,cutting=higher reps+cardio finishers 12-15reps,lean_bulk=strength-hypertrophy 6-10reps,maintain=balanced full-body.
RECOVERY RULE: Ensure at least a 2-day gap before hitting the same muscle group again. For example, if chest is trained on Monday, the next chest session should be Wednesday at the earliest.
REST DAY PLACEMENT: Distribute rest days throughout the week (e.g. between back-to-back training days) rather than stacking them all at the end. Use rest days strategically to support the 2-day recovery gap.
Each day must include warmup, cooldown, exercises with sets/reps/rest/notes, and estimated duration.
Respond ONLY valid JSON no markdown no backticks:
{"workoutDays":[{"day":"","focus":"","warmup":"","exercises":[{"name":"","sets":0,"reps":"","rest":"","notes":""}],"cooldown":"","duration":""}],"restDays":[],"generalNotes":""}`,

  CostEstimatorAgent:`You are CostEstimatorAgent. Your ONLY task: estimate weekly Indian diet cost in INR.
Use these ACTUAL March 2026 local Indian market prices (kirana/mandi rates, NOT premium supermarket):
GRAINS: Rice ₹40/kg, Wheat atta ₹72/kg, Oats ₹50/kg (loose/unbranded), Bread ₹47/loaf
PROTEINS: Chicken (broiler whole) ₹240/kg, Eggs ₹7.5/egg (₹90/dozen), Toor dal ₹125/kg, Moong dal ₹110/kg, Chana dal ₹80/kg, Peanuts ₹67/kg
DAIRY: Milk ₹60/litre, Paneer (local) ₹340/kg, Curd ₹60/500g
VEGETABLES: Potato ₹26/kg, Onion ₹27/kg, Tomato ₹19/kg, Leafy greens ₹30/bunch(250g), Mixed seasonal veggies avg ₹30/kg
FRUITS: Banana ₹40/dozen
OILS: Sunflower oil ₹132/litre, Mustard oil ₹150/litre
Calculate realistic weekly quantities based on the user's calorie target and diet type. Add 10% wastage. Be accurate — do NOT underestimate.
Respond ONLY valid JSON no markdown no backticks:
{"weeklyTotal":0,"dailyAverage":0,"breakdown":[{"category":"","items":"","weeklyCost":0}],"savingTips":[],"notes":""}`,

  WeeklyUpdateAgent:`You are WeeklyUpdateAgent. Your ONLY task: analyze weekly weight change, decide adjustments.
gaining ideal +0.25-0.5kg/wk: <+0.1=add200cal,>+0.75=cut200cal.
cutting ideal -0.25-0.5kg/wk: <-0.1=cut200cal,>-0.75=add150cal.
lean_bulk +0.1-0.25kg/wk: adjust±150. maintain ±0.25kg ok: adjust±100.
Respond ONLY valid JSON no markdown no backticks:
{"weightChange":0,"assessment":"","progressStatus":"on_track","adjustCalories":false,"calorieChange":0,"newTargetCalories":0,"message":"","recommendations":[]}`,

  ProgressiveOverloadAgent:`You are ProgressiveOverloadAgent. Your ONLY task: update workout for progressive overload.
Week1-4:+1rep/set. Week5-8:+1set to compounds or note +2.5-5kg. Week9-12:volume peak. Week13:deload.
Return SAME format as WorkoutPlanAgent with updated sets/reps/notes.
Respond ONLY valid JSON no markdown no backticks.`,

  CalorieAdjustmentAgent:`You are CalorieAdjustmentAgent. Your ONLY task: adjust diet plan to new calorie target.
Adjust carbs first, then fats. Keep protein stable. Prefer adjusting snacks. Keep same meal structure.
IMPORTANT: Preserve the user's dietary type (vegetarian/non-veg/vegan) exactly as in the existing plan — do NOT introduce new food types not already present.
Return SAME format as DietPlanAgent with adjusted quantities/calories.
Respond ONLY valid JSON no markdown no backticks.`,

  DietEditAgent:`You are DietEditAgent. Your ONLY task: modify an existing 7-day meal plan based on the user's request.
RULES:
- If the user removes a food item → ALWAYS replace it with a nutritionally similar alternative (same calories ±30, same macro profile). NEVER leave a meal with fewer items than before.
- If the user replaces a food → swap it with the requested alternative and adjust quantity to match the original calories.
- If the user adds a food → add it and recalculate totalCalories and totalProtein for the affected days.
- Preserve the dietary type (vegetarian/non-veg/vegan/etc) — do NOT introduce foods that violate the existing diet type.
- Apply the change to ALL 7 days unless the user specifies a particular day.
- Keep everything else identical. Return the full 7-day plan.
Respond ONLY valid JSON no markdown no backticks.`,

  WorkoutEditAgent:`You are WorkoutEditAgent. Your ONLY task: modify an existing workout plan based on the user's request.
RULES:
- If the user removes an exercise → ALWAYS replace it with an alternative that targets the same muscle group and has similar volume (sets × reps). NEVER leave a workout day with fewer exercises than before.
- If the user replaces an exercise → swap with the requested alternative keeping sets/reps/rest the same.
- If the user changes sets/reps → update only that field.
- Apply change to all relevant days unless a specific day is mentioned.
- Keep everything else identical. Return the full workout plan.
Respond ONLY valid JSON no markdown no backticks.`,

  AuditAgent:`You are AuditAgent. Your ONLY task: validate and fix JSON output from other fitness agents.
You receive: the agent name, expected schema, and the actual JSON output.
Check for: missing required keys, empty arrays that should have data, wrong types, incomplete 7-day plans, 0 workout days.
Fix all issues by filling missing fields with sensible defaults based on context.
Preserve all valid existing data — only repair what is broken.
Return the complete corrected JSON in the exact same format as the original agent.
Respond ONLY valid JSON no markdown no backticks.`,
};

const AGENT_NAMES = Object.keys(PROMPTS);

// ─── FOOD PRICES ──────────────────────────────────────────────────────────────
const PRICE_CONFIG = [
  { category:"Grains", items:[
    { key:"rice",       label:"Rice",         unit:"/kg"    },
    { key:"atta",       label:"Wheat Atta",   unit:"/kg"    },
    { key:"oats",       label:"Oats",         unit:"/kg"    },
    { key:"bread",      label:"Bread",        unit:"/loaf"  },
  ]},
  { category:"Proteins", items:[
    { key:"chicken",    label:"Chicken",      unit:"/kg"    },
    { key:"egg",        label:"Egg",          unit:"/egg"   },
    { key:"toorDal",    label:"Toor Dal",     unit:"/kg"    },
    { key:"moongDal",   label:"Moong Dal",    unit:"/kg"    },
    { key:"chanaDal",   label:"Chana Dal",    unit:"/kg"    },
    { key:"peanuts",    label:"Peanuts",      unit:"/kg"    },
  ]},
  { category:"Dairy", items:[
    { key:"milk",       label:"Milk",         unit:"/litre" },
    { key:"paneer",     label:"Paneer",       unit:"/kg"    },
    { key:"curd",       label:"Curd",         unit:"/500g"  },
  ]},
  { category:"Vegetables", items:[
    { key:"potato",     label:"Potato",       unit:"/kg"    },
    { key:"onion",      label:"Onion",        unit:"/kg"    },
    { key:"tomato",     label:"Tomato",       unit:"/kg"    },
    { key:"leafyGreens",label:"Leafy Greens", unit:"/bunch" },
    { key:"mixedVeggies",label:"Mixed Veggies",unit:"/kg"  },
  ]},
  { category:"Fruits & Oils", items:[
    { key:"banana",       label:"Banana",       unit:"/dozen" },
    { key:"sunflowerOil", label:"Sunflower Oil",unit:"/litre" },
    { key:"mustardOil",   label:"Mustard Oil",  unit:"/litre" },
  ]},
];

const DEFAULT_PRICES = {
  rice:40, atta:72, oats:50, bread:47,
  chicken:240, egg:7.5, toorDal:125, moongDal:110, chanaDal:80, peanuts:67,
  milk:60, paneer:340, curd:60,
  potato:26, onion:27, tomato:19, leafyGreens:30, mixedVeggies:30,
  banana:40, sunflowerOil:132, mustardOil:150,
};

function buildCostPrompt(p) {
  return `You are CostEstimatorAgent. Your ONLY task: estimate weekly Indian diet cost in INR.
Use these user-confirmed local market prices EXACTLY:
GRAINS: Rice ₹${p.rice}/kg, Wheat atta ₹${p.atta}/kg, Oats ₹${p.oats}/kg, Bread ₹${p.bread}/loaf
PROTEINS: Chicken ₹${p.chicken}/kg, Eggs ₹${p.egg}/egg (₹${(p.egg*12).toFixed(0)}/dozen), Toor dal ₹${p.toorDal}/kg, Moong dal ₹${p.moongDal}/kg, Chana dal ₹${p.chanaDal}/kg, Peanuts ₹${p.peanuts}/kg
DAIRY: Milk ₹${p.milk}/litre, Paneer ₹${p.paneer}/kg, Curd ₹${p.curd}/500g
VEGETABLES: Potato ₹${p.potato}/kg, Onion ₹${p.onion}/kg, Tomato ₹${p.tomato}/kg, Leafy greens ₹${p.leafyGreens}/bunch(250g), Mixed seasonal veggies avg ₹${p.mixedVeggies}/kg
FRUITS: Banana ₹${p.banana}/dozen
OILS: Sunflower oil ₹${p.sunflowerOil}/litre, Mustard oil ₹${p.mustardOil}/litre
Calculate realistic weekly quantities based on the user's calorie target and diet type. Add 10% wastage. Be accurate — do NOT underestimate.
Respond ONLY valid JSON no markdown no backticks:
{"weeklyTotal":0,"dailyAverage":0,"breakdown":[{"category":"","items":"","weeklyCost":0}],"savingTips":[],"notes":""}`;
}

// ─── LOCAL PROFILE CALCULATOR (replaces ProfileAgent API call) ────────────────
function calcProfile(p) {
  const bmr = p.gender === "female"
    ? (10 * p.weight) + (6.25 * p.height) - (5 * p.age) - 161
    : (10 * p.weight) + (6.25 * p.height) - (5 * p.age) + 5;
  const mult = p.workoutsPerWeek <= 2 ? 1.375 : p.workoutsPerWeek <= 4 ? 1.55 : p.workoutsPerWeek <= 6 ? 1.725 : 1.9;
  const tdee = Math.round(bmr * mult);
  const targetCalories = Math.round(
    p.goal === "gaining"   ? tdee + 400 :
    p.goal === "cutting"   ? tdee - 400 :
    p.goal === "lean_bulk" ? tdee + 200 : tdee
  );
  const protein_g = Math.round(p.weight * (p.goal === "gaining" ? 2.2 : p.goal === "cutting" ? 2.5 : p.goal === "lean_bulk" ? 2.0 : 1.8));
  const fat_g     = Math.round(p.weight * 0.9);
  const carbs_g   = Math.max(0, Math.round((targetCalories - protein_g * 4 - fat_g * 9) / 4));
  const bmi       = +(p.weight / ((p.height / 100) ** 2)).toFixed(1);
  const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  return { bmr: Math.round(bmr), tdee, targetCalories, bmi, bmiCategory, protein_g, fat_g, carbs_g, reasoning: "Mifflin-St Jeor" };
}

// ─── PER-AGENT TOKEN LIMITS ───────────────────────────────────────────────────
const MAX_TOKENS = {
  DietPlanAgent:           65536,
  WorkoutPlanAgent:         8192,
  CostEstimatorAgent:      16384,
  WeeklyUpdateAgent:        2048,
  ProgressiveOverloadAgent: 8192,
  CalorieAdjustmentAgent:  65536,
  DietEditAgent:           65536,
  WorkoutEditAgent:         8192,
  AuditAgent:              65536,
};

// ─── API HELPER ───────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

async function callAgent(name, msg, systemPromptOverride, signal, _retries = 3) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY — copy .env.example to .env and add your key.");
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      system_instruction:{ parts:[{ text: systemPromptOverride || PROMPTS[name] }] },
      contents:[{ role:"user", parts:[{ text:msg }] }],
      generationConfig:{ maxOutputTokens:MAX_TOKENS[name]||8192, responseMimeType:"application/json" }
    }),
    signal,
  });
  if (res.status === 429 && _retries > 0) {
    const waitMatch = (await res.text()).match(/(\d+\.?\d*)\s*s/);
    const waitSec = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 2 : 15;
    console.warn(`[${name}] Rate limited — retrying in ${waitSec}s (${_retries} retries left)`);
    await delay(waitSec * 1000);
    return callAgent(name, msg, systemPromptOverride, signal, _retries - 1);
  }
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message||`API ${res.status}`); }
  const d = await res.json();
  const txt = (d.candidates?.[0]?.content?.parts||[]).map(p=>p.text||"").join("").trim();
  try { return JSON.parse(txt); }
  catch {
    const obj = txt.match(/\{[\s\S]*\}/);
    if(obj) { try { return JSON.parse(obj[0]); } catch {} }
    throw new Error("Parse failed: " + txt.slice(0,120));
  }
}

// ─── AUDIT AGENT ──────────────────────────────────────────────────────────────
const DAYS7 = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

const VALIDATORS = {
  DietPlanAgent:          r => r && r.weeklyPlan && DAYS7.every(d => r.weeklyPlan[d] && r.weeklyPlan[d].breakfast?.length > 0 && r.weeklyPlan[d].dinner?.length > 0),
  WorkoutPlanAgent:       r => r && r.workoutDays && r.workoutDays.length > 0 && r.workoutDays[0].exercises?.length > 0,
  CostEstimatorAgent:     r => r && r.weeklyTotal > 0 && r.breakdown && r.breakdown.length > 0,
  WeeklyUpdateAgent:      r => r && r.assessment && r.progressStatus && r.message && r.calorieChange !== undefined,
  ProgressiveOverloadAgent: r => r && r.workoutDays && r.workoutDays.length > 0 && r.workoutDays[0].exercises?.length > 0,
  CalorieAdjustmentAgent: r => r && r.weeklyPlan && DAYS7.every(d => r.weeklyPlan[d] && r.weeklyPlan[d].breakfast?.length > 0),
  DietEditAgent:          r => r && r.weeklyPlan && DAYS7.every(d => r.weeklyPlan[d] && r.weeklyPlan[d].breakfast?.length > 0 && r.weeklyPlan[d].dinner?.length > 0),
  WorkoutEditAgent:       r => r && r.workoutDays && r.workoutDays.length > 0 && r.workoutDays[0].exercises?.length > 0,
};

const SCHEMAS = {
  DietPlanAgent:          `{"weeklyPlan":{"monday":{"breakfast":[{"name":"","quantity":"","calories":0,"protein":0,"carbs":0,"fat":0}],"lunch":[...],"dinner":[...],"snacks":[...],"totalCalories":0,"totalProtein":0},...all 7 days},"notes":""}`,
  WorkoutPlanAgent:       `{"workoutDays":[{"day":"","focus":"","warmup":"","exercises":[{"name":"","sets":0,"reps":"","rest":"","notes":""}],"cooldown":"","duration":""}],"restDays":[],"generalNotes":""}`,
  CostEstimatorAgent:     `{"weeklyTotal":0,"dailyAverage":0,"breakdown":[{"category":"","items":"","weeklyCost":0}],"savingTips":[],"notes":""}`,
  WeeklyUpdateAgent:      `{"weightChange":0,"assessment":"","progressStatus":"on_track","adjustCalories":false,"calorieChange":0,"newTargetCalories":0,"message":"","recommendations":[]}`,
  ProgressiveOverloadAgent:`{"workoutDays":[{"day":"","focus":"","warmup":"","exercises":[{"name":"","sets":0,"reps":"","rest":"","notes":""}],"cooldown":"","duration":""}],"restDays":[],"generalNotes":""}`,
  CalorieAdjustmentAgent: `{"weeklyPlan":{"monday":{...},...all 7 days},"notes":""}`,
  DietEditAgent:          `{"weeklyPlan":{"monday":{"breakfast":[{"name":"","quantity":"","calories":0,"protein":0,"carbs":0,"fat":0}],"lunch":[...],"dinner":[...],"snacks":[...],"totalCalories":0,"totalProtein":0},...all 7 days},"notes":""}`,
  WorkoutEditAgent:       `{"workoutDays":[{"day":"","focus":"","warmup":"","exercises":[{"name":"","sets":0,"reps":"","rest":"","notes":""}],"cooldown":"","duration":""}],"restDays":[],"generalNotes":""}`,
};

async function callAgentWithAudit(name, msg, systemPromptOverride, signal) {
  const result = await callAgent(name, msg, systemPromptOverride, signal);
  const validate = VALIDATORS[name];
  if (validate && !validate(result)) {
    console.warn(`[AuditAgent] ${name} output failed validation — auto-correcting...`);
    const auditMsg = `Agent: ${name}\nExpected schema: ${SCHEMAS[name]}\nActual output (fix this): ${JSON.stringify(result)}\nReturn the fully corrected JSON with all required fields populated.`;
    return await callAgent("AuditAgent", auditMsg, undefined, signal);
  }
  return result;
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SK = "fittrack_v2";
const save = d => { try { localStorage.setItem(SK, JSON.stringify(d)); } catch{} };
const load = () => { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } };

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Btn = memo(({ children, onClick, variant="primary", disabled, full, sm }) => {
  const base = { border:"none", borderRadius:8, fontWeight:600, cursor:disabled?"not-allowed":"pointer", opacity:disabled?.45:1, transition:"all .2s", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, width:full?"100%":"auto", padding: sm?"8px 14px":"12px 22px", fontSize:sm?13:15 };
  const v = {
    primary:{ background:T.accent, color:"#000" },
    ghost:{ background:"transparent", color:T.text, border:`1px solid ${T.border}` },
    dim:{ background:T.card, color:T.sub, border:`1px solid ${T.border}` },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
});

const Card = memo(({ children, style:s, glow, onClick }) => (
  <div onClick={onClick} style={{ background:T.card, border:`1px solid ${glow?T.accentBorder:T.border}`, borderRadius:12, padding:16, boxShadow:glow?`0 0 20px rgba(170,255,0,.08)`:undefined, ...s }}>
    {children}
  </div>
));

const Label = memo(({ children }) => (
  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:T.sub, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", marginBottom:8 }}>
    {children}
  </div>
));

const Pill = memo(({ children, active, onClick, color }) => (
  <button onClick={onClick} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${active?(color||T.accent):T.border}`, background:active?`${color||T.accent}18`:"transparent", color:active?(color||T.accent):T.sub, fontFamily:"'DM Sans'", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .2s", flexShrink:0 }}>
    {children}
  </button>
));

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const S1 = memo(({ p, set }) => (
  <div className="fu" style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:42,color:T.text,lineHeight:1.05}}>
      LET'S START WITH<br/><span style={{color:T.accent}}>THE BASICS</span>
    </div>
    <p style={{color:T.sub,fontSize:14,lineHeight:1.6}}>Your body metrics help us calculate your exact maintenance calories.</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div><Label>Your Name</Label><input placeholder="e.g. Rahul" value={p.name} onChange={e=>set(x=>({...x,name:e.target.value}))}/></div>
      <div><Label>Age</Label><input type="number" min="15" max="80" value={p.age||""} onChange={e=>set(x=>({...x,age:e.target.value===''?'':+e.target.value}))}/></div>
    </div>
    <div>
      <Label>Gender</Label>
      <div style={{display:"flex",gap:8}}>
        {[["male","👨 Male"],["female","👩 Female"]].map(([v,l])=>(
          <button key={v} onClick={()=>set(x=>({...x,gender:v}))} style={{flex:1,padding:"11px",borderRadius:8,border:`1px solid ${p.gender===v?T.accent:T.border}`,background:p.gender===v?T.accentDim:T.card,color:p.gender===v?T.accent:T.sub,fontFamily:"'DM Sans'",fontWeight:600,fontSize:14,cursor:"pointer",transition:"all .2s"}}>{l}</button>
        ))}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div>
        <Label>Weight (kg)</Label>
        <input type="number" min="40" max="300" placeholder="e.g. 70" value={p.weight||""} onChange={e=>set(x=>({...x,weight:e.target.value===''?'':+e.target.value}))}/>
      </div>
      <div>
        <Label>Height (cm)</Label>
        <input type="number" min="100" max="250" placeholder="e.g. 170" value={p.height||""} onChange={e=>set(x=>({...x,height:e.target.value===''?'':+e.target.value}))}/>
      </div>
    </div>
  </div>
));

const S2 = memo(({ p, set }) => (
  <div className="fu" style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:42,color:T.text,lineHeight:1.05}}>
      WORKOUT<br/><span style={{color:T.accent}}>FREQUENCY</span>
    </div>
    <p style={{color:T.sub,fontSize:14}}>How many days a week can you commit to training?</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:8}}>
      {[1,2,3,4,5,6,7].map(d=>(
        <button key={d} onClick={()=>set(x=>({...x,workoutsPerWeek:d}))} style={{padding:"18px 4px",borderRadius:10,border:`1px solid ${p.workoutsPerWeek===d?T.accent:T.border}`,background:p.workoutsPerWeek===d?T.accentDim:T.card,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .2s"}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:30,color:p.workoutsPerWeek===d?T.accent:T.text}}>{d}</span>
          <span style={{fontFamily:"'DM Sans'",fontSize:10,color:T.sub}}>day{d>1?"s":""}</span>
        </button>
      ))}
    </div>
    <Card style={{background:T.accentDim,border:`1px solid ${T.accentBorder}`,marginTop:4}}>
      <div style={{fontSize:13,color:T.accent}}>💡 <strong>Tip:</strong> 3–4 days is ideal for beginners. 5–6 days for intermediate or advanced lifters.</div>
    </Card>
  </div>
));

// ─── STEP 3 DATA ──────────────────────────────────────────────────────────────
const DIET_TYPES = [
  {id:"indian_household", emoji:"🏠", label:"Indian Household",    desc:"Dal, roti, rice, sabzi, milk, curd, eggs"},
  {id:"pure_veg",         emoji:"🥗", label:"Pure Vegetarian",     desc:"No meat, no eggs, no seafood"},
  {id:"ovo_veg",          emoji:"🥚", label:"Veg + Eggs",          desc:"Vegetarian but includes eggs"},
  {id:"non_veg",          emoji:"🍗", label:"Non-Vegetarian",      desc:"Chicken, mutton, fish, eggs + veg"},
  {id:"chicken_only",     emoji:"🐔", label:"Chicken Only",        desc:"Chicken & eggs, no red meat or fish"},
  {id:"pescatarian",      emoji:"🐟", label:"Pescatarian",         desc:"Fish & seafood + vegetarian foods"},
  {id:"vegan",            emoji:"🌱", label:"Vegan",               desc:"No dairy, no eggs, no meat"},
  {id:"jain",             emoji:"🕉️", label:"Jain Diet",           desc:"No root vegetables, strictly vegetarian"},
  {id:"keto",             emoji:"🥑", label:"Keto / Low Carb",     desc:"High fat, very low carb, moderate protein"},
  {id:"high_protein",     emoji:"💪", label:"High Protein",        desc:"Protein-first meals, supports muscle gain"},
  {id:"south_indian",     emoji:"🍛", label:"South Indian",        desc:"Rice, idli, dosa, sambar, rasam, coconut"},
  {id:"no_preference",    emoji:"🎯", label:"No Preference",       desc:"Balanced mix — anything goes"},
];

const DIET_TAGS = [
  {id:"no_onion_garlic",  label:"No Onion / Garlic"},
  {id:"dairy_free",       label:"Dairy Free"},
  {id:"gluten_free",      label:"Gluten Free"},
  {id:"nut_allergy",      label:"Nut Allergy"},
  {id:"no_spicy",         label:"No Spicy Food"},
  {id:"budget_friendly",  label:"Budget Friendly"},
  {id:"no_processed",     label:"No Processed Foods"},
  {id:"intermittent",     label:"Intermittent Fasting"},
  {id:"small_meals",      label:"Prefer Small Meals"},
  {id:"no_sugar",         label:"No Added Sugar"},
  {id:"low_sodium",       label:"Low Sodium"},
  {id:"extra_carbs_workout", label:"Extra Carbs on Workout Days"},
];

const S3 = memo(({ p, set }) => {
  const selTags = p.dietTags || [];
  const toggleTag = useCallback(id => set(x=>({...x, dietTags: x.dietTags?.includes(id) ? x.dietTags.filter(t=>t!==id) : [...(x.dietTags||[]), id]})), [set]);
  return (
    <div className="fu" style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:42,color:T.text,lineHeight:1.05}}>
        YOUR<br/><span style={{color:T.accent}}>FOOD PREFERENCES</span>
      </div>
      <p style={{color:T.sub,fontSize:14,lineHeight:1.6}}>Pick your diet style — we'll build your meal plan around it.</p>
      <div>
        <Label>Diet Type</Label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {DIET_TYPES.map(d=>{
            const sel = p.dietType===d.id;
            return (
              <button key={d.id} onClick={()=>set(x=>({...x,dietType:d.id}))} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:10,border:`1px solid ${sel?T.accent:T.border}`,background:sel?T.accentDim:T.card,cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
                <span style={{fontSize:20,flexShrink:0}}>{d.emoji}</span>
                <div>
                  <div style={{fontFamily:"'DM Sans'",fontWeight:600,fontSize:13,color:sel?T.accent:T.text}}>{d.label}</div>
                  <div style={{fontSize:11,color:T.sub,marginTop:2,lineHeight:1.4}}>{d.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label>Additional Preferences <span style={{color:T.dim,fontWeight:400}}>(pick any)</span></Label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {DIET_TAGS.map(t=>(
            <Pill key={t.id} active={selTags.includes(t.id)} onClick={()=>toggleTag(t.id)}>{t.label}</Pill>
          ))}
        </div>
      </div>
      <div>
        <Label>Anything else? <span style={{color:T.dim,fontWeight:400}}>(optional)</span></Label>
        <textarea placeholder="e.g. light dinner on Sunday, extra carbs before Monday workout, prefer curd rice at night..." value={p.customDietNote||""} onChange={e=>set(x=>({...x,customDietNote:e.target.value}))} style={{height:68,resize:"none"}}/>
      </div>
      <div>
        <Label>Foods to avoid / allergies</Label>
        <input placeholder="e.g. peanuts, shellfish, pork, broccoli, mushrooms..." value={p.excludeFoods||""} onChange={e=>set(x=>({...x,excludeFoods:e.target.value}))}/>
      </div>
    </div>
  );
});

const S4 = memo(({ p, set }) => {
  const goals = [
    {id:"gaining",emoji:"💪",label:"MUSCLE GAIN",desc:"Build size and strength",badge:"+400 cal"},
    {id:"cutting",emoji:"🔥",label:"FAT LOSS / CUT",desc:"Lose fat, preserve muscle",badge:"−400 cal"},
    {id:"lean_bulk",emoji:"⚡",label:"LEAN BULK",desc:"Slow quality muscle gain",badge:"+200 cal"},
    {id:"maintain",emoji:"🎯",label:"MAINTAIN",desc:"Stay at current physique",badge:"±0 cal"},
  ];
  return (
    <div className="fu" style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:42,color:T.text,lineHeight:1.05}}>
        WHAT'S YOUR<br/><span style={{color:T.accent}}>GOAL?</span>
      </div>
      <p style={{color:T.sub,fontSize:14}}>This defines your calorie target and training style.</p>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:4}}>
        {goals.map(g=>(
          <button key={g.id} onClick={()=>set(x=>({...x,goal:g.id}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderRadius:10,border:`1px solid ${p.goal===g.id?T.accent:T.border}`,background:p.goal===g.id?T.accentDim:T.card,cursor:"pointer",textAlign:"left",transition:"all .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:26}}>{g.emoji}</span>
              <div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:19,color:p.goal===g.id?T.accent:T.text,letterSpacing:".04em"}}>{g.label}</div>
                <div style={{fontFamily:"'DM Sans'",fontSize:12,color:T.sub}}>{g.desc}</div>
              </div>
            </div>
            <span style={{fontFamily:"'DM Mono'",fontSize:13,color:p.goal===g.id?T.accent:T.dim,fontWeight:500}}>{g.badge}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

const S5 = memo(({ p, precompStatus }) => (
  <div className="fu" style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:42,color:T.text,lineHeight:1.05}}>
      READY TO<br/><span style={{color:T.accent}}>TRANSFORM?</span>
    </div>
    <Card>
      {[["Name",p.name||"—"],["Age",`${p.age} yrs`],["Gender",p.gender],["Weight",`${p.weight} kg`],["Height",`${p.height} cm`],["Workouts/week",`${p.workoutsPerWeek} days`],["Goal",p.goal.replace("_"," ").toUpperCase()],["Diet",DIET_TYPES.find(d=>d.id===p.dietType)?.label||"No Preference"]].map(([l,v])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
          <span style={{fontSize:13,color:T.sub}}>{l}</span>
          <span style={{fontFamily:"'DM Mono'",fontSize:13,color:T.text,fontWeight:500,textTransform:"capitalize"}}>{v}</span>
        </div>
      ))}
    </Card>
    <Card style={{background:T.accentDim,border:`1px solid ${T.accentBorder}`}}>
      <div style={{fontSize:13,color:T.accent,lineHeight:1.9}}>
        🤖 <strong>AI Agents status:</strong><br/>
        <span style={{display:"block",color:T.green,paddingLeft:4}}>✓ Stats calculated — instant</span>
        {[
          ["WorkoutPlanAgent",  "Workout designed"],
          ["DietPlanAgent",     "Meal plan built"],
          ["CostEstimatorAgent","Costs estimated"],
        ].map(([agent, label]) => (
          <span key={agent} style={{display:"block",color:precompStatus[agent]?T.green:T.sub,paddingLeft:4}}>
            {precompStatus[agent] ? "✓" : "◌"} {label} {precompStatus[agent]?"— ready":"— will run now"}
          </span>
        ))}
      </div>
    </Card>
  </div>
));

// ─── LOADING ──────────────────────────────────────────────────────────────────
const LoadingScreen = memo(({ msg, elapsed, estimated }) => {
  // If timer runs out but generation is still going, extend the estimate dynamically
  const effectiveEstimated = elapsed >= estimated ? estimated + Math.ceil((elapsed - estimated + 30) / 30) * 30 : estimated;
  const remaining = Math.max(0, effectiveEstimated - elapsed);
  const progress  = elapsed >= estimated
    ? Math.min(99, 90 + Math.floor((elapsed - estimated) / 10))
    : Math.round((elapsed / estimated) * 95);
  const mins = Math.floor(remaining / 60);
  const secs = String(remaining % 60).padStart(2, "0");
  const countdown = remaining > 0 ? (mins > 0 ? `${mins}:${secs}` : `0:${secs}`) : "0:00";

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{fontSize:48,marginBottom:12}}>⚡</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:30,color:T.text,letterSpacing:".06em",marginBottom:4}}>BUILDING YOUR PLAN</div>
      <div className="pulse" style={{fontSize:13,color:T.sub,marginBottom:24,textAlign:"center",maxWidth:300,lineHeight:1.6}}>{msg}</div>

      {/* Countdown clock */}
      <div style={{fontFamily:"'Bebas Neue'",fontSize:64,color:T.accent,letterSpacing:".08em",lineHeight:1,marginBottom:4}}>
        {countdown}
      </div>
      <div style={{fontFamily:"'DM Mono'",fontSize:11,color:elapsed>=estimated?T.yellow:T.sub,marginBottom:20}}>{elapsed>=estimated?"almost done — finalizing...":"estimated time remaining"}</div>

      {/* Progress bar */}
      <div style={{width:"100%",maxWidth:320,marginBottom:28}}>
        <div style={{height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${progress}%`,background:T.accent,borderRadius:2,transition:"width 1s ease"}}/>
        </div>
      </div>

      {/* Agent status list */}
      <div style={{display:"flex",flexDirection:"column",gap:5,width:"100%",maxWidth:320}}>
        {AGENT_NAMES.map(n=>{
          const active = msg.includes(n);
          return (
            <div key={n} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",borderRadius:8,background:active?T.accentDim:"transparent",border:`1px solid ${active?T.accentBorder:"transparent"}`,transition:"all .3s"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:active?T.accent:T.dim,flexShrink:0}}/>
              <span style={{fontFamily:"'DM Mono'",fontSize:11,color:active?T.accent:T.dim}}>{n}</span>
              {active && <div style={{marginLeft:"auto",width:10,height:10,borderRadius:"50%",border:`2px solid ${T.border}`,borderTopColor:T.accent}} className="spin"/>}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
const OverviewTab = memo(({ calc, prof, cost, setTab, diet }) => {
  const gColor = {gaining:T.green,cutting:T.red,lean_bulk:T.accent,maintain:T.yellow};
  const gLabel = {gaining:"MUSCLE GAIN",cutting:"FAT LOSS",lean_bulk:"LEAN BULK",maintain:"MAINTAIN"};
  const gc = gColor[prof.goal];

  const Stat = memo(({label,val,unit,c}) => (
    <Card>
      <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.sub,marginBottom:6,letterSpacing:".08em"}}>{label}</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:32,color:c||T.text,lineHeight:1}}>{val}<span style={{fontSize:14,color:T.sub,marginLeft:3}}>{unit}</span></div>
    </Card>
  ));

  // Compute actual averages from diet plan so Overview always matches Diet tab
  const actual = useMemo(() => {
    if (!diet?.weeklyPlan) return null;
    const days = Object.values(diet.weeklyPlan);
    const n = days.length || 1;
    const sum = days.reduce((acc, d) => {
      const items = [...(d.breakfast||[]),...(d.lunch||[]),...(d.dinner||[]),...(d.snacks||[])];
      acc.calories += items.reduce((s,i) => s+(i.calories||0), 0);
      acc.protein  += items.reduce((s,i) => s+(i.protein||0),  0);
      acc.carbs    += items.reduce((s,i) => s+(i.carbs||0),    0);
      acc.fat      += items.reduce((s,i) => s+(i.fat||0),      0);
      return acc;
    }, {calories:0, protein:0, carbs:0, fat:0});
    return {
      calories: +(sum.calories/n).toFixed(2),
      protein:  +(sum.protein/n).toFixed(2),
      carbs:    +(sum.carbs/n).toFixed(2),
      fat:      +(sum.fat/n).toFixed(2),
    };
  }, [diet]);

  const display = actual || { calories: calc.targetCalories, protein: calc.protein_g, carbs: calc.carbs_g, fat: calc.fat_g };

  const macros = useMemo(() => [
    {l:"Protein", v:display.protein, cal:display.protein*4, c:T.green},
    {l:"Carbs",   v:display.carbs,   cal:display.carbs*4,   c:T.yellow},
    {l:"Fat",     v:display.fat,     cal:display.fat*9,     c:"#FF6B6B"},
  ], [display]);

  return (
    <div className="si" style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 16px",borderRadius:20,background:`${gc}15`,border:`1px solid ${gc}50`}}>
        <span style={{fontFamily:"'Bebas Neue'",fontSize:15,color:gc,letterSpacing:".1em"}}>🎯 {gLabel[prof.goal]}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Stat label="DAILY CALORIES" val={display.calories} unit="kcal" c={T.accent}/>
        <Stat label="TDEE" val={calc.tdee} unit="kcal"/>
        <Stat label="BMI" val={calc.bmi?.toFixed(1)} c={T.yellow}/>
        <Stat label="BMR" val={calc.bmr} unit="kcal" c={T.purple}/>
      </div>
      <Card>
        <Label>Daily Macros</Label>
        {macros.map(m=>{
          const pct = Math.round(m.cal/calc.targetCalories*100);
          return (
            <div key={m.l} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:13,color:T.sub}}>{m.l}</span>
                <span style={{fontFamily:"'DM Mono'",fontSize:13,color:m.c}}>{m.v}g &nbsp;<span style={{color:T.dim,fontSize:11}}>{pct}%</span></span>
              </div>
              <div style={{height:3,background:T.border,borderRadius:2}}>
                <div style={{height:"100%",width:`${pct}%`,background:m.c,borderRadius:2,transition:"width 1s ease"}}/>
              </div>
            </div>
          );
        })}
      </Card>
      <Card style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,color:T.sub}}>BMI Category</span>
        <span style={{fontFamily:"'DM Mono'",fontSize:13,color:T.yellow}}>{calc.bmiCategory}</span>
      </Card>
      {cost && (
        <Card onClick={()=>setTab("cost")} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${T.accentBorder}`}}>
          <div>
            <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.sub,marginBottom:4}}>EST. WEEKLY COST</div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:30,color:T.accent}}>₹{cost.weeklyTotal}</div>
          </div>
          <span style={{color:T.accent,fontSize:20}}>→</span>
        </Card>
      )}
      {calc.reasoning && (
        <Card>
          <Label>Agent Notes</Label>
          <p style={{fontSize:12,color:T.sub,lineHeight:1.7}}>{calc.reasoning}</p>
        </Card>
      )}
    </div>
  );
});

// ─── DIET TAB ─────────────────────────────────────────────────────────────────
const MealRow = memo(({m}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:8,background:"#111",marginBottom:4}}>
    <div><div style={{fontSize:14,color:T.text}}>{m.name}</div><div style={{fontSize:11,color:T.sub}}>{m.quantity}</div></div>
    <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
      <div style={{fontFamily:"'DM Mono'",fontSize:13,color:T.accent}}>{Number(m.calories||0).toFixed(2)} kcal</div>
      <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.dim}}>P{Number(m.protein||0).toFixed(2)} C{Number(m.carbs||0).toFixed(2)} F{Number(m.fat||0).toFixed(2)}</div>
    </div>
  </div>
));

const MealSection = memo(({title, emoji, meals, mealKey, placeholder, dayName, onEdit, editing}) => {
  const [val, setVal] = useState("");
  const submit = useCallback(() => {
    if (!val.trim() || editing) return;
    onEdit(`On ${dayName}, in ${mealKey}: ${val.trim()}`);
    setVal("");
  }, [val, editing, onEdit, dayName, mealKey]);
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:15,color:T.text,letterSpacing:".05em",marginBottom:6}}>{emoji} {title}</div>
      {(meals||[]).map((m,i)=><MealRow key={i} m={m}/>)}
      <div style={{display:"flex",gap:6,marginTop:6}}>
        <input
          value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && submit()}
          placeholder={placeholder}
          disabled={editing}
          style={{flex:1,fontSize:12,padding:"7px 10px",opacity:editing?0.5:1}}
        />
        <button
          onClick={submit}
          disabled={!val.trim()||editing}
          style={{padding:"7px 14px",borderRadius:8,border:"none",background:(!val.trim()||editing)?T.border:T.accent,color:(!val.trim()||editing)?T.dim:"#000",fontWeight:700,fontSize:12,cursor:(!val.trim()||editing)?"not-allowed":"pointer",flexShrink:0,transition:"all .2s",whiteSpace:"nowrap"}}
        >
          {editing?"...":"Apply"}
        </button>
      </div>
    </div>
  );
});

const DIET_DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

const DietTab = memo(({ diet, onEdit, editing }) => {
  const [open, setOpen] = useState(null);
  if (!diet?.weeklyPlan) return <div style={{color:T.sub,padding:20,textAlign:"center"}}>No diet plan yet.</div>;
  return (
    <div className="si" style={{display:"flex",flexDirection:"column",gap:8}}>
      {DIET_DAYS.map((dayName, i) => {
        const d = diet.weeklyPlan[dayName];
        const isOpen = open === i;
        return (
          <div key={dayName}>
            <button
              onClick={()=>setOpen(isOpen ? null : i)}
              style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:isOpen?"10px 10px 0 0":10,border:`1px solid ${isOpen?T.accent:T.border}`,background:isOpen?T.accentDim:T.card,cursor:"pointer",transition:"all .2s"}}
            >
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:6,flex:1}}>
                <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:isOpen?T.accent:T.text,textTransform:"uppercase"}}>{dayName}</span>
                {d && (()=>{
                  const allItems=[...(d.breakfast||[]),...(d.lunch||[]),...(d.dinner||[]),...(d.snacks||[])];
                  const tc=allItems.reduce((s,i)=>s+(i.carbs||0),0);
                  const tf=allItems.reduce((s,i)=>s+(i.fat||0),0);
                  return (
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'DM Mono'",fontSize:11,color:T.accent}}>{Number(d.totalCalories||0).toFixed(2)} kcal</span>
                      <span style={{fontFamily:"'DM Mono'",fontSize:11,color:T.green}}>P {Number(d.totalProtein||0).toFixed(2)}g</span>
                      <span style={{fontFamily:"'DM Mono'",fontSize:11,color:T.yellow}}>C {Number(tc||0).toFixed(2)}g</span>
                      <span style={{fontFamily:"'DM Mono'",fontSize:11,color:"#FF6B6B"}}>F {Number(tf||0).toFixed(2)}g</span>
                    </div>
                  );
                })()}
              </div>
              <span style={{color:isOpen?T.accent:T.dim,fontSize:12,marginLeft:8}}>{isOpen?"▲":"▼"}</span>
            </button>
            {isOpen && d && (()=>{
              const allItems = [...(d.breakfast||[]),...(d.lunch||[]),...(d.dinner||[]),...(d.snacks||[])];
              const totalCarbs = allItems.reduce((s,i)=>s+(i.carbs||0),0);
              const totalFat   = allItems.reduce((s,i)=>s+(i.fat||0),0);
              return (
              <div style={{padding:"14px 16px",background:"#0C0C0C",borderRadius:"0 0 10px 10px",border:`1px solid ${T.accent}`,borderTop:"none"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:14}}>
                  <div style={{background:T.card,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontFamily:"'DM Mono'",fontSize:9,color:T.sub,marginBottom:2}}>CALORIES</div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:T.accent}}>{Number(d.totalCalories||0).toFixed(2)}</div>
                  </div>
                  <div style={{background:T.card,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontFamily:"'DM Mono'",fontSize:9,color:T.sub,marginBottom:2}}>PROTEIN</div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:T.green}}>{Number(d.totalProtein||0).toFixed(2)}g</div>
                  </div>
                  <div style={{background:T.card,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontFamily:"'DM Mono'",fontSize:9,color:T.sub,marginBottom:2}}>CARBS</div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:T.yellow}}>{Number(totalCarbs||0).toFixed(2)}g</div>
                  </div>
                  <div style={{background:T.card,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontFamily:"'DM Mono'",fontSize:9,color:T.sub,marginBottom:2}}>FAT</div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#FF6B6B"}}>{Number(totalFat||0).toFixed(2)}g</div>
                  </div>
                </div>
                <MealSection title="BREAKFAST" emoji="🌅" meals={d.breakfast} mealKey="breakfast" dayName={dayName} onEdit={onEdit} editing={editing} placeholder='"Replace oats with upma" or "Remove eggs"'/>
                <MealSection title="LUNCH"     emoji="☀️" meals={d.lunch}      mealKey="lunch"     dayName={dayName} onEdit={onEdit} editing={editing} placeholder='"Replace dal with rajma" or "Add curd"'/>
                <MealSection title="DINNER"    emoji="🌙" meals={d.dinner}     mealKey="dinner"    dayName={dayName} onEdit={onEdit} editing={editing} placeholder='"Replace roti with rice" or "Remove sabzi"'/>
                <MealSection title="SNACKS"    emoji="🥜" meals={d.snacks}     mealKey="snacks"    dayName={dayName} onEdit={onEdit} editing={editing} placeholder='"Replace peanuts with almonds" or "Add fruit"'/>
              </div>
              );
            })()}
          </div>
        );
      })}
      {diet.notes && <Card style={{background:"rgba(0,255,135,.04)",border:"1px solid rgba(0,255,135,.2)"}}><div style={{fontSize:13,color:T.green}}>📝 {diet.notes}</div></Card>}
    </div>
  );
});

// ─── WORKOUT TAB ──────────────────────────────────────────────────────────────
const WorkoutDayRow = memo(({ wd, idx, isOpen, onToggle, onEdit, editing }) => {
  const [val, setVal] = useState("");
  const submit = useCallback(() => {
    if (!val.trim() || editing) return;
    onEdit(`On ${wd.day}: ${val.trim()}`);
    setVal("");
  }, [val, editing, onEdit, wd.day]);
  return (
    <div>
      <button onClick={onToggle} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",borderRadius:isOpen?"10px 10px 0 0":10,border:`1px solid ${isOpen?T.accent:T.border}`,background:isOpen?T.accentDim:T.card,cursor:"pointer",transition:"all .2s"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:isOpen?T.accent:T.text,width:86,textAlign:"left"}}>{wd.day}</span>
          <span style={{fontSize:12,color:T.sub}}>{wd.focus}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"'DM Mono'",fontSize:11,color:T.sub}}>{wd.duration}</span>
          <span style={{color:isOpen?T.accent:T.dim,fontSize:12}}>{isOpen?"▲":"▼"}</span>
        </div>
      </button>
      {isOpen && (
        <div style={{padding:"12px 16px",background:"#0C0C0C",borderRadius:"0 0 10px 10px",border:`1px solid ${T.accent}`,borderTop:"none"}}>
          <div style={{fontSize:12,color:T.sub,marginBottom:12}}>🔥 {wd.warmup}</div>
          {wd.exercises.map((ex,j)=>(
            <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
              <div>
                <div style={{fontSize:14,color:T.text,fontWeight:500}}>{ex.name}</div>
                {ex.notes && <div style={{fontSize:11,color:T.sub,marginTop:2}}>{ex.notes}</div>}
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                <div style={{fontFamily:"'DM Mono'",fontSize:13,color:T.accent}}>{ex.sets}×{ex.reps}</div>
                <div style={{fontFamily:"'DM Mono'",fontSize:10,color:T.sub}}>{ex.rest}</div>
              </div>
            </div>
          ))}
          <div style={{fontSize:12,color:T.sub,marginTop:10,marginBottom:12}}>🧘 {wd.cooldown}</div>
          <div style={{display:"flex",gap:6,marginTop:4}}>
            <input
              value={val}
              onChange={e=>setVal(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && submit()}
              placeholder={`e.g. "Replace bench press with push-ups" or "Add pull-ups"`}
              disabled={editing}
              style={{flex:1,fontSize:12,padding:"7px 10px",opacity:editing?0.5:1}}
            />
            <button
              onClick={submit}
              disabled={!val.trim()||editing}
              style={{padding:"7px 14px",borderRadius:8,border:"none",background:(!val.trim()||editing)?T.border:T.accent,color:(!val.trim()||editing)?T.dim:"#000",fontWeight:700,fontSize:12,cursor:(!val.trim()||editing)?"not-allowed":"pointer",flexShrink:0,transition:"all .2s",whiteSpace:"nowrap"}}
            >
              {editing ? "..." : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const WorkoutTab = memo(({ workout, onEdit, editing }) => {
  const [open, setOpen] = useState(null);
  if (!workout?.workoutDays) return <div style={{color:T.sub,padding:20,textAlign:"center"}}>No workout plan yet.</div>;
  return (
    <div className="si" style={{display:"flex",flexDirection:"column",gap:8}}>
      {workout.workoutDays.map((wd,i)=>(
        <WorkoutDayRow
          key={i} wd={wd} idx={i}
          isOpen={open===i}
          onToggle={()=>setOpen(open===i?null:i)}
          onEdit={onEdit} editing={editing}
        />
      ))}
      {workout.restDays?.length > 0 && (
        <Card><div style={{fontSize:13,color:T.sub}}>😴 <strong style={{color:T.text}}>Rest Days:</strong> {workout.restDays.join(", ")}</div></Card>
      )}
      {workout.generalNotes && (
        <Card><div style={{fontSize:13,color:T.sub}}>📝 {workout.generalNotes}</div></Card>
      )}
    </div>
  );
});

// ─── COST TAB ─────────────────────────────────────────────────────────────────
const CostTab = memo(({ cost, prices, onPricesChange, onRecalculate, recalculating }) => {
  const [editingPrices, setEditingPrices] = useState(false);
  const [localPrices, setLocalPrices] = useState({...prices});
  const [dirty, setDirty] = useState(false);

  const handlePriceChange = useCallback((key, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setLocalPrices(p=>({...p,[key]:num}));
    setDirty(true);
  }, []);

  const handleRecalculate = useCallback(() => {
    onPricesChange(localPrices);
    onRecalculate(localPrices);
    setDirty(false);
    setEditingPrices(false);
  }, [localPrices, onPricesChange, onRecalculate]);

  const handleReset = useCallback(() => {
    setLocalPrices({...DEFAULT_PRICES});
    setDirty(true);
  }, []);

  if (!cost) return <div style={{color:T.sub,padding:20,textAlign:"center"}}>No cost estimate yet.</div>;
  return (
    <div className="si" style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Card glow><Label>Weekly Cost</Label><div style={{fontFamily:"'Bebas Neue'",fontSize:36,color:T.accent}}>₹{cost.weeklyTotal}</div></Card>
        <Card><Label>Daily Avg</Label><div style={{fontFamily:"'Bebas Neue'",fontSize:36,color:T.text}}>₹{cost.dailyAverage}</div></Card>
      </div>
      <Card>
        <Label>Cost Breakdown</Label>
        {(cost.breakdown||[]).map((b,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
            <div><div style={{fontSize:13,color:T.text}}>{b.category}</div><div style={{fontSize:11,color:T.sub}}>{b.items}</div></div>
            <span style={{fontFamily:"'DM Mono'",fontSize:14,color:T.accent,flexShrink:0,marginLeft:12}}>₹{b.weeklyCost}</span>
          </div>
        ))}
      </Card>
      <Card style={editingPrices ? {border:`1px solid ${T.accentBorder}`} : {}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom: editingPrices ? 14 : 0}}>
          <Label style={{margin:0}}>Local Prices</Label>
          <button
            onClick={()=>{ setEditingPrices(e=>!e); setLocalPrices({...prices}); setDirty(false); }}
            style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,color:editingPrices?T.accent:T.sub,fontSize:12,padding:"4px 10px",cursor:"pointer",fontFamily:"'DM Sans'",fontWeight:600}}
          >
            {editingPrices ? "Cancel" : "Edit Prices"}
          </button>
        </div>
        {editingPrices && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {PRICE_CONFIG.map(group=>(
              <div key={group.category}>
                <div style={{fontSize:11,fontWeight:700,color:T.sub,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>{group.category}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {group.items.map(item=>(
                    <div key={item.key}>
                      <div style={{fontSize:11,color:T.sub,marginBottom:4}}>{item.label} <span style={{color:T.border}}>{item.unit}</span></div>
                      <div style={{position:"relative"}}>
                        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.accent,fontSize:13,fontFamily:"'DM Mono'",pointerEvents:"none"}}>₹</span>
                        <input type="number" min="0" step="0.5" value={localPrices[item.key]} onChange={e=>handlePriceChange(item.key, e.target.value)} style={{paddingLeft:24,fontFamily:"'DM Mono'",fontSize:13}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:8,paddingTop:4}}>
              <Btn onClick={handleRecalculate} disabled={recalculating||!dirty} full>
                {recalculating ? "Recalculating..." : "Recalculate Cost"}
              </Btn>
              <Btn variant="ghost" onClick={handleReset} sm>Reset</Btn>
            </div>
            <div style={{fontSize:11,color:T.sub,textAlign:"center"}}>Prices are saved and used for all future estimates</div>
          </div>
        )}
      </Card>
      {cost.savingTips?.length > 0 && (
        <Card style={{background:"rgba(170,255,0,.04)",border:`1px solid ${T.accentBorder}`}}>
          <Label>Saving Tips</Label>
          {cost.savingTips.map((t,i)=>(
            <div key={i} style={{fontSize:13,color:T.sub,marginBottom:8,paddingLeft:12,borderLeft:`2px solid ${T.accent}`}}>{t}</div>
          ))}
        </Card>
      )}
      {cost.notes && <Card><div style={{fontSize:12,color:T.sub}}>{cost.notes}</div></Card>}
    </div>
  );
});

// ─── CHECK-IN TAB ─────────────────────────────────────────────────────────────
const CheckInTab = memo(({ ww, setWw, onSubmit, loading, week, logs, prof }) => {
  const last = logs.length > 0 ? logs[logs.length-1].weight : prof.weight;
  return (
    <div className="si" style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:38,color:T.text,lineHeight:1.1}}>WEEK {week}<br/><span style={{color:T.accent}}>CHECK-IN</span></div>
      <p style={{fontSize:14,color:T.sub,lineHeight:1.6}}>Log your weight to trigger progressive overload updates and calorie adjustments.</p>
      <Card>
        <Label>Previous Weight</Label>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:T.sub}}>{last} kg</div>
      </Card>
      <Card>
        <Label>Today's Weight (kg)</Label>
        <input
          type="number" step=".1" min="30" max="300"
          placeholder="e.g. 72.4"
          value={ww}
          onChange={e=>setWw(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && !loading && ww && onSubmit()}
          style={{fontSize:28,padding:"14px",textAlign:"center",fontFamily:"'Bebas Neue'",letterSpacing:".04em"}}
        />
      </Card>
      <Card style={{background:T.accentDim,border:`1px solid ${T.accentBorder}`}}>
        <div style={{fontSize:13,color:T.accent,lineHeight:1.7}}>
          After submitting, agents will run:<br/>
          <span style={{color:T.sub}}>→ WeeklyUpdateAgent — analyze progress<br/>→ ProgressiveOverloadAgent — update workout (every 4 weeks)<br/>→ CalorieAdjustmentAgent — adjust diet (if needed)</span>
        </div>
      </Card>
      <Btn onClick={onSubmit} disabled={!ww||loading} full>
        {loading ? "⚡ Updating..." : "SUBMIT WEEK " + week + " UPDATE →"}
      </Btn>
    </div>
  );
});

// ─── PROGRESS TAB ─────────────────────────────────────────────────────────────
const ProgressTab = memo(({ logs, prof }) => {
  const all = useMemo(() => [{week:0,weight:prof.weight,date:"Start"},...logs], [logs, prof.weight]);
  if (logs.length===0) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 20px",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:12}}>📊</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:T.text}}>NO DATA YET</div>
      <div style={{fontSize:13,color:T.sub,marginTop:6}}>Submit your first weekly check-in to see progress here.</div>
    </div>
  );
  const maxW = Math.max(...all.map(w=>w.weight))+2;
  const minW = Math.min(...all.map(w=>w.weight))-2;
  const rng = maxW-minW||5;
  const W=300, H=140;
  const pts = all.map((w,i)=>({
    x:(i/(all.length-1||1))*(W-40)+20,
    y:H-20-((w.weight-minW)/rng)*(H-40),
    ...w
  }));
  const path = pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const total = logs.length>0 ? (logs[logs.length-1].weight - prof.weight).toFixed(1) : 0;
  const isPos = +total > 0;
  return (
    <div className="si" style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Card><Label>Starting Weight</Label><div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:T.sub}}>{prof.weight} kg</div></Card>
        <Card><Label>Total Change</Label><div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:isPos?T.green:T.red}}>{isPos?"+":""}{total} kg</div></Card>
      </div>
      <Card>
        <Label>Weight Trend</Label>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
          {[.25,.5,.75].map(t=>(
            <line key={t} x1="20" y1={t*(H-40)+20} x2={W-20} y2={t*(H-40)+20} stroke={T.border} strokeWidth="1"/>
          ))}
          <path d={path} fill="none" stroke={T.accent} strokeWidth="2.5"/>
          <path d={`${path} L ${pts[pts.length-1].x} ${H} L 20 ${H} Z`} fill={`${T.accent}08`}/>
          {pts.map((p,i)=>(
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill={T.accent} stroke={T.bg} strokeWidth="2"/>
              <text x={p.x} y={H-3} textAnchor="middle" fill={T.dim} fontSize="9" fontFamily="DM Mono">{p.week===0?"S":`W${p.week}`}</text>
              <title>{p.weight}kg ({p.date})</title>
            </g>
          ))}
        </svg>
      </Card>
      {[...logs].reverse().map((l,i)=>(
        <Card key={i}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:T.text}}>WEEK {l.week}</div>
              <div style={{fontSize:11,color:T.sub}}>{l.date}</div>
            </div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:26,color:T.accent}}>{l.weight} kg</div>
          </div>
          <div style={{fontSize:12,color:T.sub,lineHeight:1.6}}>{l.message}</div>
        </Card>
      ))}
    </div>
  );
});

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const sv = load();
  const [screen, setScreen]   = useState(sv?.calc?"dash":"onboard");
  const [step, setStep]       = useState(1);
  const [gen, setGen]           = useState(false);
  const [genMsg, setGenMsg]     = useState("");
  const [genElapsed, setGenElapsed]   = useState(0);
  const [genEstimate, setGenEstimate] = useState(22);
  const [tab, setTab]         = useState("overview");
  const [busy, setBusy]       = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const [err, setErr]         = useState(null);
  const [ww, setWw]           = useState("");
  const [editingDiet, setEditingDiet]       = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(false);

  const [prof, setProf] = useState(sv?.prof || {
    name:"", age:25, gender:"male", weight:70, height:170,
    workoutsPerWeek:3, goal:"maintain",
    dietType:"", dietTags:[], customDietNote:"", excludeFoods:""
  });
  const [calc, setCalc]     = useState(sv?.calc||null);
  const [diet, setDiet]     = useState(sv?.diet||null);
  const [workout, setWork]  = useState(sv?.workout||null);
  const [cost, setCost]     = useState(sv?.cost||null);
  const [logs, setLogs]     = useState(sv?.logs||[]);
  const [week, setWeek]     = useState(sv?.week||1);
  const [prices, setPrices] = useState(sv?.prices ? {...DEFAULT_PRICES,...sv.prices} : {...DEFAULT_PRICES});

  // Pre-computation cache (keyed so stale results are ignored)
  const precomp = useRef({ profile:null, profileKey:"", workout:null, workoutKey:"", diet:null, dietKey:"", cost:null, costKey:"" });
  const aborts  = useRef({});

  // Pre-computation status for Step 5 display
  const [precompStatus, setPrecompStatus] = useState({ WorkoutPlanAgent:false, DietPlanAgent:false, CostEstimatorAgent:false });

  // ── Debounced save ──
  useEffect(()=>{
    if(!calc) return;
    const t = setTimeout(()=>save({prof,calc,diet,workout,cost,logs,week,prices}), 400);
    return ()=>clearTimeout(t);
  },[prof,calc,diet,workout,cost,logs,week,prices]);

  // ── Generation timer ──
  useEffect(()=>{
    if(!gen){ setGenElapsed(0); return; }
    setGenElapsed(0);
    const t = setInterval(()=>setGenElapsed(s=>s+1), 1000);
    return ()=>clearInterval(t);
  },[gen]);

  // ── Build profile message ──
  const profileMsg = useMemo(()=>
    `Name:${prof.name||"User"}, Age:${prof.age}, Gender:${prof.gender}, Weight:${prof.weight}kg, Height:${prof.height}cm, Workouts/week:${prof.workoutsPerWeek}, Goal:${prof.goal}`,
    [prof.name,prof.age,prof.gender,prof.weight,prof.height,prof.workoutsPerWeek,prof.goal]);

  // ── Pre-compute disabled to respect free-tier rate limits ──
  // All API calls happen sequentially in generate() when user clicks "Generate"

  // ── Generate (all agents in parallel, uses cache when available) ──
  const generate = useCallback(async()=>{
    setGen(true); setErr(null);
    try{
      // Profile is instant — pure local math, no API call
      const c = calcProfile(prof);
      setCalc(c);

      // Build all messages upfront
      const workoutKey  = `${prof.workoutsPerWeek}_${prof.goal}`;
      const dietTypeObj = DIET_TYPES.find(d=>d.id===prof.dietType);
      const tagLabels   = (prof.dietTags||[]).map(id=>DIET_TAGS.find(t=>t.id===id)?.label).filter(Boolean);
      const dm = [
        profileMsg,
        `STRICT DAILY TARGETS (every day must hit these exactly ±30kcal/±5g): Calories=${c.targetCalories}kcal, Protein=${c.protein_g}g, Carbs=${c.carbs_g}g, Fat=${c.fat_g}g`,
        dietTypeObj?`Diet type (follow STRICTLY): ${dietTypeObj.label} — ${dietTypeObj.desc}`:`Diet type: balanced Indian diet`,
        tagLabels.length>0?`Additional preferences (must follow): ${tagLabels.join(", ")}`:null,
        prof.excludeFoods?.trim()?`Foods to NEVER include: ${prof.excludeFoods}`:null,
        prof.customDietNote?.trim()?`Extra notes: ${prof.customDietNote}`:null,
      ].filter(Boolean).join("\n");
      const cm       = `Goal:${prof.goal}, Target cal/day:${c.targetCalories}, Diet type:${prof.dietType||"balanced"}, Main foods:mixed Indian diet dal rice roti chicken eggs vegetables`;
      const dietKey  = `${prof.dietType}_${(prof.dietTags||[]).join("_")}_${c.targetCalories}_${prof.goal}`;
      const costKey  = `${prof.dietType}_${c.targetCalories}_${prof.goal}`;

      // Sequential calls with delays to stay within free-tier rate limits (5 req/min)
      setGenEstimate(180);
      setGenMsg("Running WorkoutPlanAgent...");

      const wk = await callAgentWithAudit("WorkoutPlanAgent",`${profileMsg}\nGoal:${prof.goal}, Workout days/week:${prof.workoutsPerWeek}`);

      setGenMsg("Waiting for rate limit cooldown...");
      await delay(15000);

      setGenMsg("Running DietPlanAgent...");
      const dt = await callAgentWithAudit("DietPlanAgent",dm);

      setGenMsg("Waiting for rate limit cooldown...");
      await delay(15000);

      setGenMsg("Running CostEstimatorAgent...");
      const cs = await callAgentWithAudit("CostEstimatorAgent",cm,buildCostPrompt(prices));
      setWork(wk); setDiet(dt); setCost(cs);
      setScreen("dash");
    }catch(e){
      if(e.name!=="AbortError") setErr(e.message);
    }finally{
      setGen(false);
    }
  },[prof,prices,profileMsg]);

  const recalculateCost = useCallback(async(updatedPrices)=>{
    if(!calc) return;
    setBusy(true); setBusyMsg("Recalculating costs with updated prices..."); setErr(null);
    try{
      const cm=`Goal:${prof.goal}, Target cal/day:${calc.targetCalories}, Diet type:${prof.dietType||"balanced"}, Main foods:mixed Indian diet dal rice roti chicken eggs vegetables`;
      const cs=await callAgentWithAudit("CostEstimatorAgent",cm,buildCostPrompt(updatedPrices));
      setCost(cs);
    }catch(e){ setErr(e.message); }
    finally{ setBusy(false); }
  },[calc,prof]);

  const weeklyUpdate = useCallback(async()=>{
    const nw=parseFloat(ww);
    if(isNaN(nw)) return;
    setBusy(true); setErr(null);
    try{
      const prev=logs.length>0?logs[logs.length-1].weight:prof.weight;
      setBusyMsg("Analyzing your progress...");
      const upd=await callAgentWithAudit("WeeklyUpdateAgent",
        `Prev:${prev}kg, Now:${nw}kg, Goal:${prof.goal}, CurrentTargetCal:${calc?.targetCalories}, Week:${week}`);
      setLogs(l=>[...l,{week,weight:nw,date:new Date().toLocaleDateString("en-IN"),assessment:upd.assessment,message:upd.message}]);
      setWeek(w=>w+1);

      const needsOverload = week % 4 === 0;
      const needsCalAdj   = upd.adjustCalories && upd.calorieChange !== 0;

      if(needsOverload || needsCalAdj){
        setBusyMsg("Updating your plan...");
        const nc = (calc?.targetCalories||2000) + (upd.calorieChange||0);
        // Fire both in parallel — they don't depend on each other
        const [nwk, nd] = await Promise.all([
          needsOverload
            ? callAgentWithAudit("ProgressiveOverloadAgent",
                `Current workout:${JSON.stringify(workout)}\nWeek:${week}, Goal:${prof.goal}`)
            : Promise.resolve(null),
          needsCalAdj
            ? callAgentWithAudit("CalorieAdjustmentAgent",
                `Current diet:${JSON.stringify(diet)}\nCurrentCal:${calc?.targetCalories}, NewTarget:${nc}, Change:${upd.calorieChange>0?"+":""}${upd.calorieChange}, Goal:${prof.goal}`)
            : Promise.resolve(null),
        ]);
        if(nwk) setWork(nwk);
        if(nd){ setDiet(nd); setCalc(c=>({...c,targetCalories:nc})); }
      }
      setWw(""); setTab("progress");
    }catch(e){ setErr(e.message); }
    finally{ setBusy(false); setBusyMsg(""); }
  },[ww,logs,prof,calc,workout,diet,week]);

  const editDiet = useCallback(async(request)=>{
    setEditingDiet(true); setErr(null);
    try{
      const nd=await callAgentWithAudit("DietEditAgent",
        `Current plan:\n${JSON.stringify(diet)}\n\nUser request: ${request}`);
      setDiet(nd);
    }catch(e){ setErr(e.message); }
    finally{ setEditingDiet(false); }
  },[diet]);

  const editWorkout = useCallback(async(request)=>{
    setEditingWorkout(true); setErr(null);
    try{
      const nw=await callAgentWithAudit("WorkoutEditAgent",
        `Current plan:\n${JSON.stringify(workout)}\n\nUser request: ${request}`);
      setWork(nw);
    }catch(e){ setErr(e.message); }
    finally{ setEditingWorkout(false); }
  },[workout]);

  const TABS = useMemo(()=>[
    {id:"overview",l:"Overview",i:"🏠"},
    {id:"diet",    l:"Diet",    i:"🥗"},
    {id:"workout", l:"Workout", i:"💪"},
    {id:"cost",    l:"Cost",    i:"₹"},
    {id:"checkin", l:"Check-in",i:"📊"},
    {id:"progress",l:"Progress",i:"📈"},
  ],[]);

  if(gen) return <LoadingScreen msg={genMsg} elapsed={genElapsed} estimated={genEstimate}/>;

  const base = {minHeight:"100vh",background:T.bg,color:T.text,maxWidth:480,margin:"0 auto",position:"relative"};

  // ── ONBOARDING ──
  if(screen==="onboard"){
    const steps=[
      <S1 p={prof} set={setProf}/>,
      <S2 p={prof} set={setProf}/>,
      <S3 p={prof} set={setProf}/>,
      <S4 p={prof} set={setProf}/>,
      <S5 p={prof} precompStatus={precompStatus}/>,
    ];
    return (
      <div style={base}>
        <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:T.accent,letterSpacing:".12em"}}>FITTRACK AI</span>
          <span style={{fontFamily:"'DM Mono'",fontSize:12,color:T.sub}}>{step} / 5</span>
        </div>
        <div style={{height:2,background:T.border,margin:"10px 20px"}}>
          <div style={{height:"100%",width:`${step/5*100}%`,background:T.accent,borderRadius:1,transition:"width .4s ease"}}/>
        </div>
        <div style={{padding:"12px 20px"}}>{steps[step-1]}</div>
        {err && (
          <div style={{margin:"0 20px",padding:"10px 14px",background:"rgba(255,77,77,.1)",border:`1px solid ${T.red}`,borderRadius:8,fontSize:13,color:T.red}}>⚠️ {err}</div>
        )}
        <div style={{padding:"16px 20px",display:"flex",gap:10,position:"sticky",bottom:0,background:`linear-gradient(to top,${T.bg} 70%,transparent)`}}>
          {step>1 && <Btn variant="ghost" onClick={()=>setStep(s=>s-1)} style={{flex:1}}>← Back</Btn>}
          {step<5
            ? <Btn onClick={()=>{
                if(step===1){
                  if(!prof.age||!prof.weight||!prof.height){
                    setErr("Please fill in Age, Weight, and Height to continue.");
                    return;
                  }
                }
                setErr(null);
                setStep(s=>s+1);
              }} style={{flex:2}}>Continue →</Btn>
            : <Btn onClick={generate} style={{flex:2}}>⚡ Generate My Plan</Btn>
          }
        </div>
      </div>
    );
  }

  // ── DOWNLOAD PLAN (Excel / SpreadsheetML) ──
  function downloadPlan() {
    const DAYS7 = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const goalLabel = {gaining:"Muscle Gain",cutting:"Fat Loss / Cut",lean_bulk:"Lean Bulk",maintain:"Maintain"}[prof.goal] || prof.goal;

    const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const C  = (val, type="String") => `<Cell><Data ss:Type="${type}">${esc(val)}</Data></Cell>`;
    const CB = (val, type="String") => `<Cell ss:StyleID="b"><Data ss:Type="${type}">${esc(val)}</Data></Cell>`;
    const CH = (val) => `<Cell ss:StyleID="h"><Data ss:Type="String">${esc(val)}</Data></Cell>`;
    const R  = (...cells) => `<Row>${cells.join("")}</Row>`;
    const GAP = "<Row/>";

    // ── Sheet 1: Summary ──
    const summaryRows = [
      R(CB("FITTRACK AI — PLAN SUMMARY")),
      R(C(`${prof.name||"User"} · ${goalLabel} · Week ${week} · ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}`)),
      GAP,
      ...(calc ? [
        R(CH("Metric"), CH("Value")),
        R(CB("Target Calories"), C(calc.targetCalories,"Number")),
        R(CB("TDEE"),            C(calc.tdee,"Number")),
        R(CB("BMR"),             C(calc.bmr,"Number")),
        R(CB("BMI"),             C(calc.bmi?.toFixed(1),"Number")),
        R(CB("BMI Category"),    C(calc.bmiCategory)),
        GAP,
        R(CH("Macro"),     CH("Grams / day")),
        R(CB("Protein"),   C(calc.protein_g,"Number")),
        R(CB("Carbs"),     C(calc.carbs_g,"Number")),
        R(CB("Fat"),       C(calc.fat_g,"Number")),
      ] : [R(C("No profile data yet"))]),
    ];

    // ── Sheet 2: Diet Plan ──
    const dietRows = [
      R(CH("Day"), CH("Meal"), CH("Food Item"), CH("Quantity"), CH("Calories"), CH("Protein (g)"), CH("Carbs (g)"), CH("Fat (g)")),
    ];
    if (diet?.weeklyPlan) {
      DAYS7.forEach(day => {
        const d = diet.weeklyPlan[day];
        if (!d) return;
        let firstRow = true;
        ["breakfast","lunch","dinner","snacks"].forEach(meal => {
          (d[meal]||[]).forEach((item, i) => {
            dietRows.push(R(
              firstRow ? CB(day) : C(""),
              i === 0   ? CB(meal.charAt(0).toUpperCase()+meal.slice(1)) : C(""),
              C(item.name), C(item.quantity),
              C(item.calories,"Number"), C(item.protein,"Number"),
              C(item.carbs,"Number"),    C(item.fat,"Number"),
            ));
            firstRow = false;
          });
        });
        dietRows.push(R(C(""), CB("Day Total"), C(""), C(""), C(d.totalCalories,"Number"), C(d.totalProtein,"Number")));
        dietRows.push(GAP);
      });
    } else {
      dietRows.push(R(C("No diet plan generated yet")));
    }

    // ── Sheet 3: Workout Plan ──
    const workoutRows = [
      R(CH("Day"), CH("Focus"), CH("Exercise"), CH("Sets"), CH("Reps"), CH("Rest"), CH("Notes"), CH("Duration")),
    ];
    if (workout?.workoutDays?.length) {
      workout.workoutDays.forEach(d => {
        (d.exercises||[]).forEach((ex, i) => {
          workoutRows.push(R(
            i===0 ? CB(d.day)   : C(""),
            i===0 ? CB(d.focus) : C(""),
            C(ex.name), C(ex.sets,"Number"), C(ex.reps), C(ex.rest), C(ex.notes||""),
            i===0 ? C(d.duration) : C(""),
          ));
        });
        if (d.warmup)   workoutRows.push(R(C(""), CB("Warmup"),   C(d.warmup)));
        if (d.cooldown) workoutRows.push(R(C(""), CB("Cooldown"), C(d.cooldown)));
        workoutRows.push(GAP);
      });
      if (workout.restDays?.length)  workoutRows.push(R(CB("Rest Days"), C(workout.restDays.join(", "))));
      if (workout.generalNotes)      workoutRows.push(R(CB("Notes"),     C(workout.generalNotes)));
    } else {
      workoutRows.push(R(C("No workout plan generated yet")));
    }

    // ── Sheet 4: Cost Estimate ──
    const costRows = [];
    if (cost?.weeklyTotal) {
      costRows.push(
        R(CH("Metric"), CH("Amount")),
        R(CB("Weekly Total (INR)"),  C(cost.weeklyTotal,"Number")),
        R(CB("Daily Average (INR)"), C(cost.dailyAverage,"Number")),
        GAP,
        R(CH("Category"), CH("Items"), CH("Weekly Cost (INR)")),
        ...(cost.breakdown||[]).map(b => R(CB(b.category), C(b.items), C(b.weeklyCost,"Number"))),
      );
      if (cost.savingTips?.length) {
        costRows.push(GAP, R(CB("Saving Tips")));
        cost.savingTips.forEach(t => costRows.push(R(C(""), C(t))));
      }
      if (cost.notes) costRows.push(GAP, R(CB("Notes"), C(cost.notes)));
    } else {
      costRows.push(R(C("No cost estimate generated yet")));
    }

    const colW = (w) => `<Column ss:Width="${w}"/>`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default"/>
  <Style ss:ID="b"><Font ss:Bold="1"/></Style>
  <Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1A1A1A" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Summary">
  <Table>${colW(160)}${colW(120)}${summaryRows.join("")}</Table>
 </Worksheet>
 <Worksheet ss:Name="Diet Plan">
  <Table>${colW(90)}${colW(90)}${colW(160)}${colW(100)}${colW(80)}${colW(80)}${colW(80)}${colW(70)}${dietRows.join("")}</Table>
 </Worksheet>
 <Worksheet ss:Name="Workout Plan">
  <Table>${colW(100)}${colW(120)}${colW(160)}${colW(50)}${colW(70)}${colW(80)}${colW(160)}${colW(80)}${workoutRows.join("")}</Table>
 </Worksheet>
 <Worksheet ss:Name="Cost Estimate">
  <Table>${colW(160)}${colW(200)}${colW(120)}${costRows.join("")}</Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fittrack-plan-${(prof.name||"user").toLowerCase().replace(/\s+/g,"-")}-week${week}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── DASHBOARD ──
  return (
    <div style={base}>
      <div style={{padding:"16px 20px 10px",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,background:T.bg,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:T.accent,letterSpacing:".12em"}}>FITTRACK AI</div>
            {prof.name && <div style={{fontSize:12,color:T.sub}}>Hey {prof.name} · Week {week}</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={downloadPlan} title="Download your full plan as HTML" style={{background:T.accentDim,border:`1px solid ${T.accentBorder}`,borderRadius:6,padding:"5px 12px",color:T.accent,fontSize:11,cursor:"pointer",fontFamily:"'DM Mono'",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3.5 6l2.5 2.5L8.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Download Plan
            </button>
            <button onClick={()=>{if(confirm("Reset all data?")){localStorage.removeItem(SK);window.location.reload();}}} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 10px",color:T.sub,fontSize:11,cursor:"pointer",fontFamily:"'DM Mono'"}}>Reset</button>
          </div>
        </div>
      </div>

      {busy && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:50}}>
          <div style={{width:34,height:34,borderRadius:"50%",border:`3px solid ${T.border}`,borderTopColor:T.accent}} className="spin"/>
          <div className="pulse" style={{fontFamily:"'DM Sans'",fontSize:14,color:T.accent,marginTop:16,textAlign:"center",padding:"0 24px"}}>{busyMsg}</div>
        </div>
      )}

      {err && (
        <div style={{margin:"10px 20px",padding:"9px 14px",background:"rgba(255,77,77,.1)",border:`1px solid ${T.red}`,borderRadius:8,fontSize:13,color:T.red,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>⚠️ {err}</span>
          <button onClick={()=>setErr(null)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:16}}>×</button>
        </div>
      )}

      <div style={{display:"flex",overflowX:"auto",borderBottom:`1px solid ${T.border}`}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,padding:"10px 12px",background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?T.accent:"transparent"}`,color:tab===t.id?T.accent:T.sub,fontFamily:"'DM Sans'",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,transition:"all .2s",whiteSpace:"nowrap"}}>
            <span>{t.i}</span><span>{t.l}</span>
          </button>
        ))}
      </div>

      <div style={{padding:"16px 20px 120px",overflowY:"auto"}}>
        {tab==="overview" && calc && <OverviewTab calc={calc} prof={prof} cost={cost} setTab={setTab} diet={diet}/>}
        {tab==="diet"     && <DietTab diet={diet} onEdit={editDiet} editing={editingDiet}/>}
        {tab==="workout"  && <WorkoutTab workout={workout} onEdit={editWorkout} editing={editingWorkout}/>}
        {tab==="cost"     && <CostTab cost={cost} prices={prices} onPricesChange={setPrices} onRecalculate={recalculateCost} recalculating={busy}/>}
        {tab==="checkin"  && <CheckInTab ww={ww} setWw={setWw} onSubmit={weeklyUpdate} loading={busy} week={week} logs={logs} prof={prof}/>}
        {tab==="progress" && <ProgressTab logs={logs} prof={prof}/>}
      </div>
    </div>
  );
}
