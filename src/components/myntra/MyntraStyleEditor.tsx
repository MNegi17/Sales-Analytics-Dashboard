import React, { useState } from 'react';
import { useSalesStore } from '../../store/useSalesStore';
import { FOOTWEAR_CATEGORIES, APPAREL_CATEGORIES } from '../../engine/constants';

export const MyntraStyleEditor: React.FC = () => {
  const { myntraStyleCounts, updateMyntraStyleCount } = useSalesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<number>(0);
  const [savedCategory, setSavedCategory] = useState<string | null>(null);

  const allCategories = [...FOOTWEAR_CATEGORIES, ...APPAREL_CATEGORIES];

  const filteredCategories = allCategories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.division.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (catName: string, currentCount: number) => {
    setEditingCategory(catName);
    setTempValue(currentCount);
  };

  const handleSaveClick = (catName: string) => {
    updateMyntraStyleCount(catName, tempValue);
    setEditingCategory(null);
    setSavedCategory(catName);
    setTimeout(() => setSavedCategory(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 clean-panel p-5 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Online Style Count Manager</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directly edit and update Style Counts per category across all marketplaces
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg clean-input text-xs"
          />
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map(cat => {
          const currentCount = myntraStyleCounts[cat.name] ?? cat.defaultMyntraStyleCount ?? 0;
          const isEditing = editingCategory === cat.name;
          const isJustSaved = savedCategory === cat.name;

          return (
            <div 
              key={cat.name} 
              className={`clean-panel p-4 rounded-xl border transition-all ${
                isJustSaved ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {cat.division}
                </span>
                {isJustSaved && (
                  <span className="text-xs text-emerald-700 font-bold">
                    ✓ Saved
                  </span>
                )}
              </div>

              <h4 className="font-bold text-slate-900 text-sm mb-3">{cat.name}</h4>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Style Count:</span>

                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      value={tempValue}
                      onChange={e => setTempValue(parseInt(e.target.value, 10) || 0)}
                      className="w-16 px-2 py-1 rounded clean-input text-xs font-mono font-bold text-right"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveClick(cat.name)}
                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <span className="text-base font-extrabold text-brand-700 font-mono">
                      {currentCount}
                    </span>
                    <button
                      onClick={() => handleEditClick(cat.name, currentCount)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
