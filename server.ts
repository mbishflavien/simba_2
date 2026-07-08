import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Port & Host binding as required
const PORT = 3000;
const HOST = "0.0.0.0";

const app = express();
app.use(express.json({ limit: "10mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

// AI Endpoints
app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

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
    - "liquor", "wine", "beer", "whiskey", "whisky", "gin", "vodka", "drunk", "booze", "cocktail", "rum", "tequila", "brandy", "liqueur", "cider", "alcohol", "alcoholic" -> Category: Alcoholic Drinks.
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

    let textResponse = response.text || '{}';
    if (textResponse.startsWith('```')) {
      textResponse = textResponse.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    }
    const parsed = JSON.parse(textResponse);
    res.json(parsed);
  } catch (error) {
    console.error("AI Chat Error on Server:", error);
    res.status(500).json({
      isSearch: false,
      searchQuery: "",
      category: null,
      minPrice: null,
      maxPrice: null,
      assistantResponse: "I'm having a momentary lapse in connection. How else can I assist you at Simba? 🦁"
    });
  }
});

app.post("/api/ai/categorize", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }

  try {
    const systemInstruction = `
      You are an elite product taxonomist for Simba Supermarket.
      Your task is to classify a product name into one of these exact categories based on common knowledge:
      - 'Baby Products'
      - 'Cosmetics & Personal Care'
      - 'Food Products'
      - 'Kitchenware & Electronics'
      - 'Sports & Wellness'
      - 'Alcoholic Drinks'

      Rules:
      - Cooking oils, extra virgin olive oil, flour, sugar, curry powder, Akabanga pepper are strictly "Food Products" (NEVER 'Alcoholic Drinks' or 'Cosmetics & Personal Care').
      - Actively analyze the name to determine what the product actually is.
      - Return ONLY the exact category name. Do not output markdown, brackets, or any extra text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Product Name: "${name}"`,
      config: {
        systemInstruction,
        temperature: 0.1,
      }
    });

    const category = response.text?.trim() || 'Food Products';
    res.json({ category });
  } catch (error) {
    console.error("AI Categorization Error on Server:", error);
    res.json({ category: 'Food Products' });
  }
});

app.post("/api/ai/generate-products", async (req, res) => {
  const { department, count } = req.body;
  if (!department || !count) {
    return res.status(400).json({ error: "Department and count are required" });
  }

  try {
    const systemInstruction = `
      You are an expert procurement and retail catalog system architect for Simba Supermarket, Rwanda's premier supermarket chain.
      Your task is to generate realistic, accurate, and high-quality retail products frequently sold in supermarkets in Rwanda for the department/category specified by the user.

      CRITICAL METADATA ACCURACY FOR RWANDA:
      - Brands: Focus on actual brands popular in Rwanda (e.g., Inyange for dairy/juice, Akabanga for chili, Sulfo for soaps/detergents, Kinazi for cassava flour, Gorilla Feed for tea, Huye Mountain or Cafe Maraba for coffee, Bralirwa, Skol, or local banana beer like Urwagwa for drinks, Minimex for maize flour, SOSOMA for nutritional porridge flour, Urwibutso/Sina Gerard for jams/juices, etc.).
      - Names: Provide descriptive and professional retail product naming formats.
      - Prices: Must reflect typical Kigali market prices in Rwandan Francs (RWF). For example:
        * 1L Inyange Whole Milk: ~1,000 to 1,500 RWF.
        * Akabanga Golden Chili (20ml): ~500 to 800 RWF.
        * Sulfo Savon de Kigali: ~400 to 600 RWF.
        * Local tea/coffee pack (250g): ~1,500 to 4,500 RWF.
        * Standard bread loaf: ~1,000 to 2,000 RWF.
        * 1kg Kinazi Cassava Flour: ~1,200 to 2,000 RWF.
        Ensure you do not put absurd prices. E.g. don't sell a loaf of bread for 80,000 RWF, keep it highly realistic.
      - Cost Price: For wholesale budgeting, provide a 'costPrice' that is realistically 20% to 35% lower than the retail price, allowing for realistic profit tracking.
      - Units: Use familiar retail packaging units (e.g., "1L Bottle", "500g Pack", "100ml Glass Jar", "20ml Bottle", "Kg", "Pcs", "Box of 12").
      - Stock Counts: Stocks should be realistic numbers between 20 and 150.
      - Image Search Keywords: Generate an 'imageKeyword' string containing a high-quality, relevant search-friendly keyword (e.g., "milk", "tea", "coffee", "honey", "juice", "soap", "beer", "wine", "detergent", "oil", "rice", "flour") so that we can map it to gorgeous visuals.
      - Barcodes: Generate unique 13-digit EAN barcodes starting with "641..." (Rwanda prefix or similar) or standard random digits.
      - Expiry Dates: For perishables, set logical dates about 10-30 days in the future. For non-perishables, set dates 6 to 18 months in the future. Ensure you format expiryDate as a standard ISO string, date-only "YYYY-MM-DD" style.
    `;

    const prompt = `Generate exactly ${count} highly realistic Rwandan retail products for the department/category: "${department}".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Professional product name with brand (e.g. Inyange Whole Milk 1L, Akabanga Golden Chili Oil)" },
              price: { type: Type.INTEGER, description: "Logical retail price in RWF (e.g. 1200)" },
              costPrice: { type: Type.INTEGER, description: "Logical supplier cost price in RWF (e.g. 900)" },
              category: { type: Type.STRING, description: "Assign to a standard department category (e.g. Groceries, Beverages, Household, Food Products, Cosmetics & Personal Care, Alcoholic Drinks)" },
              unit: { type: Type.STRING, description: "Packaging format (e.g. 1L Bottle, 500g Pack, Pcs)" },
              stockCount: { type: Type.INTEGER, description: "Starting stock quantity (e.g. 45)" },
              barcode: { type: Type.STRING, description: "13-digit unique product barcode" },
              expiryDate: { type: Type.STRING, description: "Expiry date in YYYY-MM-DD format based on product type" },
              imageKeyword: { type: Type.STRING, description: "Single keyword representing the product, e.g. 'milk', 'honey', 'coffee', 'soap'" }
            },
            required: ["name", "price", "costPrice", "category", "unit", "stockCount", "barcode", "expiryDate", "imageKeyword"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json(parsed);
  } catch (error) {
    console.error("Failed to generate Rwandan product dataset on Server:", error);
    res.status(500).json({ error: "Failed to generate products" });
  }
});

// Vite & Static file serving setup
async function start() {
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });

  if (process.env.NODE_ENV !== "production" && vite) {
    server.on('upgrade', (req, socket, head) => {
      vite.ws.handleUpgrade(req, socket, head);
    });
  }
}

start();
