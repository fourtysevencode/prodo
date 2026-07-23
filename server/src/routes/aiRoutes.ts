import { Env, AIPunishmentTask } from "../types";
import { createJsonResponse, createErrorResponse } from "../utils/cors";
import { generateSecureToken } from "../utils/googleAuth";

/**
 * Local fallback pool of whimsical & annoying punishment tasks
 * Used when external AI API keys are unconfigured or offline.
 */
const LOCAL_WHIMSICAL_TASKS: AIPunishmentTask[] = [
  {
    task_id: "local_01",
    task_type: "RIDDLE",
    title: "RIDDLE OF THE DISTRACTED HAMSTER",
    description: "Solve this absurdly specific trick riddle about a hamster browsing social feeds during deep work.",
    prompt: "A hamster wearing miniature glasses clicks 7 notification icons. Every icon adds 3 distraction points unless he spins on his wheel 4 times backwards. How many total wheel rotations must the hamster complete to neutralize 21 distraction points?",
    correct_answer: "28",
    explanation: "21 distraction points / 3 points per icon = 7 notification units. 7 units * 4 wheel spins = 28 total rotations!",
    provider_used: "local_template",
  },
  {
    task_id: "local_02",
    task_type: "TYPING_PLEDGE",
    title: "THE OVERLY ELABORATE ANTI-PROCRASTINATION PLEDGE",
    description: "Type this absurdly formal anti-procrastination pledge to restore cognitive authority.",
    prompt: "I hereby vow to conquer digital temptations, banish random tab hopping, and treat my attention span as sacred code.",
    correct_answer: "I hereby vow to conquer digital temptations, banish random tab hopping, and treat my attention span as sacred code.",
    explanation: "Character match validation required.",
    provider_used: "local_template",
  },
  {
    task_id: "local_03",
    task_type: "MULTIPLE_CHOICE",
    title: "HYPER-NICHE FOCUS TRIVIA",
    description: "Identify the primary cognitive enemy of deep work flow state retention.",
    prompt: "According to deep work focus doctrine, which of the following is considered the #1 silent killer of mental momentum?",
    options: [
      "Context switching between notification tabs",
      "Drinking green tea",
      "Listening to binaural focus beats",
      "Staring out the window for 5 seconds",
    ],
    correct_answer: "Context switching between notification tabs",
    explanation: "Context switching incurs attention residue that severely degrades cognitive throughput.",
    provider_used: "local_template",
  },
];

/**
 * Calls Google AI Studio API trying models in fallback sequence:
 * gemini-2.0-flash -> gemini-1.5-flash -> gemini-1.5-flash-8b -> gemma-2-27b-it
 */
async function callGeminiPipeline(apiKey: string, promptText: string): Promise<AIPunishmentTask | null> {
  const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemma-2-27b-it",
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8,
          },
        }),
      });

      if (!response.ok) continue;

      const data: any = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());

      if (parsed && parsed.title && parsed.prompt && parsed.correct_answer) {
        return {
          task_id: generateSecureToken("task_"),
          task_type: parsed.task_type || "MULTIPLE_CHOICE",
          title: String(parsed.title).toUpperCase(),
          description: String(parsed.description || "Resolve this whimsical punishment task."),
          prompt: String(parsed.prompt),
          options: Array.isArray(parsed.options) ? parsed.options : undefined,
          correct_answer: String(parsed.correct_answer).trim(),
          explanation: String(parsed.explanation || "Correct response verified."),
          provider_used: `google_ai_studio_${model}`,
        };
      }
    } catch (e) {
      console.warn(`Google AI Studio model ${model} failed, trying fallback...`, e);
    }
  }
  return null;
}

/**
 * Calls Groq API as secondary fallback.
 */
