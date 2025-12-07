
import { UserProfile, Badge, UserStats } from '../types';

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Mifflin-St Jeor Equation
export const calculateTMB = (weight: number, height: number, age: number, gender: 'M' | 'F'): number => {
  // Base: (10 × peso) + (6.25 × altura) − (5 × idade)
  let tmb = (10 * weight) + (6.25 * height) - (5 * age);

  if (gender === 'M') {
    tmb += 5;
  } else {
    tmb -= 161;
  }
  return Math.round(tmb);
};

export const calculateDailyCalories = (tmb: number, activityFactor: number, goal: 'loss' | 'maintenance' | 'hypertrophy'): number => {
  let target = tmb * activityFactor;
  
  // Simple heuristic based on PDF "Ex: -500kcal para perda de peso"
  if (goal === 'loss') target -= 500;
  if (goal === 'hypertrophy') target += 300;
  
  return Math.round(target);
};

export const calculateWaterGoal = (weightKg: number): number => {
  return Math.round(weightKg * 35);
};

export const calculateBMI = (weight: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
};

export const calculateExerciseCalories = (met: number, weightKg: number, durationMinutes: number): number => {
  // Formula: MET * Weight * (Duration / 60)
  return Math.round(met * weightKg * (durationMinutes / 60));
};

export const calculateLevel = (xp: number): number => {
  // Simple progression: Level = 1 + (XP / 500) - increased difficulty slightly
  return Math.floor(xp / 500) + 1;
};

export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDisplayDate = (isoDate: string): string => {
  const date = new Date(isoDate + 'T12:00:00'); 
  const today = new Date();
  
  if (formatDateISO(today) === isoDate) return 'Hoje';
  
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' });
};

// --- GAMIFICATION CONFIG ---

const createTiers = (targets: number[], baseXP: number) => {
    return targets.map((t, idx) => ({
        level: idx + 1,
        target: t,
        xp_reward: baseXP * (idx + 1), // Scaling XP
        unlocked: false
    }));
};

export const INITIAL_BADGES: Badge[] = [
  { 
    id: 'water_streak', 
    category: 'hydration',
    name: 'Mestre da Água', 
    description_template: 'Bata a meta de água por {target} dias.', 
    icon: '💧', 
    currentValue: 0,
    tiers: createTiers([3, 7, 15, 30, 365], 50) // 50, 100, 150... XP
  },
  { 
    id: 'consistency_streak', 
    category: 'consistency',
    name: 'Fogo da Consistência', 
    description_template: 'Use o app por {target} dias seguidos.', 
    icon: '🔥', 
    currentValue: 0,
    tiers: createTiers([3, 7, 15, 30, 365], 100) 
  },
  { 
    id: 'total_logs', 
    category: 'diet',
    name: 'Diário de Ferro', 
    description_template: 'Realize {target} registros totais (refeições/treinos).', 
    icon: '📝', 
    currentValue: 0,
    tiers: createTiers([10, 50, 100, 500, 1000], 20) 
  },
  {
      id: 'level_climber',
      category: 'consistency',
      name: 'Evolução Constante',
      description_template: 'Alcance o nível {target} de usuário.',
      icon: '👑',
      currentValue: 1,
      tiers: createTiers([5, 10, 20, 50, 100], 200)
  }
];
