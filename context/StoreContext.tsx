
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, NutritionLog, BiometricsLog, UserStats, Meal, Exercise, Badge, CustomChallenge } from '../types';
import { formatDateISO, calculateLevel, INITIAL_BADGES } from '../utils/calculations';

interface StoreContextType {
  currentDate: string;
  setCurrentDate: (date: string) => void;
  userProfile: UserProfile;
  completeOnboarding: (profileData: Partial<UserProfile>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  
  nutritionLogs: Record<string, NutritionLog>;
  addMeal: (date: string, meal: Meal) => void;
  editMeal: (date: string, meal: Meal) => void;
  deleteMeal: (date: string, mealId: string) => void;
  updateWater: (date: string, amount: number) => void;
  addExercise: (date: string, exercise: Exercise) => void;
  
  biometricsLogs: BiometricsLog[];
  addBiometricLog: (log: BiometricsLog) => void;
  
  userStats: UserStats;
  awardXP: (amount: number) => void;
  
  // Custom Challenges
  addCustomChallenge: (title: string, xpReward: number) => void;
  completeCustomChallenge: (id: string) => void;
  deleteCustomChallenge: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const INITIAL_PROFILE: UserProfile = {
  name: "",
  birthDate: "",
  gender: "M",
  height_cm: 0,
  current_weight_kg: 0,
  target_weight_kg: 0,
  activity_factor: 1.2,
  goal: "maintenance",
  calculated_tmb: 0,
  daily_kcal_goal: 2000,
  daily_water_goal: 2000,
  onboarding_completed: false
};

const INITIAL_STATS: UserStats = {
  total_xp: 0,
  current_level: 1,
  badges: INITIAL_BADGES,
  custom_challenges: [],
  streak_days: 0,
  water_streak_days: 0,
  total_logs_count: 0
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState<string>(formatDateISO(new Date()));
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [nutritionLogs, setNutritionLogs] = useState<Record<string, NutritionLog>>({});
  const [biometricsLogs, setBiometricsLogs] = useState<BiometricsLog[]>([]);
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_STATS);

  // Load from local storage
  useEffect(() => {
    const savedLogs = localStorage.getItem('nutritionLogs');
    if (savedLogs) setNutritionLogs(JSON.parse(savedLogs));
    
    const savedBio = localStorage.getItem('biometricsLogs');
    if (savedBio) setBiometricsLogs(JSON.parse(savedBio));

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    
    const savedStats = localStorage.getItem('userStats');
    if (savedStats) setUserStats(JSON.parse(savedStats));
  }, []);

  // Persistence
  useEffect(() => { localStorage.setItem('nutritionLogs', JSON.stringify(nutritionLogs)); }, [nutritionLogs]);
  useEffect(() => { localStorage.setItem('biometricsLogs', JSON.stringify(biometricsLogs)); }, [biometricsLogs]);
  useEffect(() => { localStorage.setItem('userProfile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('userStats', JSON.stringify(userStats)); }, [userStats]);

  // --- GAMIFICATION LOGIC ---

  const checkBadgeProgress = (currentStats: UserStats, profile: UserProfile): UserStats => {
      let xpGained = 0;
      const updatedBadges = currentStats.badges.map(badge => {
          let progressValue = 0;

          // Determine the metric to check based on badge ID
          if (badge.id === 'consistency_streak') progressValue = currentStats.streak_days;
          else if (badge.id === 'water_streak') progressValue = currentStats.water_streak_days;
          else if (badge.id === 'total_logs') progressValue = currentStats.total_logs_count;
          else if (badge.id === 'level_climber') progressValue = currentStats.current_level;

          // Check tiers
          const updatedTiers = badge.tiers.map(tier => {
              if (!tier.unlocked && progressValue >= tier.target) {
                  xpGained += tier.xp_reward;
                  return { ...tier, unlocked: true, unlockedAt: new Date().toISOString() };
              }
              return tier;
          });

          return { ...badge, currentValue: progressValue, tiers: updatedTiers };
      });

      const newXP = currentStats.total_xp + xpGained;
      const newLevel = calculateLevel(newXP);
      
      return {
          ...currentStats,
          badges: updatedBadges,
          total_xp: newXP,
          current_level: newLevel
      };
  };

  const calculateStreaks = (logs: Record<string, NutritionLog>, waterGoal: number) => {
      const today = new Date();
      let streak = 0;
      let waterStreak = 0;
      let totalLogs = 0;

      // Count total logs first
      Object.values(logs).forEach(log => {
          totalLogs += (log.meals.length + log.exercises.length);
      });

      // Calculate Streaks (Backwards from today)
      for (let i = 0; i < 365; i++) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const iso = formatDateISO(d);
          const log = logs[iso];

          if (log && (log.meals.length > 0 || log.exercises.length > 0)) {
              streak++;
              // Check water for this day
              if (log.summary.water_intake_ml >= waterGoal) {
                  waterStreak++;
              } else if (i === 0 && log.summary.water_intake_ml < waterGoal) {
                  // If today is not done yet, don't break streak from yesterday
                  // But don't increment either unless done.
                  // This is a simplification. Usually we check if 'yesterday' was valid.
              } else {
                 // Break water streak
              }
          } else {
             if (i === 0) continue; // If today has no logs yet, don't break streak
             break;
          }
      }

      return { streak, waterStreak, totalLogs };
  };

  const awardXP = (amount: number) => {
    setUserStats(prev => {
        const newXP = prev.total_xp + amount;
        const newLevel = calculateLevel(newXP);
        // We re-run badge check whenever XP changes just in case a level badge triggers
        return checkBadgeProgress({ ...prev, total_xp: newXP, current_level: newLevel }, userProfile);
    });
  };

  // --- ACTIONS ---

  const completeOnboarding = (data: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...data, onboarding_completed: true };
    setUserProfile(updated);
    awardXP(50);
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  const recalculateSummary = (meals: Meal[], water: number) => {
      const totalKcal = meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.macros.kcal, 0), 0);
      const totalProtein = meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.macros.p, 0), 0);
      return { total_kcal: Math.round(totalKcal), total_protein: Math.round(totalProtein), water_intake_ml: water };
  };

  const addMeal = (date: string, meal: Meal) => {
    let newLogs: Record<string, NutritionLog> = {};
    
    setNutritionLogs(prev => {
      const dayLog = prev[date] || { date, summary: { total_kcal: 0, total_protein: 0, water_intake_ml: 0 }, meals: [], exercises: [] };
      const newMeals = [...dayLog.meals, meal];
      
      newLogs = {
        ...prev,
        [date]: {
          ...dayLog,
          meals: newMeals,
          summary: recalculateSummary(newMeals, dayLog.summary.water_intake_ml)
        }
      };
      return newLogs;
    });

    // Update Stats & Badges
    const { streak, waterStreak, totalLogs } = calculateStreaks(newLogs, userProfile.daily_water_goal);
    setUserStats(prev => checkBadgeProgress({ 
        ...prev, 
        streak_days: streak, 
        water_streak_days: waterStreak, 
        total_logs_count: totalLogs + 1 // +1 for the one just added before state update propagates
    }, userProfile));
  };

  const editMeal = (date: string, updatedMeal: Meal) => {
    setNutritionLogs(prev => {
      const dayLog = prev[date];
      if (!dayLog) return prev;
      const newMeals = dayLog.meals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
      return {
        ...prev,
        [date]: { ...dayLog, meals: newMeals, summary: recalculateSummary(newMeals, dayLog.summary.water_intake_ml) }
      };
    });
  };

  const deleteMeal = (date: string, mealId: string) => {
    setNutritionLogs(prev => {
      const dayLog = prev[date];
      if (!dayLog) return prev;
      const newMeals = dayLog.meals.filter(m => m.id !== mealId);
      return {
        ...prev,
        [date]: { ...dayLog, meals: newMeals, summary: recalculateSummary(newMeals, dayLog.summary.water_intake_ml) }
      };
    });
  };

  const updateWater = (date: string, amount: number) => {
    let newLogs: Record<string, NutritionLog> = {};
    setNutritionLogs(prev => {
      const dayLog = prev[date] || { date, summary: { total_kcal: 0, total_protein: 0, water_intake_ml: 0 }, meals: [], exercises: [] };
      newLogs = {
        ...prev,
        [date]: {
          ...dayLog,
          summary: { ...dayLog.summary, water_intake_ml: Math.max(0, dayLog.summary.water_intake_ml + amount) }
        }
      };
      return newLogs;
    });
    
    // Check Water Badge
    const { streak, waterStreak, totalLogs } = calculateStreaks(newLogs, userProfile.daily_water_goal);
    setUserStats(prev => checkBadgeProgress({ 
        ...prev, 
        streak_days: streak, 
        water_streak_days: waterStreak,
        total_logs_count: totalLogs
    }, userProfile));
  };

  const addExercise = (date: string, exercise: Exercise) => {
    let newLogs: Record<string, NutritionLog> = {};
    setNutritionLogs(prev => {
      const dayLog = prev[date] || { date, summary: { total_kcal: 0, total_protein: 0, water_intake_ml: 0 }, meals: [], exercises: [] };
      newLogs = {
        ...prev,
        [date]: { ...dayLog, exercises: [...dayLog.exercises, exercise] }
      };
      return newLogs;
    });
    
    const { streak, waterStreak, totalLogs } = calculateStreaks(newLogs, userProfile.daily_water_goal);
    setUserStats(prev => checkBadgeProgress({ 
        ...prev, 
        streak_days: streak, 
        water_streak_days: waterStreak,
        total_logs_count: totalLogs
    }, userProfile));
  };

  const addBiometricLog = (log: BiometricsLog) => {
    setBiometricsLogs(prev => {
        const filtered = prev.filter(p => p.date !== log.date);
        return [...filtered, log].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    if (new Date(log.date) >= new Date()) {
        updateUserProfile({ current_weight_kg: log.basics.weight_kg });
    }
    awardXP(30);
  };

  const addCustomChallenge = (title: string, xpReward: number) => {
      const newChallenge: CustomChallenge = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          xp_reward: xpReward,
          completed: false
      };
      setUserStats(prev => ({
          ...prev,
          custom_challenges: [...(prev.custom_challenges || []), newChallenge]
      }));
  };

  const completeCustomChallenge = (id: string) => {
      setUserStats(prev => {
          const challenge = prev.custom_challenges?.find(c => c.id === id);
          if (!challenge || challenge.completed) return prev;
          const updatedChallenges = prev.custom_challenges.map(c => c.id === id ? { ...c, completed: true } : c);
          return checkBadgeProgress({ ...prev, custom_challenges: updatedChallenges, total_xp: prev.total_xp + challenge.xp_reward }, userProfile);
      });
  };

  const deleteCustomChallenge = (id: string) => {
      setUserStats(prev => ({ ...prev, custom_challenges: prev.custom_challenges?.filter(c => c.id !== id) || [] }));
  };

  return (
    <StoreContext.Provider value={{
      currentDate, setCurrentDate,
      userProfile, completeOnboarding, updateUserProfile,
      nutritionLogs, addMeal, editMeal, deleteMeal, updateWater, addExercise,
      biometricsLogs, addBiometricLog,
      userStats, awardXP,
      addCustomChallenge, completeCustomChallenge, deleteCustomChallenge
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};
