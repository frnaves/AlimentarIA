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
  // Simple progression: Level = 1 + (XP / 100)
  return Math.floor(xp / 100) + 1;
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

// Initial Badges Configuration
export const INITIAL_BADGES: Badge[] = [
  { id: 'first_steps', name: 'Primeiros Passos', description: 'Complete seu perfil e onboarding.', icon: '🚀', unlocked: false },
  { id: 'streak_3', name: 'Aquecimento', description: 'Mantenha o foco por 3 dias seguidos.', icon: '🔥', unlocked: false },
  { id: 'water_master', name: 'Aquático', description: 'Bata a meta de água por 3 dias.', icon: '💧', unlocked: false },
  { id: 'logger_10', name: 'Hábito de Ferro', description: 'Registre 10 atividades (refeições/treinos).', icon: '🦾', unlocked: false },
  { id: 'level_5', name: 'Mestre da Saúde', description: 'Atinja o nível 5.', icon: '👑', unlocked: false },
  { id: 'weight_goal', name: 'Na Mosca', description: 'Atinja sua meta de peso.', icon: '🎯', unlocked: false },
];