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
    
    Mapping synonyms (BE VERY CAREFUL to prevent false positive matches):
    - "liquor", "wine", "beer", "whiskey", "gin", "vodka", "cider", "alcohol", "alcoholic" -> Category: Alcoholic Drinks.
    - "snacks", "groceries", "food", "ingredients", "spices", "beverages", "drinks", "soda", "juice", "tea", "coffee", "water", "milk", "bread", "meal", "breakfast", "dinner", "lunch" -> Category: Food Products.
    - "babies", "kids", "diapers", "toys", "infant" -> Category: Baby Products.
    - "skincare", "soap", "shampoo", "beauty", "cosmetics", "lotion", "perfume", "cream" -> Category: Cosmetics & Personal Care.
    - "gym", "fitness", "health", "massage", "workout" -> Category: Sports & Wellness.
    - "appliances", "electronic", "pans", "pots", "kitchen", "blender", "kettle" -> Category: Kitchenware & Electronics.

    CONVERSATION MEMORY & LONG DIALOG RULES (CRITICAL):
    - You must determine search intent based primarily on the user's LATEST message.
    - Avoid context bleeding or repeating the same results. If the user shifts the topic to a new food or category (e.g., they ask for "diapers" after previously discussing "breakfast"), you MUST completely discard the previous search parameters (searchQuery, category, minPrice, maxPrice) and only search for the new topic (diapers).
    - If the user asks a general non-search question (e.g., "how long does delivery take?" or "tell me about Simba history"), return { "isSearch": false, "searchQuery": "", "category": null, "minPrice": null, "maxPrice": null, "assistantResponse": "[Your answer]" }. Do not carry over the previous query parameters.
    - If the user asks to "clear search", "reset filters", "show everything", "show all products", or "done", you MUST return { "isSearch": true, "searchQuery": "", "category": null, "minPrice": null, "maxPrice": null, "assistantResponse": "I have cleared the search filters for you! Let me know what else you're looking for. 🦁" }.

    SEMANTIC & THEMATIC EXPANSION (CRITICAL FOR THEME QUERIES):
    If the user requests items for a specific theme, occasion, meal, or intent rather than a specific product name (e.g. "something for breakfast", "dinner", "braai/BBQ", "baby shower", "healthy snack", "skincare routine", "baking ingredients", "house cleaning"), you MUST expand this theme into a comma-separated list of highly common and specific target product items representing that theme.
    
    Examples:
    - User: "i need something for breakfast"
      Response JSON matches: { "isSearch": true, "searchQuery": "milk, bread, tea, coffee, juice, egg, butter, croissant, honey", "category": "Food Products", "assistantResponse": "I'll find you some delicious breakfast options like Inyange milk, fresh Simba bread, and tea/coffee from our bakery and grocery sections! 🥯🍳☕" }
    - User: "baking ingredients"
      Response JSON matches: { "isSearch": true, "searchQuery": "flour, sugar, egg, butter, vanilla, baking powder, cream, milk", "category": "Food Products", "assistantResponse": "I've loaded a list of essential baking ingredients like flour, sugar, butter, and milk so we can get baking! 🍰" }
    - User: "skincare routine items"
      Response JSON matches: { "isSearch": true, "searchQuery": "soap, cream, lotion, shampoo, wash, body oil, sanitizer", "category": "Cosmetics & Personal Care", "assistantResponse": "Here are excellent personal care and cosmetics products for your skin! 🧴✨" }

    OUTPUT FORMAT:
    You MUST return a JSON object with:
    - isSearch: boolean (true if the user is asking to find products, false for general conversation).
    - searchQuery: a string containing 1-2 generic keywords OR a list of comma-separated expanded keywords if isSearch is true, otherwise empty string.
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
      model: "gemini-3.5-flash",
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
