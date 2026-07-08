import { GoogleGenAI, Type } from "@google/genai";

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

export async function chatWithAi(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<AiSearchIntent> {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    return await response.json() as AiSearchIntent;
  } catch (error) {
    console.warn("Using offline AI chat simulation fallback on client:", error);

    // Attempt client-side direct Gemini API call if API key is provided on frontend (e.g. Netlify env)
    const clientApiKey = import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY;
    if (clientApiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: clientApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

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

        const systemInstruction = `
          You are Simba Smart, the elite AI shopping assistant for Simba Supermarket, Rwanda's premier retail chain.
          
          TONE: Helpful, professional yet ultra-bold, characteristic, and proud of Simba's Rwandan heritage. Use emojis occasionally (🦁, 🇷🇼, 🛒).

          CORE KNOWLEDGE:
          \${SIMBA_FACTS}

          USER CAPABILITIES:
          - You can help users find products.
          - You can answer questions about Simba's history, locations, branches, and services.
          - You can explain delivery terms (30m Kigali delivery, free over 50k RWF).

          SEARCH CAPABILITIES:
          If the user is looking for products, you MUST parse their request into search filters.
          Available Categories: Alcoholic Drinks, Baby Products, Cosmetics & Personal Care, Food Products, Kitchenware & Electronics, Sports & Wellness.
          
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
        `;

        const history = messages.slice(0, -1).map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user' as const,
          parts: [{ text: m.content }]
        }));

        const geminiResult = await ai.models.generateContent({
          model: "gemini-2.5-flash",
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

        const textResponse = geminiResult.text || '{}';
        const parsed = JSON.parse(textResponse);
        return parsed as AiSearchIntent;
      } catch (geminiErr) {
        console.error("Direct client-side Gemini API call failed:", geminiErr);
      }
    }
    
    const latest = messages[messages.length - 1]?.content || "";
    const lower = latest.toLowerCase().trim();
    
    let isSearch = false;
    let searchQuery = "";
    let category: string | null = null;
    let minPrice: number | null = null;
    let maxPrice: number | null = null;
    let assistantResponse = "";

    // 1. Check for price filters (e.g., "under 1000", "below 5000", "less than 10000")
    const maxPriceRegex = /(?:under|below|less\s+than|cheaper\s+than|under\s+rwf|below\s+rwf)\s*(?:rwf\s*)?(\d+)/i;
    const maxMatch = lower.match(maxPriceRegex);
    if (maxMatch) {
      maxPrice = parseInt(maxMatch[1], 10);
    }

    const minPriceRegex = /(?:above|over|more\s+than|greater\s+than|above\s+rwf|over\s+rwf)\s*(?:rwf\s*)?(\d+)/i;
    const minMatch = lower.match(minPriceRegex);
    if (minMatch) {
      minPrice = parseInt(minMatch[1], 10);
    }

    // 2. Classify categories based on keywords
    if (
      lower.includes('alcohol') || lower.includes('wine') || lower.includes('beer') || 
      lower.includes('whiskey') || lower.includes('gin') || lower.includes('vodka') || 
      lower.includes('cider') || lower.includes('cognac') || lower.includes('champagne') ||
      lower.includes('liquor') || lower.includes('drunk') || lower.includes('booze') ||
      lower.includes('cocktail') || lower.includes('whisky') || lower.includes('rum') ||
      lower.includes('tequila') || lower.includes('brandy') || lower.includes('liqueur') ||
      (lower.includes('drinks') && (lower.includes('adult') || lower.includes('party')))
    ) {
      category = 'Alcoholic Drinks';
      isSearch = true;
    } else if (
      lower.includes('baby') || lower.includes('kid') || lower.includes('diaper') || 
      lower.includes('wipe') || lower.includes('toy') || lower.includes('infant') || 
      lower.includes('lactogen') || lower.includes('formula') || lower.includes('pampers')
    ) {
      category = 'Baby Products';
      isSearch = true;
    } else if (
      lower.includes('skincare') || lower.includes('cream') || lower.includes('lotion') || 
      lower.includes('soap') || lower.includes('shampoo') || lower.includes('beauty') || 
      lower.includes('cosmetics') || lower.includes('hand wash') || lower.includes('perfume') ||
      lower.includes('deodorant') || lower.includes('toothpaste')
    ) {
      category = 'Cosmetics & Personal Care';
      isSearch = true;
    } else if (
      lower.includes('kitchen') || lower.includes('appliance') || lower.includes('pot') || 
      lower.includes('pan') || lower.includes('kettle') || lower.includes('electronic') || 
      lower.includes('blender') || lower.includes('microwave') || lower.includes('toaster') ||
      lower.includes('television') || lower.includes('tv') || lower.includes('iron')
    ) {
      category = 'Kitchenware & Electronics';
      isSearch = true;
    } else if (
      lower.includes('gym') || lower.includes('fitness') || lower.includes('wellness') || 
      lower.includes('workout') || lower.includes('sports') || lower.includes('massage') || 
      lower.includes('health') || lower.includes('protein') || lower.includes('supplement')
    ) {
      category = 'Sports & Wellness';
      isSearch = true;
    } else if (
      lower.includes('food') || lower.includes('milk') || lower.includes('bread') || 
      lower.includes('groceries') || lower.includes('rice') || lower.includes('flour') || 
      lower.includes('oil') || lower.includes('sugar') || lower.includes('honey') || 
      lower.includes('tea') || lower.includes('coffee') || lower.includes('snack') ||
      lower.includes('croissant') || lower.includes('breakfast') || lower.includes('dinner') ||
      lower.includes('ingredient') || lower.includes('spices') || lower.includes('sauce')
    ) {
      category = 'Food Products';
      isSearch = true;
    }

    // 3. Extract the product keyword (e.g. "milk", "bread", "diaper", etc.)
    let cleanQuery = lower;
    if (maxMatch) cleanQuery = cleanQuery.replace(maxMatch[0], '');
    if (minMatch) cleanQuery = cleanQuery.replace(minMatch[0], '');
    
    const stopPhrases = [
      'i want some', 'i want a', 'i want', 'i need some', 'i need a', 'i need', 
      'find some', 'find a', 'find', 'search for some', 'search for a', 'search for', 
      'show me some', 'show me a', 'show me', 'looking for some', 'looking for a', 'looking for', 
      'do you have some', 'do you have a', 'do you have', 'buy some', 'buy a', 'buy', 'please'
    ];

    for (const phrase of stopPhrases) {
      if (cleanQuery.includes(phrase)) {
        cleanQuery = cleanQuery.replace(phrase, '');
      }
    }

    const stopWords = ['i', 'want', 'need', 'buy', 'find', 'show', 'me', 'some', 'please', 'with', 'for', 'a', 'an', 'the', 'at', 'simba', 'supermarket', 'in', 'kigali', 'get', 'wanna', 'got', 'give', 'can', 'you', 'how', 'to', 'go', 'about', 'on', 'of', 'and', 'or'];
    let words = cleanQuery.split(/[\s,;?]+/).map(w => w.trim()).filter(w => w.length > 0);
    words = words.filter(w => !stopWords.includes(w));
    
    searchQuery = words.join(' ');

    const lowerQuery = searchQuery.toLowerCase();
    if (
      lowerQuery.includes('party') || 
      lowerQuery.includes('birthday') || 
      lowerQuery.includes('celebration') || 
      lowerQuery.includes('feast') || 
      lowerQuery.includes('event') || 
      lowerQuery.includes('stuff')
    ) {
      searchQuery = "cake, juice, soda, chocolate, chips, biscuit, cookie, wine, beer";
    }

    if (searchQuery || category) {
      isSearch = true;
    }

    // 4. Draft customized responses
    if (lower.includes('delivery') || lower.includes('how long') || lower.includes('ship')) {
      assistantResponse = "At Simba Supermarket, we deliver right to your doorstep anywhere in Kigali in under 30 minutes! ⚡ Best of all, delivery is completely FREE for all orders over 50,000 RWF! Otherwise, a standard local fee applies. Let me know what you'd like to order today! 🦁🛒";
    } else if (lower.includes('founded') || lower.includes('history') || lower.includes('who is') || lower.includes('owner') || lower.includes('start') || lower.includes('created')) {
      assistantResponse = "Simba Supermarket (SIMBA SUPERMARKET LTD) was founded on December 3, 2007, by Mr. Teklay Teame! 🇷🇼 Our first official branch was launched on August 8, 2008. Our mission has always been to meet the daily needs of Kigali residents with the absolute best prices and quality! 🦁✨";
    } else if (lower.includes('branch') || lower.includes('location') || lower.includes('where') || lower.includes('store') || lower.includes('gacuriro')) {
      assistantResponse = "We have 11 modern branches across Rwanda to serve you! 🇷🇼 Our major branches are located across Kigali, including Gacuriro (which features an incredible Arcade Games center for families!). Other branches offer our famous bakeries, butcheries, and Trucillo Coffee shops! 🥐☕";
    } else if (lower.includes('coffee') && lower.includes('trucillo')) {
      assistantResponse = "Yes! We proudly serve premium Italian Trucillo Cafe in 5 of our major branches! You can enjoy a fresh cup of coffee while you shop, or grab a package of coffee beans from our breakfast section. ☕🥐";
    } else if (lower.includes('arcade') || lower.includes('game') || lower.includes('play')) {
      assistantResponse = "Our Gacuriro branch features a fantastic Arcade Games zone! It's the perfect spot for kids and families to have fun while you shop. Come visit us soon! 🎮🦁";
    } else if (isSearch) {
      let filterDetails = "";
      if (category) filterDetails += ` in **${category}**`;
      if (maxPrice !== null) filterDetails += ` under **${maxPrice.toLocaleString()} RWF**`;
      if (minPrice !== null) filterDetails += ` above **${minPrice.toLocaleString()} RWF**`;

      if (searchQuery) {
        assistantResponse = `I would love to help you find **${searchQuery}**${filterDetails}! I have applied the smart search filters for you. Take a look at these matched items! 🛒🦁`;
      } else {
        assistantResponse = `I've opened the **${category || 'Products'}** section${filterDetails} for you! Check out our selection below. 🦁✨`;
      }
    } else {
      assistantResponse = `Hello! I am **Simba Smart** 🦁, your elite AI assistant for Simba Supermarket, Rwanda's premier retail chain. 🇷🇼\n\nI can help you find products, check prices (try "milk under 1000"), explain delivery terms (30-minute Kigali delivery, free over 50k RWF), or share our proud history and branch locations!\n\nWhat can I assist you with today? 🛒`;
    }

    return {
      isSearch,
      searchQuery,
      category,
      minPrice,
      maxPrice,
      assistantResponse
    };
  }
}

