import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { calculateTMB, calculateDailyCalories, calculateWaterGoal, calculateAge } from '../utils/calculations';
import { ChevronRight, Ruler, Activity, Target } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { completeOnboarding } = useStore();
  const navigate = useNavigate();

  // State for form
  const [formData, setFormData] = useState({
    name: '',
    gender: 'M' as 'M' | 'F',
    birthDate: '',
    height_cm: '',
    current_weight_kg: '',
    target_weight_kg: '',
    abdominal_circ_cm: '',
    activity_factor: 1.2
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- SANITY CHECKS (VALIDATIONS) ---
    
    // 1. Age Validation
    const birthYear = new Date(formData.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    if (isNaN(birthYear) || birthYear < 1900 || birthYear > currentYear) {
      alert("Por favor, insira um ano de nascimento válido (a partir de 1900).");
      return;
    }

    // 2. Weight Validation (30kg - 300kg)
    const weight = parseFloat(formData.current_weight_kg);
    if (isNaN(weight) || weight < 30 || weight > 300) {
      alert("Por favor, insira um peso válido entre 30kg e 300kg.");
      return;
    }

    // 3. Height Validation (50cm - 300cm)
    const height = parseFloat(formData.height_cm);
    if (isNaN(height) || height < 50 || height > 300) {
      alert("Por favor, insira uma altura válida entre 50cm e 300cm.");
      return;
    }

    // 4. Abdominal Circumference Validation (30cm - 300cm)
    const abdominal = parseFloat(formData.abdominal_circ_cm);
    if (isNaN(abdominal) || abdominal < 30 || abdominal > 300) {
      alert("Por favor, insira uma circunferência abdominal válida entre 30cm e 300cm.");
      return;
    }

    // 5. Target Weight Validation (Min 30kg)
    const targetWeight = parseFloat(formData.target_weight_kg);
    if (isNaN(targetWeight) || targetWeight < 30) {
      alert("A meta de peso deve ser de no mínimo 30kg.");
      return;
    }

    // Calculations
    const age = calculateAge(formData.birthDate);
    
    // TMB
    const tmb = calculateTMB(weight, height, age, formData.gender);
    
    // Goal Logic
    let goalType: 'loss' | 'maintenance' | 'hypertrophy' = 'maintenance';
    if (targetWeight < weight) goalType = 'loss';
    if (targetWeight > weight) goalType = 'hypertrophy';

    // Daily Calories
    const dailyKcal = calculateDailyCalories(tmb, formData.activity_factor, goalType);
    
    // Water
    const waterGoal = calculateWaterGoal(weight);

    completeOnboarding({
      name: formData.name,
      gender: formData.gender,
      birthDate: formData.birthDate,
      height_cm: height,
      current_weight_kg: weight,
      target_weight_kg: targetWeight,
      abdominal_circ_cm: abdominal,
      activity_factor: formData.activity_factor as 1.2 | 1.375 | 1.55 | 1.725,
      goal: goalType,
      calculated_tmb: tmb,
      daily_kcal_goal: dailyKcal,
      daily_water_goal: waterGoal
    });

    navigate('/');
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-600">HealthIntegral</h1>
        <p className="text-gray-500">Configuração Inicial do seu Plano</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Info */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target size={20} className="text-emerald-500" />
            Quem é você?
          </h2>
          <div className="space-y-3">
            <input required placeholder="Seu Nome" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none" 
              value={formData.name} onChange={e => handleChange('name', e.target.value)} />
            
            <div className="flex gap-3">
              <select className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                value={formData.gender} onChange={e => handleChange('gender', e.target.value)}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
              <input 
                type="date" 
                required 
                min="1900-01-01"
                max={new Date().toISOString().split('T')[0]}
                className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                value={formData.birthDate} 
                onChange={e => handleChange('birthDate', e.target.value)} 
              />
            </div>
          </div>
        </section>

        {/* Measurements */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Ruler size={20} className="text-blue-500" />
            Medidas Corporais
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1">
               <label className="text-xs font-semibold text-gray-500">Peso (kg)</label>
               <input 
                 type="number" 
                 step="0.1" 
                 min="30" 
                 max="300" 
                 required 
                 className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                 value={formData.current_weight_kg} 
                 onChange={e => handleChange('current_weight_kg', e.target.value)} 
               />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-semibold text-gray-500">Altura (cm)</label>
               <input 
                 type="number" 
                 min="50" 
                 max="300" 
                 required 
                 className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                 value={formData.height_cm} 
                 onChange={e => handleChange('height_cm', e.target.value)} 
               />
            </div>
          </div>
          
          <div className="space-y-1 bg-blue-50 p-3 rounded-xl border border-blue-100">
             <label className="text-xs font-bold text-blue-700">Circunferência Abdominal (cm)</label>
             <div className="text-[10px] text-blue-600 mb-2 leading-tight">
               *Medir exatamente sobre a cicatriz umbilical (umbigo).
             </div>
             <input 
               type="number" 
               step="0.1" 
               min="30" 
               max="300" 
               required 
               className="w-full p-3 bg-white rounded-xl border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500"
               value={formData.abdominal_circ_cm} 
               onChange={e => handleChange('abdominal_circ_cm', e.target.value)} 
             />
          </div>
        </section>

        {/* Goal & Activity */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-orange-500" />
            Objetivo e Rotina
          </h2>
          
          <div className="mb-4">
             <label className="block text-xs font-semibold text-gray-500 mb-1">Peso Alvo (Meta)</label>
             <input 
               type="number" 
               step="0.1" 
               min="30" 
               required 
               className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
               placeholder="Ex: 70.0"
               value={formData.target_weight_kg} 
               onChange={e => handleChange('target_weight_kg', e.target.value)} 
             />
          </div>

          <label className="block text-xs font-semibold text-gray-500 mb-2">Nível de Atividade</label>
          <div className="space-y-2">
            {[
              { val: 1.2, label: 'Sedentário', desc: 'Trabalho de escritório, pouco movimento' },
              { val: 1.375, label: 'Leve', desc: 'Caminhadas esporádicas, tarefas domésticas' },
              { val: 1.55, label: 'Moderado', desc: 'Exercício 3-5x por semana' },
              { val: 1.725, label: 'Alto', desc: 'Treino intenso 6-7x por semana' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => handleChange('activity_factor', opt.val)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  formData.activity_factor === opt.val 
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                  : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-sm text-gray-800">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
          Gerar Meu Plano
          <ChevronRight />
        </button>
      </form>
    </div>
  );
};