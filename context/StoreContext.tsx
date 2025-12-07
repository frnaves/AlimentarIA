import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, NutritionLog, BiometricsLog, UserStats, Meal, Exercise, Badge, CustomChallenge } from '../types';
import { formatDateISO, calculateLevel, INITIAL_BADGES, calculateExerciseCalories } from '../utils/calculations';

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
  streak_days: 0,
  total_xp: 0,
  current_level: 1,
  badges: INITIAL_BADGES,
  custom_challenges: []
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

  const awardXP = (amount: number) => {
    setUserStats(prev => {
      const newXP = prev.total_xp + amount;
      const newLevel = calculateLevel(newXP);
      
      const newBadges = prev.badges.map(b => {
          if (b.id === 'first_steps' && userProfile.onboarding_completed && !b.unlocked) return { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
          if (b.id === 'streak_3' && prev.streak_days >= 3 && !b.unlocked) return { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
          if (b.id === 'logger_10' && prev.total_xp > 100 && !b.unlocked) return { ...b, unlocked: true, unlockedAt: new Date().toISOString() }; // Simplified check
          if (b.id === 'level_5' && newLevel >= 5 && !b.unlocked) return { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
          return b;
      });

      return {
        ...prev,
        total_xp: newXP,
        current_level: newLevel,
        badges: newBadges
      };
    });
  };

  const completeOnboarding = (data: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...data, onboarding_completed: true };
    setUserProfile(updated);
    awardXP(50); // XP for onboarding
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  // Helper to recalculate summary
  const recalculateSummary = (meals: Meal[], water: number) => {
      const totalKcal = meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.macros.kcal, 0), 0);
      const totalProtein = meals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + i.macros.p, 0), 0);
      return { total_kcal: Math.round(totalKcal), total_protein: Math.round(totalProtein), water_intake_ml: water };
  };

  const addMeal = (date: string, meal: Meal) => {
    setNutritionLogs(prev => {
      const dayLog = prev[date] || { date, summary: { total_kcal: 0, total_protein: 0, water_intake_ml: 0 }, meals: [], exercises: [] };
      const newMeals = [...dayLog.meals, meal];
      
      return {
        ...prev,
        [date]: {
          ...dayLog,
          meals: newMeals,
          summary: recalculateSummary(newMeals, dayLog.summary.water_intake_ml)
        }
      };
    });
    awardXP(10);
  };

  const editMeal = (date: string, updatedMeal: Meal) => {
    setNutritionLogs(prev => {
      const dayLog = prev[date];
      if (!dayLog) return prev;

      const newMeals = dayLog.meals.map(m => m.id === updatedMeal.id ? updatedMeal : m);

      return {
        ...prev,
        [date]: {
          ...dayLog,
          meals: newMeals,
          summary: recalculateSummary(newMeals, dayLog.summary.water_intake_ml)
        }
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
        [date]: {
          ...dayLog,
          meals: newMeals,
          summary: recalculateSummary(newMeals, dayLog.summary.water_intake_ml)
        }
      };
    });
  };

  const updateWater = (date: string, amount: number) => {
    setNutritionLogs(prev => {
      const dayLog = prev[date] || { date, summary: { total_kcal: 0, total_protein: 0, water_intake_ml: 0 }, meals: [], exercises: [] };
      return {
        ...prev,
        [date]: {
          ...dayLog,
          summary: { ...dayLog.summary, water_intake_ml: Math.max(0, dayLog.summary.water_intake_ml + amount) }
        }
      };
    });
    awardXP(5);
  };

  const addExercise = (date: string, exercise: Exercise) => {
    setNutritionLogs(prev => {
      const dayLog = prev[date] || { date, summary: { total_kcal: 0, total_protein: 0, water_intake_ml: 0 }, meals: [], exercises: [] };
      return {
        ...prev,
        [date]: {
          ...dayLog,
          exercises: [...dayLog.exercises, exercise]
        }
      };
    });
    awardXP(20);
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

  // --- Custom Challenges Logic ---
  
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

          // Mark as complete
          const updatedChallenges = prev.custom_challenges.map(c => 
              c.id === id ? { ...c, completed: true } : c
          );
          
          return {
              ...prev,
              custom_challenges: updatedChallenges
          };
      });
      
      // Award XP separately to trigger level calculation
      const challenge = userStats.custom_challenges?.find(c => c.id === id);
      if (challenge) awardXP(challenge.xp_reward);
  };

  const deleteCustomChallenge = (id: string) => {
      setUserStats(prev => ({
          ...prev,
          custom_challenges: prev.custom_challenges?.filter(c => c.id !== id) || []
      }));
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