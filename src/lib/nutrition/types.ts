export type ActivityLevel = 
  | 'sedentary' 
  | 'lightly_active' 
  | 'moderately_active' 
  | 'very_active' 
  | 'extra_active';

export type DietGoal = 
  | 'weight_loss' 
  | 'maintenance' 
  | 'muscle_gain';

export type Gender = 'male' | 'female';

export interface UserMeasurements {
  weight: number; // kg
  height: number; // cm
  age: number; // years
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: DietGoal;
}

export interface DietaryPreferences {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  allergies: string[];
  intolerances: string[];
  excludedIngredients: string[];
}

export interface UserDietProfile {
  measurements: UserMeasurements;
  preferences: DietaryPreferences;
}

export interface DailyMacroGoal {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack_1' | 'snack_2' | 'pre_workout' | 'post_workout';

export interface Meal {
  id: string; // Added ID
  type: MealType;
  name: string;
  description: string;
  ingredients: string[];
  macros: DailyMacroGoal;
  isEaten: boolean; // Added status
}

export interface DayMealPlan {
  meals: Meal[];
  totalMacros: DailyMacroGoal;
}
