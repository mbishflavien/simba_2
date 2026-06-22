import productsData from '../data/products.json';
import { Product } from '../types';

export function augmentProductsList(baseList: Product[]): Product[] {
  const fileProducts = (productsData.products || []) as Product[];
  const mergedMap = new Map<string, Product>();

  // 1. Add all standard file products first (keyed by string ID)
  fileProducts.forEach(p => {
    mergedMap.set(String(p.id), p);
  });

  // 2. Add live Firestore products if available
  if (baseList && baseList.length > 0) {
    baseList.forEach(p => {
      mergedMap.set(String(p.id), p);
    });
  }

  const baseProducts = Array.from(mergedMap.values()).map(p => {
    const numId = Number(p.id);
    return {
      ...p,
      id: isNaN(numId) ? p.id : numId
    };
  });

  const originalCount = baseProducts.length;
  if (originalCount === 0) return [];

  const prefixes = [
    "Premium", "Choice", "Authentic", "Super", "Organic", 
    "Standard", "Kigali Special", "Simba's Own", "Traditional", "Selected"
  ];
  const suffixes = [
    "Pack of 2", "Bulk Edition", "Eco Pack", "Family Size", 
    "Value Pack", "Special Duo", "1L Extra", "500g Value"
  ];

  const targetCount = 789;
  const generatedProducts = [...baseProducts];

  let currentIdOffset = 1000000;
  let index = 0;

  // Use a pseudo-random seed generator so that the 789 items are deterministic
  let seed = 42;
  function random(): number {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  while (generatedProducts.length < targetCount) {
    const base = baseProducts[index % originalCount];
    const prefix = prefixes[Math.floor(random() * prefixes.length)];
    const suffix = suffixes[Math.floor(random() * suffixes.length)];
    
    const name = `${prefix} ${base.name} (${suffix})`;
    // Ensure ids do not collide
    const id = Number(base.id) + currentIdOffset;
    currentIdOffset += 10000;
    
    let price = typeof base.price === 'number' ? base.price : Number(base.price) || 1000;
    if (suffix.includes("Pack of 2") || suffix.includes("Duo")) {
      price = price * 1.85;
    } else if (suffix.includes("Family") || suffix.includes("Bulk")) {
      price = price * 2.5;
    } else {
      price = price * (0.95 + random() * 0.15);
    }
    
    price = Math.round(price / 100) * 100;
    const rating = Number((3.5 + random() * 1.5).toFixed(1));
    const reviewCount = Math.floor(random() * 500) + 10;
    
    generatedProducts.push({
      ...base,
      id: id,
      name: name,
      price: price,
      category: base.category,
      subcategoryId: base.subcategoryId,
      inStock: random() > 0.1,
      rating: rating,
      reviewCount: reviewCount
    });
    
    index++;
  }

  return generatedProducts;
}

export function get789Products(): Product[] {
  return augmentProductsList([]);
}

