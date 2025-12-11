'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleMealStatus(mealId: string, isEaten: boolean) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('nutrition_meals')
      .update({ is_eaten: isEaten })
      .eq('id', mealId);

    if (error) throw error;

    revalidatePath('/dashboard/athlete');
    return { success: true };
  } catch (error) {
    console.error('Error toggling meal status:', error);
    return { success: false, error: 'Failed to update meal status' };
  }
}
