'use server';

import { createClient } from '@/lib/supabase/server';
import { calculateNutritionPlan } from '@/lib/nutrition/service';
import { UserMeasurements, DietaryPreferences, DailyMacroGoal } from '@/lib/nutrition/types';
import { revalidatePath } from 'next/cache';

export async function saveNutritionProfile(
  measurements: UserMeasurements,
  preferences: DietaryPreferences
): Promise<{ success: boolean; macros?: DailyMacroGoal; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 2. Calculate macros
    const macros = calculateNutritionPlan(measurements);

    // 3. Save to database
    const { error: dbError } = await supabase
      .from('nutrition_profiles')
      .upsert({
        user_id: user.id,
        height_cm: measurements.height,
        weight_kg: measurements.weight,
        age: measurements.age,
        gender: measurements.gender,
        activity_level: measurements.activityLevel,
        goal: measurements.goal,
        dietary_preferences: preferences,
        target_calories: macros.calories,
        target_protein_g: macros.protein,
        target_carbs_g: macros.carbs,
        target_fats_g: macros.fats,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Error saving nutrition profile:', dbError);
      return { success: false, error: 'Failed to save profile' };
    }

    revalidatePath('/dashboard/athlete');
    return { success: true, macros };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