// Keep backward compatibility if needed
export async function parseSearchIntent(query: string): Promise<AiSearchIntent> {
  return chatWithAi([{ role: 'user', content: query }]);
}

export async function categorizeProductByName(name: string): Promise<string> {
  const lower = name.toLowerCase();

  // Instant Common-Sense Knowledge mapping (avoids unnecessary API calls for obvious standard items)
  if (
    lower.includes('olive oil') ||
    lower.includes('sunflower oil') ||
    lower.includes('cooking oil') ||
    lower.includes('avocado oil') ||
    lower.includes('pomace oil') ||
    lower.includes('vegetable oil') ||
    lower.includes('flour') ||
    lower.includes('baking powder') ||
    lower.includes('bread') ||
    lower.includes('curry powder') ||
    lower.includes('pilipili') ||
    lower.includes('akabanga') ||
    lower.includes('pepper') ||
    lower.includes('salt') ||
    lower.includes('crumbs') ||
    lower.includes('caramel') ||
    lower.includes('yeast') ||
    lower.includes('sauce') ||
    lower.includes('honey') ||
    lower.includes('spice')
  ) {
    return 'Food Products';
  }

  if (
    lower.includes('whiskey') ||
    lower.includes('wine') ||
    lower.includes('beer') ||
    lower.includes('gin') ||
    lower.includes('liqueur') ||
    lower.includes('vodka') ||
    lower.includes('cider') ||
    lower.includes('cognac') ||
    lower.includes('champagne') ||
    lower.includes('tequila') ||
    lower.includes('brandy') ||
    lower.includes('rum')
  ) {
    return 'Alcoholic Drinks';
  }

  if (
    lower.includes('diaper') ||
    lower.includes('baby wipe') ||
    lower.includes('infant') ||
    lower.includes('baby') ||
    lower.includes('pampers') ||
    lower.includes('toy') ||
    lower.includes('pacifier')
  ) {
    return 'Baby Products';
  }

  if (
    lower.includes('shampoo') ||
    lower.includes('soap') ||
    lower.includes('perfume') ||
    lower.includes('body wash') ||
    lower.includes('skincare') ||
    lower.includes('lotion') ||
    lower.includes('make up') ||
    lower.includes('cosmetics') ||
    lower.includes('toothpaste') ||
    lower.includes('deodorant')
  ) {
    return 'Cosmetics & Personal Care';
  }

  if (
    lower.includes('blender') ||
    lower.includes('microwave') ||
    lower.includes('toaster') ||
    lower.includes('kettle') ||
    lower.includes('pot') ||
    lower.includes('pan') ||
    lower.includes('refrigerator') ||
    lower.includes('tv') ||
    lower.includes('smart tv') ||
    lower.includes('electronic')
  ) {
    return 'Kitchenware & Electronics';
  }

  if (
    lower.includes('gym') ||
    lower.includes('fitness') ||
    lower.includes('dumbell') ||
    lower.includes('yoga') ||
    lower.includes('supplement') ||
    lower.includes('protein') ||
    lower.includes('workout')
  ) {
    return 'Sports & Wellness';
  }

  // Fallback to Server AI endpoint
  try {
    const response = await fetch("/api/ai/categorize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    const category = data.category || 'Food Products';

    const validCategories = [
      'Alcoholic Drinks',
      'Baby Products',
      'Cosmetics & Personal Care',
      'Food Products',
      'Kitchenware & Electronics',
      'Sports & Wellness'
    ];
    const matched = validCategories.find(c => c.toLowerCase() === category.toLowerCase());
    return matched || 'Food Products';
  } catch (error) {
    console.error("AI Categorization Error on client:", error);
    return 'Food Products';
  }
}

export function getProductImageByKeyword(keyword: string): string {
  const clean = (keyword || '').toLowerCase().trim();
  const dict: Record<string, string> = {
    milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=500',
    tea: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=500',
    coffee: 'https://images.unsplash.com/photo-1497935586351-b67a49e0a2e9?auto=format&fit=crop&q=80&w=500',
    honey: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=500',
    soap: 'https://images.unsplash.com/photo-1607006342411-9a3363b6320a?auto=format&fit=crop&q=80&w=500',
    bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=500',
    rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500',
    oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=500',
    flour: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=500',
    fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=500',
    vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=500',
    beverage: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500',
    juice: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=500',
    detergent: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=500',
    alcohol: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=500',
    beer: 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?auto=format&fit=crop&q=80&w=500',
    wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=500',
    whiskey: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&q=80&w=500',
    baby: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=500',
    diaper: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=500',
    lotion: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=500',
    cream: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=500',
    electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=500',
    kitchen: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=500',
    sports: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=500',
    wellness: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=500',
    groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=500',
    household: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=500'
  };

  for (const k of Object.keys(dict)) {
    if (clean.includes(k) || k.includes(clean)) {
      return dict[k];
    }
  }

  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=500';
}

export async function generateRwandanProductsDataset(department: string, count: number): Promise<any[]> {
  try {
    const response = await fetch("/api/ai/generate-products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ department, count })
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to generate Rwandan product dataset client proxy:", error);
    throw error;
  }
}
