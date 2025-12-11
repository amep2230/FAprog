'use server';

import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateMealPlanPrompt } from '@/lib/nutrition/prompts';
import { DailyMacroGoal, DietaryPreferences, Meal, DayMealPlan } from '@/lib/nutrition/types';
import { revalidatePath } from 'next/cache';

// NOTE: In production, use process.env.GEMINI_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function generateDailyMealPlan(
  date: string = new Date().toISOString().split('T')[0],
  lockedMealIds: string[] = []
) {
  const supabase = await createClient();
  
  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // 2. Get Nutrition Profile
    const { data: profile, error: profileError } = await supabase
      .from('nutrition_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Nutrition profile not found. Please complete onboarding first.');
    }

    // 3. Check if plan already exists for today
    const { data: existingPlan } = await supabase
      .from('nutrition_daily_plans')
      .select('id, is_generated')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    let planId = existingPlan?.id;
    let lockedMeals: Meal[] = [];
    let mealsToAvoid: string[] = [];

    // Create plan if not exists
    if (!planId) {
      const { data: newPlan, error: createError } = await supabase
        .from('nutrition_daily_plans')
        .insert({
          user_id: user.id,
          date: date,
          target_calories: profile.target_calories,
          target_macros: {
            protein: profile.target_protein_g,
            carbs: profile.target_carbs_g,
            fats: profile.target_fats_g
          },
          is_generated: false
        })
        .select()
        .single();

      if (createError) throw createError;
      planId = newPlan.id;
    } else {
      // Fetch all existing meals for this plan to determine locked vs to-be-replaced
      const { data: allMeals } = await supabase
        .from('nutrition_meals')
        .select('*')
        .eq('daily_plan_id', planId);
      
      if (allMeals) {
        lockedMeals = allMeals
          .filter((m: any) => lockedMealIds.includes(m.id))
          .map((m: any) => ({
            id: m.id,
            type: m.meal_type,
            name: m.name,
            description: m.description,
            ingredients: [], 
            macros: {
              calories: m.calories,
              protein: m.protein_g,
              carbs: m.carbs_g,
              fats: m.fats_g
            },
            isEaten: m.is_eaten
          }));

        // Meals that are NOT locked are the ones we are replacing.
        // We want to tell AI to avoid generating the exact same thing again.
        mealsToAvoid = allMeals
          .filter((m: any) => !lockedMealIds.includes(m.id))
          .map((m: any) => m.name);
      }
    }

    // 4. Generate with Gemini
    // Utilisation de gemini-2.5-flash (modèle disponible)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const macros: DailyMacroGoal = {
      calories: profile.target_calories,
      protein: profile.target_protein_g,
      carbs: profile.target_carbs_g,
      fats: profile.target_fats_g
    };

    const preferences: DietaryPreferences = profile.dietary_preferences as DietaryPreferences;

    const prompt = generateMealPlanPrompt(macros, preferences, lockedMeals, mealsToAvoid);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up JSON if markdown code blocks are present
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const mealPlanData = JSON.parse(jsonStr);

    // 5. Save meals to database
    // Delete non-locked meals
    let deleteQuery = supabase
      .from('nutrition_meals')
      .delete()
      .eq('daily_plan_id', planId);
    
    if (lockedMealIds.length > 0) {
      deleteQuery = deleteQuery.not('id', 'in', `(${lockedMealIds.join(',')})`);
    }
    
    await deleteQuery;

    const mealsToInsert = mealPlanData.meals.map((meal: any) => ({
      daily_plan_id: planId,
      meal_type: mapMealType(meal.type),
      name: meal.name,
      description: meal.description + '\n\nIngrédients:\n' + meal.ingredients.join('\n'),
      calories: Math.round(Number(meal.macros.calories)),
      protein_g: Math.round(Number(meal.macros.protein)),
      carbs_g: Math.round(Number(meal.macros.carbs)),
      fats_g: Math.round(Number(meal.macros.fats)),
      is_eaten: false
    }));

    const { error: insertError } = await supabase
      .from('nutrition_meals')
      .insert(mealsToInsert);

    if (insertError) throw insertError;

    // Mark plan as generated
    await supabase
      .from('nutrition_daily_plans')
      .update({ is_generated: true })
      .eq('id', planId);

    revalidatePath('/dashboard/athlete');
    return { success: true, data: mealPlanData };

  } catch (error: any) {
    console.error('Error generating meal plan:', error);
    return { success: false, error: error.message };
  }
}

function mapMealType(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes('breakfast') || normalized.includes('déjeuner') || normalized.includes('matin')) return 'breakfast';
  if (normalized.includes('lunch') || normalized.includes('midi')) return 'lunch';
  if (normalized.includes('dinner') || normalized.includes('dîner') || normalized.includes('soir')) return 'dinner';
  if (normalized.includes('snack') || normalized.includes('collation')) return 'snack_1';
  return 'snack_1'; // Default
}
