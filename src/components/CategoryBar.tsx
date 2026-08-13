import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { 
  Beef, 
  Wine, 
  Sparkles, 
  Baby, 
  ChefHat, 
  Package, 
  LayoutGrid, 
  Smartphone,
  Wrench
} from 'lucide-react';

interface CategoryBarProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  getCategoryLabel: (category: string) => string;
}

const categoryIcons: Record<string, any> = {
  "Food & Groceries": Beef,
  "Alcohol": Wine,
  "Personal Care": Sparkles,
  "Baby & Kids": Baby,
  "Kitchenware": Smartphone,
  "Pet Care": ChefHat,
  "Other": Package,
  "Household": Wrench,
  "Office Supplies": LayoutGrid
};

export const CategoryBar = React.memo(({ categories, selectedCategory, onSelectCategory, getCategoryLabel }: CategoryBarProps) => {
  const { t } = useTranslation();

  return (
    <div className="nav-blur border-none overflow-x-auto no-scrollbar scroll-smooth">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex gap-8 sm:gap-14 h-24 sm:h-28 items-center">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onSelectCategory(null)}
          className="flex flex-col items-center gap-1.5 min-w-fit group transition-all relative py-2 cursor-pointer"
        >
          <span className={cn(
            "text-base sm:text-xl font-display font-black uppercase tracking-tighter transition-all duration-300",
            selectedCategory === null ? "text-brand-primary italic scale-105" : "opacity-40 hover:opacity-100 text-[var(--brand-text)]"
          )}>
            {t('all_categories')}
          </span>
          {selectedCategory === null && (
            <motion.div 
               layoutId="category-underline"
               transition={{ type: "spring", stiffness: 450, damping: 32 }}
               className="absolute -bottom-1 h-1 w-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-md shadow-brand-primary/50" 
            />
          )}
        </motion.button>

        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          
          return (
            <motion.button
              key={category}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectCategory(category)}
              className="flex flex-col items-center gap-1.5 min-w-fit group transition-all relative py-2 cursor-pointer"
            >
              <span className={cn(
                "text-base sm:text-xl font-display font-black uppercase tracking-tighter transition-all duration-300",
                isSelected ? "text-brand-primary italic scale-105" : "opacity-40 hover:opacity-100 text-[var(--brand-text)]"
              )}>
                {getCategoryLabel(category)}
              </span>
              {isSelected && (
                <motion.div 
                  layoutId="category-underline"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute -bottom-1 h-1 w-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-md shadow-brand-primary/50" 
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

CategoryBar.displayName = 'CategoryBar';
export default CategoryBar;
