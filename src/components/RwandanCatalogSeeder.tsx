import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RefreshCcw, 
  Check, 
  Trash2, 
  Plus, 
  Save, 
  CornerDownRight, 
  Database,
  ArrowRight,
  Calculator,
  Info
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { generateRwandanProductsDataset, getProductImageByKeyword } from '../services/aiService';
import { formatCurrency, cn } from '../lib/utils';

interface RwandanCatalogSeederProps {
  onSeedingComplete?: () => void;
  categoriesList: string[];
}

export default function RwandanCatalogSeeder({ onSeedingComplete, categoriesList }: RwandanCatalogSeederProps) {
  const [department, setDepartment] = useState('Groceries');
  const [customKeyword, setCustomKeyword] = useState('');
  const [generateCount, setGenerateCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Local list of generated draft products
  const [draftProducts, setDraftProducts] = useState<any[]>([]);
  const [publishLogs, setPublishLogs] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const presetDepartments = [
    'Groceries',
    'Beverages',
    'Household',
    'Alcoholic Drinks',
    'Baby Products',
    'Cosmetics & Personal Care',
    'Kitchenware & Electronics',
    'Sports & Wellness'
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPublishLogs(null);
    try {
      const selectedQuery = customKeyword.trim() ? `${department} - ${customKeyword.trim()}` : department;
      const data = await generateRwandanProductsDataset(selectedQuery, generateCount);
      
      // Inject unique local id and build Unsplash image URL using imagery mapping rules
      const enrichedDrafts = data.map((item, idx) => {
        const resolvedImage = getProductImageByKeyword(item.imageKeyword || item.name);
        return {
          ...item,
          tempId: `draft_${Date.now()}_${idx}`,
          image: resolvedImage,
          inStock: true,
          lowStockThreshold: 10
        };
      });

      setDraftProducts(enrichedDrafts);
    } catch (err) {
      console.error("Gemini Generation Error:", err);
      setPublishLogs({ type: 'error', text: 'Failed to generate dataset. Please confirm your API key and connection.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateDraftValue = (tempId: string, field: string, value: any) => {
    setDraftProducts(prev => prev.map(p => {
      if (p.tempId === tempId) {
        let updated = { ...p, [field]: value };
        // Enforce basic business rule: costPrice shouldn't exceed retail price
        if (field === 'price' && updated.costPrice >= value) {
          updated.costPrice = Math.floor(value * 0.75);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleRemoveDraft = (tempId: string) => {
    setDraftProducts(prev => prev.filter(p => p.tempId !== tempId));
  };

  const handlePublishToCatalog = async () => {
    if (draftProducts.length === 0) return;
    setIsPublishing(true);
    setPublishLogs(null);
    
    try {
      let successCount = 0;

      // Publish in parallel sequence with individual error capture
      const writePromises = draftProducts.map(async (p) => {
        // Use provided barcode as standard product ID
        const targetId = p.barcode || `641${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        const productRef = doc(db, 'products', String(targetId));

        const firestoreReadyProduct = {
          id: String(targetId),
          name: p.name.trim(),
          price: Number(p.price) || 1000,
          costPrice: Number(p.costPrice) || Math.floor((Number(p.price) || 1000) * 0.75),
          category: p.category || department,
          inStock: true,
          stockCount: Number(p.stockCount) || 50,
          warehouseStockCount: (Number(p.stockCount) || 50) * 3, // Realistic buffer
          lowStockThreshold: 10,
          barcode: String(targetId),
          expiryDate: p.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          image: p.image,
          unit: p.unit || 'Pcs',
          rating: 0,
          reviewCount: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await setDoc(productRef, firestoreReadyProduct);
        successCount++;
      });

      await Promise.all(writePromises);
      
      setPublishLogs({ 
        type: 'success', 
        text: `Successfully registered ${successCount} authentic Rwandan commodities into the catalog database!` 
      });
      
      setDraftProducts([]); // Clear draft catalog on success
      
      if (onSeedingComplete) {
        onSeedingComplete();
      }
    } catch (err) {
      console.error("Firestore Publish Error:", err);
      setPublishLogs({ 
        type: 'error', 
        text: 'Failed to save products to Firebase Firestore database. Please retry.' 
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper calculation for total store valuation of draft
  const totalValuation = draftProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stockCount || 0)), 0);
  const totalWholesaleCost = draftProducts.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.stockCount || 0)), 0);
  const estimatedProfit = totalValuation - totalWholesaleCost;

  return (
    <div id="ai-catalogue-generator" className="bg-black/5 dark:bg-zinc-900/40 p-8 sm:p-12 rounded-[48px] border border-brand-border space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-brand-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">{presetDepartments.includes(department) ? `${department} Department` : "Custom"} Generation Mode</span>
          </div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter mt-1">Rwandan Supermarket Catalog Builder</h3>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">
            Leverage Gemini AI to generate high-fidelity retail packaging datasets matching Kigali supermarket indexes
          </p>
        </div>

        {draftProducts.length > 0 && (
          <div className="flex items-center gap-4 bg-white/20 dark:bg-black/40 p-4 py-3 rounded-2xl border border-brand-border select-none">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 block">Projected Profit Margin</span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black font-mono text-brand-primary">{formatCurrency(estimatedProfit)}</span>
                <span className="text-[9px] font-black text-emerald-500 font-mono">
                  (+{Math.round((estimatedProfit / (totalValuation || 1)) * 100)}%)
                </span>
              </div>
            </div>
            <Calculator className="h-5 w-5 opacity-30 text-brand-primary ml-2" />
          </div>
        )}
      </div>

      {/* Generator Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Target Department</label>
          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-brand-border rounded-2xl py-4 px-5 text-xs font-black uppercase italic tracking-wider focus:border-brand-primary outline-none appearance-none cursor-pointer"
            >
              {presetDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">▼</span>
          </div>
        </div>

        <div className="md:col-span-5 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex justify-between">
            <span>Dynamic Query / Brand Accents</span>
            <span className="text-[8px] font-medium lowercase tracking-normal italic opacity-60">optional</span>
          </label>
          <input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            placeholder="e.g. Inyange brand, Kinazi flours, Urwibutso juices"
            className="w-full bg-white dark:bg-zinc-950 border border-brand-border rounded-xl p-4 text-xs font-bold"
          />
        </div>

        <div className="md:col-span-3 grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Quantity</label>
            <select
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-950 border border-brand-border rounded-xl p-4 text-xs font-bold text-center"
            >
              <option value="5">5 Units</option>
              <option value="10">10 Units</option>
              <option value="15">15 Units</option>
              <option value="20">20 Units</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || isPublishing}
              className="w-full h-[52px] bg-brand-primary text-white dark:text-black font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 italic cursor-pointer active:scale-95"
            >
              {isGenerating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </button>
          </div>
        </div>
      </div>

      {publishLogs && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-5 rounded-2xl text-xs font-bold flex items-center gap-3 border",
            publishLogs.type === 'success' 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
              : "bg-rose-500/10 border-rose-500/20 text-rose-500"
          )}
        >
          {publishLogs.type === 'success' ? <Check className="h-5 w-5 shrink-0" /> : <Info className="h-5 w-5 shrink-0" />}
          <span>{publishLogs.text}</span>
        </motion.div>
      )}

      {/* Render Draft Preview catalog container */}
      <AnimatePresence>
        {draftProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 pt-4 border-t border-brand-border overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h4 className="micro-label !opacity-100 flex items-center gap-2 italic">
                <CornerDownRight className="h-3.5 w-3.5 text-brand-primary" />
                Preview Generated Draft Dataset ({draftProducts.length} Items Indexed)
              </h4>
              <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Double-click or click values below to customise inline</p>
            </div>

            {/* Editable Grid Table */}
            <div className="border border-brand-border rounded-3xl overflow-hidden bg-white/20 dark:bg-black/20">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-black/5 dark:bg-white/5 border-b border-brand-border text-left">
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60">Visual</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60">Product Commodity Name</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60">Category Aisle</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60 text-center">Unit Pack</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60 text-right">Cost (RWF)</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60 text-right">Retail (RWF)</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60 text-center">Stock Count</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60">Barcode Index</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60">Expiry Date</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-wider opacity-60 text-center">Drop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftProducts.map((p) => (
                      <tr 
                        key={p.tempId} 
                        className="border-b border-brand-border/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-xs"
                      >
                        {/* Img preview */}
                        <td className="p-4">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            className="w-10 h-10 object-cover rounded-xl border border-brand-border"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        
                        {/* Name Column */}
                        <td className="p-4 font-black">
                          <input 
                            type="text" 
                            value={p.name}
                            onChange={(e) => handleUpdateDraftValue(p.tempId, 'name', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-brand-primary focus:border-brand-primary outline-none py-1 font-black transition-colors"
                          />
                        </td>

                        {/* Category Selector */}
                        <td className="p-4">
                          <input 
                            type="text" 
                            value={p.category}
                            onChange={(e) => handleUpdateDraftValue(p.tempId, 'category', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-brand-primary focus:border-brand-primary outline-none py-1 transition-colors uppercase tracking-widest text-[9px] font-black font-mono text-zinc-500"
                          />
                        </td>

                        {/* Unit Pack type */}
                        <td className="p-4 text-center">
                          <input 
                            type="text" 
                            value={p.unit}
                            onChange={(e) => handleUpdateDraftValue(p.tempId, 'unit', e.target.value)}
                            className="w-16 bg-transparent border-b border-transparent hover:border-brand-primary focus:border-brand-primary outline-none py-1 text-center transition-colors font-bold"
                          />
                        </td>

                        {/* Wholesale Cost Price */}
                        <td className="p-4 text-right font-mono font-bold text-rose-500">
                          <input 
                            type="number" 
                            value={p.costPrice}
                            onChange={(e) => handleUpdateDraftValue(p.tempId, 'costPrice', parseInt(e.target.value) || 0)}
                            className="w-20 bg-transparent border-b border-transparent hover:border-brand-primary focus:border-brand-primary outline-none py-1 text-right transition-colors font-mono"
                          />
                        </td>

                        {/* Retail Price column */}
                        <td className="p-4 text-right font-mono font-black text-brand-primary">
                          <input 
                            type="number" 
                            value={p.price}
                            onChange={(e) => handleUpdateDraftValue(p.tempId, 'price', parseInt(e.target.value) || 0)}
                            className="w-20 bg-transparent border-b border-transparent hover:border-brand-primary focus:border-brand-primary outline-none py-1 text-right transition-colors font-mono"
                          />
                        </td>

                        {/* Stock count */}
                        <td className="p-4 text-center font-mono font-bold">
                          <input 
                            type="number" 
                            value={p.stockCount}
                            onChange={(e) => handleUpdateDraftValue(p.tempId, 'stockCount', parseInt(e.target.value) || 0)}
                            className="w-16 bg-transparent border-b border-transparent hover:border-brand-primary focus:border-brand-primary outline-none py-1 text-center transition-colors font-mono"
                          />
                        </td>

                        {/* Barcode digits */}
                        <td className="p-4 font-mono font-bold text-zinc-500">
                          <input 
                            type="text" 
                            value={p.barcode}
                            onChange={(e) => handleUpdateDraftValue(p.tempId, 'barcode', e.target.value)}
                            className="w-28 bg-transparent border-b border-transparent hover:border-brand-primary focus:border-brand-primary outline-none py-1 transition-colors font-mono"
                          />
                        </td>

                        {/* Perishable Expiry date */}
                        <td className="p-4">
                          <input 
                            type="date" 
                            value={p.expiryDate}
                            onChange={(e) => handleUpdateDraftValue(p.tempId, 'expiryDate', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-brand-primary focus:border-brand-primary outline-none py-1 transition-colors font-bold font-mono"
                          />
                        </td>

                        {/* Drop operation button */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleRemoveDraft(p.tempId)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="Exclude product from publish"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action dispatch buttons */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-4 border-t border-brand-border/40">
              <button
                type="button"
                onClick={() => setDraftProducts([])}
                className="w-full sm:w-auto px-6 py-4 bg-zinc-500/10 border border-zinc-500/15 text-zinc-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center gap-2 italic"
              >
                Clear Preview Drafts
              </button>
              
              <button
                type="button"
                onClick={handlePublishToCatalog}
                disabled={isPublishing}
                className="w-full sm:w-auto px-10 py-4 bg-brand-primary text-white dark:text-black font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50 italic cursor-pointer select-none"
              >
                {isPublishing ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Publish Rwandan Dataset to Store
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
