import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface AiSearchIntent {
  searchQuery: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  assistantResponse: string;
  isSearch: boolean;
}

const CATEGORIES = [
  'Alcoholic Drinks',
  'Baby Products',
  'Cosmetics & Personal Care',
  'Food Products',
  'Kitchenware & Electronics',
  'Sports & Wellness'
];

const SIMBA_FACTS = `
  Simba Supermarket (SIMBA SUPERMARKET LTD) Details:
  - Founded: December 3, 2007, by Mr. Teklay Teame.
  - Mission: To meet people's daily needs in Kigali, Rwanda, and become the region's largest retail outlet.
  - Branches: 11 branches across Rwanda, including Kigali. Major ones include Gacuriro (with Arcade Games).
  - Services: Butchery, bakery, coffee shop (Trucillo Cafe in 5 major branches), electronics, furniture, clothing, stationary, and toys.
  - Delivery: Kigali delivery in 30 minutes. Free delivery over 50,000 RWF.
  - History: Officially launched August 8, 2008. One of Rwanda's most admired supermarkets.
  - Values: Respect for individuals, Service to customers, Striving for Excellence.
`;

export async function chatWithAi(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<AiSearchIntent> {
  const systemInstruction = `
    You are Simba Smart, the elite AI shopping assistant for Simba Supermarket, Rwanda's premier retail chain.
    
    TONE: Helpful, professional yet ultra-bold, characteristic, and proud of Simba's Rwandan heritage. Use emojis occasionally (🦁, 🇷🇼, 🛒).

    CORE KNOWLEDGE:
    ${SIMBA_FACTS}

    USER CAPABILITIES:
    - You can help users find products.
    - You can answer questions about Simba's history, locations, branches, and services.
    - You can explain delivery terms (30m Kigali delivery, free over 50k RWF).

    SEARCH CAPABILITIES:
    If the user is looking for products, you MUST parse their request into search filters.
    Available Categories: ${CATEGORIES.join(', ')}.
    
    Mapping synonyms: 
    - "liquor", "wine", "beer", "whiskey", "beverages", "drinks" -> Category: Alcoholic Drinks.
    - "snacks", "groceries", "food", "ingredients", "spices" -> Category: Food Products.
    - "babies", "kids", "diapers", "toys" -> Category: Baby Products.
    - "skincare", "soap", "shampoo", "beauty", "cosmetics" -> Category: Cosmetics & Personal Care.
    - "gym", "fitness", "health", "massage" -> Category: Sports & Wellness.
    - "appliances", "electronic", "pans", "pots", "kitchen" -> Category: Kitchenware & Electronics.

    OUTPUT FORMAT:
    You MUST return a JSON object with:
    - isSearch: boolean (true if the user is asking to find products, false for general conversation).
    - searchQuery: a string containing 1-2 generic keywords if isSearch is true, otherwise empty string.
    - category: one of the EXACT categories above or null if isSearch is false or not clear.
    - minPrice: number or null.
    - maxPrice: number or null.
    - assistantResponse: Your conversational reply to the user. This should be high-quality and directly answer their question or confirm you're searching for them.

    Example (General): "When was Simba founded?"
    Response: { "isSearch": false, "searchQuery": "", "category": null, "minPrice": null, "maxPrice": null, "assistantResponse": "Simba Supermarket was established on December 3, 2007! We've been serving the heart of Rwanda for over 15 years. 🦁" }

    Example (Search): "I want some diapers under 20000"
    Response: { "isSearch": true, "searchQuery": "diapers", "category": "Baby Products", "minPrice": null, "maxPrice": 20000, "assistantResponse": "I'll find the best care for your little ones within your budget. Let's look at these diapers! 👶" }
  `;

  try {
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user' as const,
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: 'user', parts: [{ text: messages[messages.length - 1].content }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSearch: { type: Type.BOOLEAN },
            searchQuery: { type: Type.STRING },
            category: { type: Type.STRING, nullable: true },
            minPrice: { type: Type.NUMBER, nullable: true },
            maxPrice: { type: Type.NUMBER, nullable: true },
            assistantResponse: { type: Type.STRING }
          },
          required: ["isSearch", "searchQuery", "assistantResponse"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as AiSearchIntent;
  } catch (error) {
    console.error("AI Chat Error:", error);
    return {
      isSearch: false,
      searchQuery: "",
      category: null,
      minPrice: null,
      maxPrice: null,
      assistantResponse: "I'm having a momentary lapse in connection. How else can I assist you at Simba? 🦁"
    };
  }
}

// Keep backward compatibility if needed, but we'll likely move to chatWithAi
export async function parseSearchIntent(query: string): Promise<AiSearchIntent> {
  return chatWithAi([{ role: 'user', content: query }]);
}
