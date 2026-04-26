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
  'Alcoholic Drinks',
  'Baby Products',
  'Cosmetics & Personal Care',
  'Food Products',
  'Kitchenware & Electronics',
  'Sports & Wellness'
];

export async function parseSearchIntent(query: string): Promise<AiSearchIntent> {
  const systemInstruction = `
    You are the Simba Supermarket Smart Assistant (Simba Smart). 
    Your goal is to parse a user's natural language shopping request into search filters.
    
    CRITICAL: 
    - Use THESE Categories: ${CATEGORIES.join(', ')}.
    - Mapping synonyms: 
      - "liquor", "wine", "beer", "whiskey", "beverages", "drinks" -> Category: Alcoholic Drinks.
      - "snacks", "groceries", "food", "ingredients", "spices" -> Category: Food Products.
      - "babies", "kids", "diapers", "toys" -> Category: Baby Products.
      - "skincare", "soap", "shampoo", "beauty", "cosmetics" -> Category: Cosmetics & Personal Care.
      - "gym", "fitness", "health", "massage" -> Category: Sports & Wellness.
      - "appliances", "electronic", "pans", "pots", "kitchen" -> Category: Kitchenware & Electronics.

    Return a JSON object with:
    - searchQuery: a string containing 1-2 highly relevant generic keywords found in our database (e.g., if they want "liquor", use "alcohol" or "cognac" if appropriate, but generally keep it simple and inclusive).
    - category: one of the EXACT categories listed above or null if not clear.
    - minPrice: number or null.
    - maxPrice: number or null.
    - assistantResponse: a short, helpful, and ultra-bold characteristic response. (e.g. "Sourcing the finest spirits for your collection! 🥃")

    Example: "I need some liquor for a party"
    Response: { "searchQuery": "alcohol", "category": "Alcoholic Drinks", "minPrice": null, "maxPrice": null, "assistantResponse": "Found the perfect spirits to get the party started! 🥂" }
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
