import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Trophy, Star, Lock, Plus, Trash, Check, Target } from 'lucide-react';

export const Gamification: React.FC = () => {
  const { userStats, addCustomChallenge, completeCustomChallenge, deleteCustomChallenge } = useStore();
  const [activeTab, setActiveTab] = useState<'badges' | 'challenges'>('badges');
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeXP, setNewChallengeXP] = useState(50);

  const xpToNextLevel = 100 - (userStats.total_xp % 100);
  const progressPercent = (userStats.total_xp % 100);

  const handleAddChallenge = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newChallengeTitle.trim()) return;
      addCustomChallenge(newChallengeTitle, newChallengeXP);
      setNewChallengeTitle('');
      setNewChallengeXP(50);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Level & XP */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm border-2 border-white/30">
                <span className="text-3xl font-bold">{userStats.current_level}</span>
            </div>
            <h2 className="font-bold text-xl">Nível Atual</h2>
            <p className="text-violet-200 text-sm mb-4">Total XP: {userStats.total_xp}</p>
            
            <div className="w-full bg-black/20 rounded-full h-3 mb-2">
                <div className="bg-yellow-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.6)]" style={{width: `${progressPercent}%`}}></div>
            </div>
            <p className="text-xs text-violet-200 font-medium">Faltam {xpToNextLevel} XP para o próximo nível</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'badges' ? 'bg-violet-50 text-violet-700 shadow-sm' : 'text-gray-500'}`}
          >
            <Trophy size={16} /> Conquistas
          </button>
          <button 
            onClick={() => setActiveTab('challenges')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'challenges' ? 'bg-violet-50 text-violet-700 shadow-sm' : 'text-gray-500'}`}
          >
            <Target size={16} /> Desafios
          </button>
      </div>

      {activeTab === 'badges' ? (
          <div className="grid grid-cols-1 gap-3 animate-fade-in">
              {userStats.badges.map(badge => (
                  <div key={badge.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${badge.unlocked ? 'bg-white border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${badge.unlocked ? 'bg-yellow-50' : 'bg-gray-200'}`}>
                          {badge.unlocked ? badge.icon : <Lock size={20} className="text-gray-400" />}
                      </div>
                      <div className="flex-1">
                          <h4 className={`font-bold ${badge.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>{badge.name}</h4>
                          <p className="text-xs text-gray-500">{badge.description}</p>
                          {badge.unlocked && badge.unlockedAt && (
                              <p className="text-[10px] text-green-600 font-medium mt-1">Desbloqueado em {new Date(badge.unlockedAt).toLocaleDateString()}</p>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="space-y-6 animate-fade-in">
              {/* Creator Form */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Criar Novo Desafio</h3>
                  <form onSubmit={handleAddChallenge} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                          <input 
                            required
                            value={newChallengeTitle}
                            onChange={e => setNewChallengeTitle(e.target.value)}
                            placeholder="Ex: Correr 5km no domingo" 
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-violet-500"
                          />
                          <select 
                            value={newChallengeXP}
                            onChange={e => setNewChallengeXP(parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none"
                          >
                              <option value={50}>50 XP (Fácil)</option>
                              <option value={100}>100 XP (Médio)</option>
                              <option value={200}>200 XP (Difícil)</option>
                              <option value={500}>500 XP (Épico)</option>
                          </select>
                      </div>
                      <button type="submit" className="bg-violet-600 text-white px-4 rounded-lg hover:bg-violet-700">
                          <Plus />
                      </button>
                  </form>
              </div>

              {/* List */}
              <div className="space-y-3">
                  <h3 className="font-bold text-gray-600 text-sm uppercase tracking-wide px-1">Meus Desafios</h3>
                  {userStats.custom_challenges?.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-4">Você ainda não criou nenhum desafio.</p>
                  )}
                  {userStats.custom_challenges?.map(challenge => (
                      <div key={challenge.id} className={`bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between group ${challenge.completed ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
                          <div className="flex items-center gap-3">
                              <button 
                                onClick={() => completeCustomChallenge(challenge.id)}
                                disabled={challenge.completed}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${challenge.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500'}`}
                              >
                                  {challenge.completed && <Check size={14} />}
                              </button>
                              <div className={challenge.completed ? 'line-through text-gray-400' : ''}>
                                  <p className="font-medium text-gray-800 text-sm">{challenge.title}</p>
                                  <span className="text-xs text-violet-600 font-bold">+{challenge.xp_reward} XP</span>
                              </div>
                          </div>
                          
                          <button 
                             onClick={() => deleteCustomChallenge(challenge.id)}
                             className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                              <Trash size={16} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
};