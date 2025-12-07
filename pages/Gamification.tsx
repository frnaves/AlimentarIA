
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Trophy, Star, Lock, Plus, Trash, Check, Target, Zap } from 'lucide-react';

export const Gamification: React.FC = () => {
  const { userStats, addCustomChallenge, completeCustomChallenge, deleteCustomChallenge } = useStore();
  const [activeTab, setActiveTab] = useState<'badges' | 'challenges'>('badges');
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeXP, setNewChallengeXP] = useState(50);

  const xpToNextLevel = 500 - (userStats.total_xp % 500);
  const progressPercent = (userStats.total_xp % 500) / 500 * 100;

  const handleAddChallenge = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newChallengeTitle.trim()) return;
      addCustomChallenge(newChallengeTitle, newChallengeXP);
      setNewChallengeTitle('');
      setNewChallengeXP(50);
  };

  // Helper to render stars
  const renderStars = (currentTier: number) => {
      return (
          <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={14} 
                    className={`${star <= currentTier ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-100'}`} 
                  />
              ))}
          </div>
      );
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Level & XP */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm border-2 border-white/30">
                <span className="text-3xl font-bold">{userStats.current_level}</span>
            </div>
            <h2 className="font-bold text-xl">Nível {userStats.current_level}</h2>
            <p className="text-violet-200 text-sm mb-4">Total XP: {userStats.total_xp}</p>
            
            <div className="w-full bg-black/20 rounded-full h-3 mb-2">
                <div className="bg-yellow-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.6)]" style={{width: `${progressPercent}%`}}></div>
            </div>
            <p className="text-xs text-violet-200 font-medium">Faltam {Math.round(xpToNextLevel)} XP para o próximo nível</p>
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
          <div className="space-y-4 animate-fade-in">
              {userStats.badges.map(badge => {
                  // Find current level (last unlocked tier)
                  const unlockedTiers = badge.tiers.filter(t => t.unlocked);
                  const currentLevel = unlockedTiers.length;
                  const nextTier = badge.tiers.find(t => !t.unlocked);
                  const isCompleted = !nextTier;

                  // Calculate Progress for next tier
                  const prevTarget = currentLevel > 0 ? badge.tiers[currentLevel - 1].target : 0;
                  const nextTarget = nextTier ? nextTier.target : badge.currentValue;
                  
                  // Visual Progress Bar Logic
                  // We want progress relative to the CURRENT tier step, not from 0
                  const totalRange = nextTarget - prevTarget;
                  const currentProgress = badge.currentValue - prevTarget;
                  const percent = isCompleted ? 100 : Math.min(100, Math.max(0, (currentProgress / totalRange) * 100));

                  const totalXPEarned = unlockedTiers.reduce((acc, t) => acc + t.xp_reward, 0);

                  return (
                    <div key={badge.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                        {currentLevel > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-50 rounded-bl-full opacity-50"></div>}
                        
                        <div className="flex gap-4 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${currentLevel > 0 ? 'bg-gradient-to-br from-yellow-100 to-orange-100' : 'bg-gray-100 grayscale'}`}>
                                {badge.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-800">{badge.name}</h4>
                                    {totalXPEarned > 0 && (
                                        <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">+{totalXPEarned} XP</span>
                                    )}
                                </div>
                                
                                <div className="mb-2">
                                    {renderStars(currentLevel)}
                                </div>

                                <div className="text-xs text-gray-500 mb-2">
                                    {isCompleted 
                                        ? "Conquista Platinada! 🎉" 
                                        : badge.description_template.replace('{target}', nextTier?.target.toString() || '')}
                                </div>

                                {/* Progress Bar */}
                                {!isCompleted && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                                            <span>{badge.currentValue}</span>
                                            <span>{nextTier?.target}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{width: `${percent}%`}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                  );
              })}
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
