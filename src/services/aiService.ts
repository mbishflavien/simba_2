import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface AiSearchIntent {
  searchQuery: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  assistantResponse: string;
}

const CATEGORIES = [
  'Food & Groceries',
  'Household',
  'Alcohol',
  'Baby & Kids',
  'Personal Care',
  'Kitchenware',
  'Office Supplies',
  'Pet Care'
];

export async function parseSearchIntent(query: string): Promise<AiSearchIntent> {
  const systemInstruction = `
    You are the Simba Supermarket Smart Assistant. 
    Your goal is to parse a user's natural language shopping request into search filters.
    
    Available Categories: ${CATEGORIES.join(', ')}.
    
    Return a JSON object with:
    - searchQuery: a string containing 1-3 highly relevant keywords to find products (e.g., if they want cake ingredients, return "flour sugar baking").
    - category: one of the available categories or null.
    - minPrice: number or null.
    - maxPrice: number or null.
    - assistantResponse: a short, helpful, and ultra-bold characteristic response. (e.g. "Sourcing the freshest ingredients for your cake right now! 🔥")

    Example: "I need ingredients for a cake"
    Response: { "searchQuery": "flour sugar baking", "category": "Food & Groceries", "minPrice": null, "maxPrice": null, "assistantResponse": "Found the finest baking essentials for your masterpiece! 🎂" }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            searchQuery: { type: Type.STRING },
            category: { type: Type.STRING, nullable: true },
            minPrice: { type: Type.NUMBER, nullable: true },
            maxPrice: { type: Type.NUMBER, nullable: true },
            assistantResponse: { type: Type.STRING }
          },
          required: ["searchQuery", "assistantResponse"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as AiSearchIntent;
  } catch (error) {
    console.error("AI Search Error:", error);
    return {
      searchQuery: query,
      category: null,
      minPrice: null,
      maxPrice: null,
      assistantResponse: "I'll help you find that in our aisles."
    };
  }
}