async function callGroqPipeline(apiKey: string, promptText: string): Promise<AIPunishmentTask | null> {
  const models = ["llama-3.3-70b-versatile", "llama3-8b-8192"];

  for (const model of models) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: promptText }],
          temperature: 0.8,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) continue;

      const data: any = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || "";
      const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());

      if (parsed && parsed.title && parsed.prompt && parsed.correct_answer) {
        return {
          task_id: generateSecureToken("task_"),
          task_type: parsed.task_type || "MULTIPLE_CHOICE",
          title: String(parsed.title).toUpperCase(),
          description: String(parsed.description || "Resolve this whimsical punishment task."),
          prompt: String(parsed.prompt),
          options: Array.isArray(parsed.options) ? parsed.options : undefined,
          correct_answer: String(parsed.correct_answer).trim(),
          explanation: String(parsed.explanation || "Correct response verified."),
          provider_used: `groq_${model}`,
        };
      }
    } catch (e) {
      console.warn(`Groq model ${model} failed, trying fallback...`, e);
    }
  }
  return null;
}

/**
 * Handles POST /ai/generate-punishment
 */
export async function handleGeneratePunishment(_request: Request, env: Env): Promise<Response> {
  try {
    const systemPrompt = `You are the Prodo Cognitive Punishment Enforcer AI. Generate a whimsical, hilarious, and delightfully annoying punishment task for a user who lost focus.
Return RAW JSON matching this exact structure:
{
  "task_type": "MULTIPLE_CHOICE" or "TYPING_PLEDGE" or "RIDDLE",
  "title": "WHIMSICAL SHORT TITLE IN ALL CAPS",
  "description": "Short explanation of the punishment protocol.",
  "prompt": "The whimsical prompt or riddle or pledge text.",
  "options": ["Option A", "Option B", "Option C", "Option D"] (ONLY for MULTIPLE_CHOICE),
  "correct_answer": "Exact string of the correct answer (must match one option if MULTIPLE_CHOICE, or exact number for RIDDLE, or exact text for TYPING_PLEDGE)",
  "explanation": "Short humorous explanation of why this answer is correct."
}`;

    // 1. Try Google AI Studio Pipeline
    if (env.GEMINI_API_KEY) {
      const task = await callGeminiPipeline(env.GEMINI_API_KEY, systemPrompt);
      if (task) return createJsonResponse({ success: true, task });
    }

    // 2. Try Groq Pipeline Fallback
    if (env.GROQ_API_KEY) {
      const task = await callGroqPipeline(env.GROQ_API_KEY, systemPrompt);
      if (task) return createJsonResponse({ success: true, task });
    }

    // 3. Fallback to Local Whimsical Template Pool
    const randomLocal = LOCAL_WHIMSICAL_TASKS[Math.floor(Math.random() * LOCAL_WHIMSICAL_TASKS.length)];
    return createJsonResponse({
      success: true,
      task: {
        ...randomLocal,
        task_id: generateSecureToken("task_"),
      },
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Failed to generate AI punishment task", 500);
  }
}

/**
 * Handles POST /ai/verify-punishment
 */
export async function handleVerifyPunishment(request: Request, _env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const submittedAnswer = String(body.user_answer || "").trim().toLowerCase();
    const correctAnswer = String(body.correct_answer || "").trim().toLowerCase();

    if (!submittedAnswer) {
      return createErrorResponse("Answer is required", 400);
    }

    const isMatch = submittedAnswer === correctAnswer ||
      (correctAnswer.length > 5 && submittedAnswer.includes(correctAnswer)) ||
      (submittedAnswer.length > 5 && correctAnswer.includes(submittedAnswer));

    if (isMatch) {
      return createJsonResponse({
        success: true,
        reward_xp: 250,
        message: "✓ COGNITIVE_AUTHORITY_RESTORED: +250 XP awarded.",
      });
    }

    return createJsonResponse({
      success: false,
      message: "❌ VERIFICATION_FAIL: Incorrect response. Cognitive penalty remains active.",
    });
  } catch (error: any) {
    return createErrorResponse(error.message || "Verification process failed", 500);
  }
}
