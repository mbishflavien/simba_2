import fs from 'fs';

const productsData = JSON.parse(fs.readFileSync('./src/data/products.json', 'utf8'));

const categoryMap = {
  13: 'Household',
  15: 'Personal Care', // Massage roller
  16: 'Baby Products',
  19: 'Kitchenware & Electronics',
  22: 'Office Supplies',
  27: 'Alcoholic Drinks',
  29: 'Pet Care',
  58: 'Baby Products',
  61: 'Food & Groceries',
  62: 'Food & Groceries',
  65: 'Food & Groceries',
  66: 'Food & Groceries',
  67: 'Food & Groceries',
  70: 'Food & Groceries',
  71: 'Food & Groceries',
  72: 'Food & Groceries',
  131: 'Food & Groceries',
  673: 'Food & Groceries'
};

productsData.products = productsData.products.map(p => ({
  ...p,
  category: categoryMap[p.subcategoryId] || p.category
}));

fs.writeFileSync('./src/data/products.json', JSON.stringify(productsData, null, 2));
console.log('Successfully updated products.json');
