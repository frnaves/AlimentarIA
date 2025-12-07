import React from 'react';
import { useStore } from '../context/StoreContext';
import { Flame, Droplets, Trophy, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateExerciseCalories } from '../utils/calculations';

export const Dashboard: React.FC = () => {
  const { userProfile, currentDate, nutritionLogs, userStats } = useStore();

  const dailyGoal = userProfile.daily_kcal_goal;
  const waterGoal = userProfile.daily_water_goal;
  
  const currentLog = nutritionLogs[currentDate] || { 
    summary: { total_kcal: 0, total_protein: 0, water_intake_ml: 0 },
    exercises: []
  };

  const caloriesConsumed = currentLog.summary.total_kcal;
  const caloriesBurned = currentLog.exercises.reduce((sum, ex) => sum + ex.calories_burned, 0);
  const totalExpenditure = userProfile.calculated_tmb + caloriesBurned; // Approximation of total burn for the day so far + base TMB
  
  // Energy Balance Calculation: Intake vs (TMB + Activity)
  // Note: TMB is daily. For visualization, we compare Daily Intake vs Daily Expenditure.
  const energyBalance = caloriesConsumed - totalExpenditure;

  const caloriesPercent = Math.min(100, Math.round((caloriesConsumed / dailyGoal) * 100));
  const waterPercent = Math.min(100, Math.round((currentLog.summary.water_intake_ml / waterGoal) * 100));
  
  const nextLevelXP = userStats.current_level * 100;
  const xpPercent = (userStats.total_xp % 100) / 100 * 100;

  return (
    <div className="space-y-6">
      {/* Gamification Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        {/* Particles Effect (Simple CSS) */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-5 rounded-full -ml-8 -mb-8"></div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="bg-violet-800 text-xs font-bold px-2 py-0.5 rounded text-violet-200">Nível {userStats.current_level}</span>
                <span className="text-xs text-violet-200">{userStats.total_xp} XP</span>
            </div>
            <h2 className="font-bold text-xl">Olá, {userProfile.name.split(' ')[0]}!</h2>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
              <Flame size={16} className="text-orange-300 fill-orange-300" />
              <span className="font-bold text-sm">{userStats.streak_days} dias</span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="relative z-10">
            <div className="flex justify-between text-[10px] text-violet-200 mb-1 uppercase tracking-wider font-semibold">
                <span>Progresso</span>
                <span>{Math.round(xpPercent)}% para Nível {userStats.current_level + 1}</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000" style={{ width: `${xpPercent}%` }}></div>
            </div>
        </div>
      </div>

      {/* Energy Balance Chart (Bar Chart Comparison) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Activity size={16} /> Saldo Energético (Hoje)
          </h3>
          <div className="flex items-end gap-4 h-32 mb-2">
              {/* Intake Bar */}
              <div className="flex-1 flex flex-col justify-end items-center group">
                  <span className="text-xs font-bold text-emerald-600 mb-1">{caloriesConsumed}</span>
                  <div className="w-full bg-emerald-100 rounded-t-lg relative overflow-hidden" style={{height: `${Math.min(100, (caloriesConsumed/3000)*100)}%`}}>
                     <div className="absolute bottom-0 left-0 w-full bg-emerald-500 h-full opacity-80 group-hover:opacity-100 transition-all"></div>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 font-medium">Entrada</span>
              </div>
              
              {/* Expenditure Bar */}
              <div className="flex-1 flex flex-col justify-end items-center group">
                  <span className="text-xs font-bold text-red-500 mb-1">{totalExpenditure}</span>
                  <div className="w-full bg-red-100 rounded-t-lg relative overflow-hidden" style={{height: `${Math.min(100, (totalExpenditure/3000)*100)}%`}}>
                     <div className="absolute bottom-0 left-0 w-full bg-red-500 h-full opacity-80 group-hover:opacity-100 transition-all"></div>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 font-medium">Saída (TMB+Ativ)</span>
              </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 text-center">
             <span className="text-xs text-gray-500">Saldo atual: </span>
             <span className={`font-bold ${energyBalance > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                 {energyBalance > 0 ? '+' : ''}{energyBalance} kcal
             </span>
          </div>
      </div>

      {/* Calories Summary Card */}
      <Link to="/nutrition" className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group">
        <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-500" style={{ width: `${caloriesPercent}%` }}></div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Trophy size={18} className="text-emerald-500" />
              Calorias
            </h3>
            <div className="flex items-baseline gap-1 mt-1">
                <p className="text-3xl font-bold text-gray-900">{caloriesConsumed}</p>
                <span className="text-xs text-gray-400">/ {dailyGoal} kcal</span>
            </div>
          </div>
          <div className="h-14 w-14 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
             <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                <circle cx="26" cy="26" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                <circle cx="26" cy="26" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" 
                        strokeDasharray={138} strokeDashoffset={138 - (138 * caloriesPercent) / 100}
                        className="text-emerald-500 transition-all duration-1000" />
             </svg>
             <span className="text-[10px] font-bold text-gray-600">{caloriesPercent}%</span>
          </div>
        </div>
      </Link>

      {/* Water Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Droplets size={18} className="text-blue-500" />
              Hidratação
            </h3>
            <div className="flex items-baseline gap-1 mt-1">
                <p className="text-3xl font-bold text-blue-600">{currentLog.summary.water_intake_ml}</p>
                <span className="text-xs text-gray-400">/ {waterGoal} ml</span>
            </div>
          </div>
           <div className="flex flex-col gap-2">
              {waterPercent >= 100 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">Meta Atingida!</span>
              )}
           </div>
        </div>
      </div>

       {/* Quick Link Body */}
       <Link to="/body" className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
         <div className="flex justify-between items-center">
             <div>
                <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                        <TrendingUp size={18} className="text-pink-500" />
                        Corpo & Movimento
                </h3>
                <p className="text-xs text-gray-400">Peso atual: {userProfile.current_weight_kg}kg</p>
             </div>
             <div className="bg-pink-50 p-2 rounded-full">
                 <Activity size={20} className="text-pink-500" />
             </div>
         </div>
       </Link>
    </div>
  );
};