import React from 'react';
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
      <div className="max-w-7xl mx-auto px-4 flex gap-8 sm:gap-12 h-20 items-center">
        <button
          onClick={() => onSelectCategory(null)}
          className="flex items-center gap-2 min-w-fit group transition-all"
        >
          <span className={cn(
            "text-lg font-black uppercase tracking-tight transition-all",
            selectedCategory === null ? "text-brand-primary italic underline underline-offset-8" : "opacity-80 hover:opacity-100 text-[var(--brand-text)]"
          )}>
            {t('all_categories')}
          </span>
          {selectedCategory === null && <span className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
        </button>

        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          const Icon = categoryIcons[category];
          
          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className="flex items-center gap-2 min-w-fit group transition-all"
            >
              {Icon && <Icon className={cn("h-4 w-4 transition-colors", isSelected ? "text-brand-primary" : "opacity-40 text-[var(--brand-text)]")} />}
              <span className={cn(
                "text-lg font-black uppercase tracking-tight transition-all",
                isSelected ? "text-brand-primary italic underline underline-offset-8" : "opacity-80 hover:opacity-100 text-[var(--brand-text)]"
              )}>
                {getCategoryLabel(category)}
              </span>
              {isSelected && <span className="w-1.5 h-1.5 bg-brand-primary rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
});

CategoryBar.displayName = 'CategoryBar';
export default CategoryBar;
