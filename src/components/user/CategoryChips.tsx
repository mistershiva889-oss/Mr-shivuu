import React from 'react';
import { Category } from '../../types/index.ts';
import { Flame, Clock } from 'lucide-react';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  activeSort: 'latest' | 'trending';
  onSelectSort: (sort: 'latest' | 'trending') => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  activeSort,
  onSelectSort,
}) => {
  return (
    <div className="sticky top-14 z-20 bg-[#0a0d14]/95 backdrop-blur-sm border-b border-slate-800/60 py-2.5 px-3 w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap max-w-full">
        {/* Sort: Trending */}
        <button
          onClick={() => onSelectSort('trending')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
            activeSort === 'trending'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Trending</span>
        </button>

        {/* Sort: Latest */}
        <button
          onClick={() => onSelectSort('latest')}
          className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
            activeSort === 'latest'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Latest</span>
        </button>

        {/* Vertical divider */}
        <div className="w-[1px] h-4 bg-slate-800 shrink-0 mx-1" />

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-white text-slate-950 font-semibold shadow-xs'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
