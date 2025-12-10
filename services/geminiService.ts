import { GoogleGenAI, Type } from "@google/genai";
import { ExperimentAnalysis, AIAnalysisResult } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeExperimentWithAI = async (
  analysis: ExperimentAnalysis
): Promise<AIAnalysisResult> => {
  try {
    const client = getClient();
    
    const prompt = `
      You are a Principal Data Scientist and CPO at a top tech company. 
      Analyze the following A/B experiment results.
      
      Experiment Context: "${analysis.name}"
      Data Summary: ${JSON.stringify(analysis.summary)}
      
      Automated Causal Engine Findings (Validation Layer): 
      ${JSON.stringify(analysis.causalFindings)}
      
      Task:
      1. Determine the final recommendation (SHIP, ITERATE, or ROLLBACK) based on the trade-offs between Primary (Growth) and Guardrail (Safety) metrics.
      2. Write a concise, professional executive summary.
      3. Explain the "Causal Findings" listed above in plain English as part of the "Causal Insights". 
         - If Simpson's Paradox is flagged, explain that the aggregation hides the true segment behavior.
         - If Selection Bias (SRM) is flagged, warn that the experiment is invalid.
         - If Cannibalization is flagged, explain the specific trade-off.
      4. Provide a confidence score (0-100). If high severity causal warnings exist (like SRM or Simpson's), confidence should be lower.

      Return the response in strictly valid JSON format matching this schema:
      {
        "executiveSummary": "string",
        "recommendation": "SHIP" | "ITERATE" | "ROLLBACK",
        "confidenceScore": number,
        "keyRisks": ["string"],
        "causalInsights": ["string"]
      }
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                executiveSummary: { type: Type.STRING },
                recommendation: { type: Type.STRING, enum: ["SHIP", "ITERATE", "ROLLBACK"] },
                confidenceScore: { type: Type.NUMBER },
                keyRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
                causalInsights: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["executiveSummary", "recommendation", "confidenceScore", "keyRisks", "causalInsights"]
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback for demo if API fails
    return {
      executiveSummary: "AI Analysis currently unavailable. Please check your API key configuration.",
      recommendation: "ITERATE",
      confidenceScore: 0,
      keyRisks: ["API Connection Error"],
      causalInsights: ["Unable to process causal inference without AI connection."]
    };
  }
};