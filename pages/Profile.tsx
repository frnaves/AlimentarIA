import React from 'react';
import { useStore } from '../context/StoreContext';
import { calculateTMB } from '../utils/calculations';
import { Award, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { userProfile, userStats } = useStore();
  const tmb = userProfile.calculated_tmb;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-20 bg-emerald-50"></div>
        <div className="relative">
             <div className="w-24 h-24 bg-white p-1 rounded-full mx-auto mb-3 shadow-md">
                 <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl font-bold">
                  {userProfile.name.charAt(0)}
                </div>
             </div>
            <h2 className="text-xl font-bold text-gray-900">{userProfile.name}</h2>
            <div className="flex justify-center items-center gap-2 mt-2">
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">Nível {userStats.current_level}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">{userStats.total_xp} XP</span>
            </div>
        </div>
      </div>

      {/* Gamification Link */}
      <Link to="/gamification" className="block bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg shadow-indigo-200 text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
              <Award size={100} />
          </div>
          <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                      <Award size={24} className="text-yellow-300" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg">Central de Conquistas</h3>
                      <p className="text-xs text-indigo-100">Ver medalhas e desafios</p>
                  </div>
              </div>
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </div>
      </Link>

      {/* Data Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Dados Fisiológicos</h3>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Altura</span>
            <span className="font-semibold">{userProfile.height_cm} cm</span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Peso Atual</span>
            <span className="font-semibold">{userProfile.current_weight_kg} kg</span>
          </div>
          <div className="flex justify-between border-b border-gray-50 pb-2">
             <span className="text-gray-500">Circ. Abdominal</span>
             <span className="font-semibold">{userProfile.abdominal_circ_cm || '-'} cm</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-gray-500">Taxa Metabólica Basal (TMB)</span>
            <span className="font-bold text-emerald-600">{tmb} kcal/dia</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-gray-500">Meta Diária (Estimada)</span>
            <span className="font-bold text-emerald-600">{userProfile.daily_kcal_goal} kcal</span>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-gray-400 mt-8">Versão 2.1.0 • HealthIntegral</p>
    </div>
  );
};