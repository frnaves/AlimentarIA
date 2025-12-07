import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { calculateWaterGoal } from '../utils/calculations';
import { Plus, Camera, Mic, Check, Loader2, Droplets, Edit2, Info, X, Trash2 } from 'lucide-react';
import { analyzeFoodText, analyzeFoodImage } from '../services/geminiService';
import { MealItem, Meal, Macros } from '../types';

// Extended interface for local state to remember original values for recalculation
interface StagingMealItem extends MealItem {
  baseMacros?: Macros;
  baseQty?: number;
}

// Types for UUID not strictly needed as string works, using simple random string generator
const generateId = () => Math.random().toString(36).substr(2, 9);

export const Nutrition: React.FC = () => {
  const { currentDate, nutritionLogs, addMeal, editMeal, deleteMeal, updateWater, userProfile } = useStore();
  
  // UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMacroInfo, setShowMacroInfo] = useState(false);
  const [inputType, setInputType] = useState<'text' | 'image' | 'staging'>('text');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null); // Track which meal is being edited
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagingItems, setStagingItems] = useState<StagingMealItem[]>([]);
  const [mealType, setMealType] = useState<Meal['type']>('lunch');

  const currentLog = nutritionLogs[currentDate];
  const waterGoal = calculateWaterGoal(userProfile.current_weight_kg);

  // Helper to add base values to items coming from AI or Edit
  const enhanceItemsWithBase = (items: MealItem[]): StagingMealItem[] => {
      return items.map(item => ({
          ...item,
          // Store original values returned by AI/DB to allow correct rule-of-three recalculation
          // even if the user temporarily sets quantity to 0
          baseMacros: { ...item.macros },
          baseQty: item.quantity
      }));
  };

  const handleTextAnalysis = async () => {
    if (!inputText) return;
    setIsProcessing(true);
    try {
      const items = await analyzeFoodText(inputText);
      // APPEND new items to existing staging items
      setStagingItems(prev => [...prev, ...enhanceItemsWithBase(items)]);
      setInputType('staging');
      setInputText(''); // Clear input after processing
    } catch (e) {
      alert("Erro ao analisar texto. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        try {
          const items = await analyzeFoodImage(base64String);
          // APPEND new items to existing staging items
          setStagingItems(prev => [...prev, ...enhanceItemsWithBase(items)]);
          setInputType('staging');
        } catch (err) {
            alert("Erro ao analisar imagem.");
        } finally {
            setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateItemQuantity = (index: number, newQtyStr: string) => {
    // Allow empty string to let user type
    if (newQtyStr === '') {
        const newItems = [...stagingItems];
        newItems[index].quantity = 0; // Temporary visual 0
        // We do NOT update macros here to avoid confusion, or we set them to 0. 
        // Setting to 0 is safer visually.
        newItems[index].macros = { kcal: 0, p: 0, c: 0, f: 0 };
        setStagingItems(newItems);
        return;
    }

    const newQty = parseFloat(newQtyStr);
    if (isNaN(newQty) || newQty < 0) return;

    const newItems = [...stagingItems];
    const item = newItems[index];
    
    // Retrieve base values. If they don't exist (legacy), fallback to current (risky but necessary fallback)
    const baseQty = item.baseQty || item.quantity; 
    const baseMacros = item.baseMacros || item.macros;

    // Recalculate macros based on the ORIGINAL density
    if (baseQty > 0) {
        const ratio = newQty / baseQty;
        item.macros.kcal = Math.round(baseMacros.kcal * ratio);
        item.macros.p = parseFloat((baseMacros.p * ratio).toFixed(1));
        item.macros.c = parseFloat((baseMacros.c * ratio).toFixed(1));
        item.macros.f = parseFloat((baseMacros.f * ratio).toFixed(1));
    }
    
    item.quantity = newQty;
    setStagingItems(newItems);
  };

  const handleConfirmMeal = () => {
    const timestamp = new Date().toISOString();
    
    // Clean up internal flags (baseMacros, baseQty) before saving to store
    const cleanItems: MealItem[] = stagingItems.map(({ baseMacros, baseQty, ...item }) => item);

    if (editingId) {
        // Update existing meal
        const updatedMeal: Meal = {
            id: editingId,
            type: mealType,
            timestamp_updated: timestamp,
            items: cleanItems
        };
        editMeal(currentDate, updatedMeal);
    } else {
        // Create new meal
        const newMeal: Meal = {
            id: generateId(),
            type: mealType,
            timestamp_updated: timestamp,
            items: cleanItems
        };
        addMeal(currentDate, newMeal);
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const startEditing = (meal: Meal) => {
      setEditingId(meal.id);
      setMealType(meal.type);
      // Deep copy and enhance with base values for editing logic
      setStagingItems(enhanceItemsWithBase(JSON.parse(JSON.stringify(meal.items)))); 
      setInputType('staging');
      setShowAddModal(true);
  };

  const handleDelete = (mealId: string) => {
      if (window.confirm("Tem certeza que deseja apagar esta refeição?")) {
          deleteMeal(currentDate, mealId);
      }
  };

  const resetForm = () => {
    setInputText('');
    setSelectedImage(null);
    setStagingItems([]);
    setInputType('text');
    setShowMacroInfo(false);
    setEditingId(null); // Clear editing state
  };

  const MealCard: React.FC<{ meal: Meal }> = ({ meal }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-3">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {meal.type === 'breakfast' ? 'Café da Manhã' : 
                meal.type === 'lunch' ? 'Almoço' : 
                meal.type === 'dinner' ? 'Jantar' : 'Lanche'}
            </span>
            <span className="text-xs text-gray-400">{new Date(meal.timestamp_updated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
            <button 
                onClick={() => startEditing(meal)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Editar"
            >
                <Edit2 size={16} />
            </button>
            <button 
                onClick={() => handleDelete(meal.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 text-[10px] uppercase font-bold text-gray-400 mb-2 px-1">
          <div className="col-span-5">Item</div>
          <div className="col-span-2 text-right">Qtd</div>
          <div className="col-span-2 text-right">Kcal</div>
          <div className="col-span-1 text-right text-emerald-600">P</div>
          <div className="col-span-1 text-right text-emerald-600">C</div>
          <div className="col-span-1 text-right text-emerald-600">G</div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {meal.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-1 text-xs px-1 items-center">
                <div className="col-span-5 font-medium text-gray-700 truncate pr-1" title={item.name}>{item.name}</div>
                <div className="col-span-2 text-right text-gray-500 truncate">{item.quantity}{item.unit}</div>
                <div className="col-span-2 text-right font-bold text-gray-800">{Math.round(item.macros.kcal)}</div>
                <div className="col-span-1 text-right text-gray-600">{Math.round(item.macros.p)}</div>
                <div className="col-span-1 text-right text-gray-600">{Math.round(item.macros.c)}</div>
                <div className="col-span-1 text-right text-gray-600">{Math.round(item.macros.f)}</div>
            </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
          <div className="flex gap-3 text-xs text-gray-500">
            <span className="font-semibold text-emerald-700">Total: {Math.round(meal.items.reduce((a,b)=>a+b.macros.kcal,0))} kcal</span>
          </div>
          <div className="flex gap-2 text-[10px] text-gray-400">
             <span>P: {Math.round(meal.items.reduce((a,b)=>a+b.macros.p,0))}g</span>
             <span>C: {Math.round(meal.items.reduce((a,b)=>a+b.macros.c,0))}g</span>
             <span>G: {Math.round(meal.items.reduce((a,b)=>a+b.macros.f,0))}g</span>
          </div>
      </div>
    </div>
  );

  return (
    <div className="pb-10">
        {/* Water Tracker */}
        <div className="bg-blue-50 rounded-2xl p-5 mb-6 border border-blue-100">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Droplets className="text-blue-500" />
                    <h3 className="font-bold text-blue-900">Hidratação</h3>
                </div>
                <div className="text-blue-800 font-mono text-lg">
                    {currentLog?.summary.water_intake_ml || 0} / {waterGoal} ml
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => updateWater(currentDate, 250)} className="flex-1 bg-white text-blue-600 py-2 rounded-lg shadow-sm font-semibold hover:bg-blue-100 text-sm transition-colors">+250ml</button>
                <button onClick={() => updateWater(currentDate, 500)} className="flex-1 bg-white text-blue-600 py-2 rounded-lg shadow-sm font-semibold hover:bg-blue-100 text-sm transition-colors">+500ml</button>
            </div>
        </div>

      {/* Meals List */}
      <div className="mb-20">
        <h3 className="font-bold text-gray-800 mb-4 text-lg">Refeições do Dia</h3>
        {!currentLog?.meals?.length ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                Nenhuma refeição registrada hoje.
            </div>
        ) : (
            currentLog.meals.map(meal => <MealCard key={meal.id} meal={meal} />)
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => { resetForm(); setShowAddModal(true); }}
        className="fixed bottom-24 right-4 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 z-40 flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="font-bold pr-1">Registrar</span>
      </button>

      {/* Add/Edit Meal Modal */}
      {showAddModal && (
        // z-[60] ensures it sits ABOVE the bottom navigation (which is usually z-50)
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          {/* h-full on mobile to maximize space, rounded-none on mobile */}
          <div className="bg-white w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl overflow-y-auto flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg">{editingId ? 'Editar Refeição' : 'Adicionar Refeição'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                  <X size={24} />
              </button>
            </div>

            <div className="p-4 flex-1">
              {/* Step 1: Input Selection (Only for new meals or if user goes 'back' during edit) */}
              {inputType !== 'staging' && (
                  <div className="space-y-4">
                      {/* Only show meal type selection if we are starting fresh (no items in staging) */}
                      {stagingItems.length === 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(t => (
                                <button 
                                    key={t} 
                                    onClick={() => setMealType(t)}
                                    className={`py-2 px-1 rounded-lg text-sm font-medium border ${mealType === t ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    {t === 'breakfast' ? 'Café' : t === 'lunch' ? 'Almoço' : t === 'dinner' ? 'Jantar' : 'Lanche'}
                                </button>
                            ))}
                          </div>
                      )}

                      <div className="flex gap-2 mb-4">
                          <button 
                             onClick={() => setInputType('text')}
                             className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-2 border ${inputType === 'text' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
                          >
                              <Edit2 size={20} />
                              <span className="text-sm">Texto</span>
                          </button>
                          
                          {/* ONLY SHOW PHOTO OPTION IF WE ARE STARTING FRESH. 
                              If adding more items to existing list, restrict to text/audio as requested. */}
                          {stagingItems.length === 0 && (
                              <label className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-2 border cursor-pointer ${inputType === 'image' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                                  <Camera size={20} />
                                  <span className="text-sm">Foto</span>
                                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                              </label>
                          )}
                      </div>

                      {inputType === 'text' && (
                          <div className="space-y-3">
                              <textarea 
                                className="w-full border border-gray-300 rounded-xl p-3 h-40 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                placeholder={stagingItems.length > 0 ? "Ex: Adicionar 1 banana" : "Ex: 2 ovos mexidos, 1 fatia de pão integral e uma maçã."}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                              ></textarea>
                              <button 
                                disabled={isProcessing || !inputText}
                                onClick={handleTextAnalysis}
                                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2"
                              >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <Mic size={20} />}
                                {isProcessing ? "Analisando..." : "Processar com IA"}
                              </button>
                          </div>
                      )}

                      {isProcessing && inputType === 'image' && (
                          <div className="flex flex-col items-center justify-center py-10 text-emerald-600">
                              <Loader2 size={40} className="animate-spin mb-2" />
                              <p>Analisando imagem...</p>
                          </div>
                      )}
                  </div>
              )}

              {/* Step 2: Staging (Human-in-the-loop) */}
              {inputType === 'staging' && (
                  <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-700">Confira os itens</h4>
                        <button 
                          onClick={() => setShowMacroInfo(!showMacroInfo)}
                          className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full hover:bg-emerald-100"
                        >
                           <Info size={14} /> Entenda os dados
                        </button>
                      </div>

                      {/* Info Tooltip/Modal */}
                      {showMacroInfo && (
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-sm text-emerald-900 shadow-sm relative animate-in fade-in zoom-in-95">
                           <button onClick={() => setShowMacroInfo(false)} className="absolute top-2 right-2 text-emerald-400"><X size={14}/></button>
                           <h5 className="font-bold mb-2">Legenda Nutricional:</h5>
                           <ul className="space-y-1 mb-2">
                             <li><strong>Kcal:</strong> Calorias totais (Energia)</li>
                             <li><strong>P:</strong> Proteínas (Músculos)</li>
                             <li><strong>C:</strong> Carboidratos (Energia rápida)</li>
                             <li><strong>G:</strong> Gorduras (Fats)</li>
                           </ul>
                           <p className="text-xs text-emerald-700 italic border-t border-emerald-200 pt-2">
                             *Os valores exibidos abaixo representam o <strong>total</strong> para a quantidade informada (ex: se comer 2 ovos, é o valor de 2 ovos).
                           </p>
                        </div>
                      )}
                      
                      {selectedImage && stagingItems.length > 0 && (
                          <img src={selectedImage} alt="Food" className="w-full h-40 object-cover rounded-lg shadow-sm" />
                      )}

                      <div className="space-y-3 pb-4">
                          {stagingItems.map((item, idx) => (
                              <div key={idx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  {/* Top Row: Name and Calories */}
                                  <div className="flex justify-between items-start">
                                      <input 
                                        value={item.name} 
                                        onChange={(e) => {
                                            const newItems = [...stagingItems];
                                            newItems[idx].name = e.target.value;
                                            setStagingItems(newItems);
                                        }}
                                        className="font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 w-full focus:outline-none focus:border-emerald-500 mr-2"
                                      />
                                      <button onClick={() => {
                                          const newItems = stagingItems.filter((_, i) => i !== idx);
                                          setStagingItems(newItems);
                                      }} className="text-red-300 hover:text-red-500"><Trash2 size={16} /></button>
                                  </div>

                                  {/* Bottom Row: Quantity and Macros */}
                                  <div className="flex justify-between items-end mt-1">
                                      <div className="flex gap-2 items-center">
                                          <input 
                                            type="number"
                                            min="0"
                                            value={item.quantity === 0 ? '' : item.quantity}
                                            onChange={(e) => updateItemQuantity(idx, e.target.value)}
                                            className="w-16 bg-white border border-gray-200 rounded px-1 py-1 text-sm text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                                            placeholder="0"
                                          />
                                          <span className="text-sm text-gray-500">{item.unit}</span>
                                      </div>
                                      
                                      <div className="flex gap-3 text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-100">
                                          <div className="flex flex-col items-center">
                                            <span className="text-[9px] uppercase font-bold text-gray-300">Kcal</span>
                                            <span className="font-bold text-emerald-600">{Math.round(item.macros.kcal)}</span>
                                          </div>
                                          <div className="flex flex-col items-center border-l border-gray-100 pl-2">
                                            <span className="text-[9px] uppercase font-bold text-gray-300">P</span>
                                            <span className="font-medium">{item.macros.p}</span>
                                          </div>
                                          <div className="flex flex-col items-center border-l border-gray-100 pl-2">
                                            <span className="text-[9px] uppercase font-bold text-gray-300">C</span>
                                            <span className="font-medium">{item.macros.c}</span>
                                          </div>
                                          <div className="flex flex-col items-center border-l border-gray-100 pl-2">
                                            <span className="text-[9px] uppercase font-bold text-gray-300">G</span>
                                            <span className="font-medium">{item.macros.f}</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="flex gap-3 pt-2 border-t border-gray-100 mt-auto">
                          {/* When clicking 'Add More', we go back to input selection BUT we keep stagingItems in state. */}
                          <button 
                            onClick={() => setInputType('text')} 
                            className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors flex justify-center items-center gap-2"
                          >
                             <Plus size={16} />
                             Adicionar mais
                          </button>
                          <button 
                            onClick={handleConfirmMeal}
                            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 flex justify-center items-center gap-2 shadow-emerald-200 shadow-lg transition-all active:scale-95"
                          >
                            <Check size={20} />
                            {editingId ? 'Salvar Edição' : 'Confirmar'}
                          </button>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};