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
    console.error("Client AI Chat Proxy Error:", error);
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
