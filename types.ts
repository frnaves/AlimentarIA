export interface Macros {
  kcal: number;
  p: number; // protein
  c: number; // carbs
  f: number; // fat
}

export interface MealItem {
  name: string;
  quantity: number;
  unit: string;
  macros: Macros;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  timestamp_updated: string;
  items: MealItem[];
}

export interface Exercise {
  id: string;
  name: string;
  duration_minutes: number;
  met: number;
  calories_burned: number;
}

export interface NutritionLog {
  date: string; // ISO YYYY-MM-DD key
  summary: {
    total_kcal: number;
    total_protein: number;
    water_intake_ml: number;
  };
  meals: Meal[];
  exercises: Exercise[];
}

export interface UserProfile {
  // Core Identity
  name: string;
  gender: 'M' | 'F';
  birthDate: string;
  
  // Anthropometry
  height_cm: number;
  current_weight_kg: number;
  abdominal_circ_cm?: number; // New mandatory field
  
  // Goals & Settings
  target_weight_kg: number;
  activity_factor: 1.2 | 1.375 | 1.55 | 1.725;
  goal: 'loss' | 'maintenance' | 'hypertrophy'; // derived or explicit
  
  // Computed Settings
  calculated_tmb: number;
  daily_kcal_goal: number;
  daily_water_goal: number;
  
  // System Flags
  onboarding_completed: boolean;
}

export interface BiometricsLog {
  id: string;
  date: string;
  basics: {
    weight_kg: number;
    bmi: number;
  };
  circumferences_cm: {
    waist?: number;
    abdomen?: number;
    hips?: number;
    neck?: number;
    arm_right?: number;
    thigh_right?: number;
    calf_right?: number;
  };
  ratios: {
    waist_hip_ratio?: number;
    waist_height_ratio?: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface CustomChallenge {
  id: string;
  title: string;
  xp_reward: number;
  completed: boolean;
}

export interface UserStats {
  streak_days: number;
  total_xp: number;
  current_level: number;
  badges: Badge[];
  custom_challenges: CustomChallenge[];
}