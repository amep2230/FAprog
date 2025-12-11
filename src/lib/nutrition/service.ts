import { DailyMacroGoal, UserMeasurements } from './types';

/**
 * Calcule le BMR (Basal Metabolic Rate) selon la formule de Mifflin-St Jeor
 */
function calculateBMR(measurements: UserMeasurements): number {
  const { weight, height, age, gender } = measurements;
  
  // Formule de base : (10 x poids en kg) + (6.25 x taille en cm) - (5 x âge en années) + s
  // s = +5 pour les hommes, -161 pour les femmes
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  
  return Math.round(bmr);
}

/**
 * Calcule le TDEE (Total Daily Energy Expenditure) en fonction du niveau d'activité
 */
function calculateTDEE(bmr: number, activityLevel: UserMeasurements['activityLevel']): number {
  const multipliers: Record<UserMeasurements['activityLevel'], number> = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extra_active': 1.9
  };

  return Math.round(bmr * multipliers[activityLevel]);
}

/**
 * Ajuste les calories en fonction de l'objectif
 */
function adjustCaloriesForGoal(tdee: number, goal: UserMeasurements['goal']): number {
  switch (goal) {
    case 'weight_loss':
      // Déficit modéré de ~20% ou 500kcal. Prenons 500kcal pour simplifier, mais pas en dessous du BMR (idéalement)
      return tdee - 500;
    case 'muscle_gain':
      // Surplus léger de ~250-300kcal
      return tdee + 300;
    case 'maintenance':
    default:
      return tdee;
  }
}

/**
 * Calcule les macros pour un athlète
 * Stratégie : 
 * - Protéines : 2g / kg de poids de corps (standard athlète)
 * - Lipides : 1g / kg de poids de corps (santé hormonale)
 * - Glucides : Le reste des calories
 */
function calculateMacros(targetCalories: number, weight: number): DailyMacroGoal {
  // 1g Protéine = 4 kcal
  // 1g Glucide = 4 kcal
  // 1g Lipide = 9 kcal

  // Cibles fixes basées sur le poids
  const proteinPerKg = 2.0;
  const fatPerKg = 1.0;

  let proteinGrams = Math.round(weight * proteinPerKg);
  let fatGrams = Math.round(weight * fatPerKg);

  // Calcul des calories prises par P et L
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;

  // Le reste en glucides
  let remainingCalories = targetCalories - (proteinCalories + fatCalories);
  
  // Sécurité : si le déficit est trop grand et qu'il ne reste plus de place pour les glucides
  // On ajuste (rare mais possible pour les petits gabarits en gros déficit)
  if (remainingCalories < 0) {
    remainingCalories = 0;
    // On pourrait réduire un peu les graisses ou protéines ici si nécessaire, 
    // mais pour l'instant on garde la priorité aux protéines.
  }

  const carbGrams = Math.round(remainingCalories / 4);

  return {
    calories: targetCalories,
    protein: proteinGrams,
    fats: fatGrams,
    carbs: carbGrams
  };
}

/**
 * Service principal pour calculer le plan nutritionnel
 */
export function calculateNutritionPlan(measurements: UserMeasurements): DailyMacroGoal {
  const bmr = calculateBMR(measurements);
  const tdee = calculateTDEE(bmr, measurements.activityLevel);
  const targetCalories = adjustCaloriesForGoal(tdee, measurements.goal);
  
  return calculateMacros(targetCalories, measurements.weight);
}
