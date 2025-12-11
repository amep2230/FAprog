import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AthleteDashboard from "@/components/athlete/AthleteDashboard";

export default async function AthletePage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est bien un athlète
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "athlete") {
    redirect("/dashboard/coach");
  }

  // Récupérer les programmes de l'athlète
  const { data: programs } = await supabase
    .from("programs")
    .select(`
      *,
      coach:profiles!programs_coach_id_fkey(name, email)
    `)
    .eq("athlete_id", user.id)
    .order("created_at", { ascending: false });

  // Récupérer le programme de la semaine actuelle avec toutes les sessions et séries
  const { data: currentProgram } = await supabase
    .from("programs")
    .select(`
      *,
      coach:profiles!programs_coach_id_fkey(name, email),
      sessions (
        *,
        sets (
          *,
          exercise:exercises (*)
        )
      )
    `)
    .eq("athlete_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Récupérer les logs de sessions pour savoir quelles sessions sont complétées
  let sessionLogs: any[] = [];
  if (currentProgram) {
    const { data: logs } = await supabase
      .from("session_logs")
      .select("*")
      .eq("athlete_id", user.id)
      .in(
        "session_id",
        currentProgram.sessions.map((s: any) => s.id)
      );
    sessionLogs = logs || [];
  }

  // Récupérer tous les exercices pour le formulaire PR
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, category, muscle_group")
    .order("name");

  // Récupérer les records personnels de l'athlète
  const { data: personalRecords } = await supabase
    .from("personal_records")
    .select(`
      *,
      exercise:exercises (*)
    `)
    .eq("athlete_id", user.id)
    .order("created_at", { ascending: false });

  // --- NUTRITION DATA ---
  // 1. Check if profile exists
  const { data: nutritionProfile } = await supabase
    .from('nutrition_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // 2. Check if plan exists for today
  const today = new Date().toISOString().split('T')[0];
  let dailyPlan = null;

  if (nutritionProfile) {
    const { data: plan } = await supabase
      .from('nutrition_daily_plans')
      .select(`
        *,
        meals:nutrition_meals(*)
      `)
      .eq('user_id', user.id)
      .eq('date', today)
      .single();
    
    if (plan) {
      // Transform to match DayMealPlan interface
      dailyPlan = {
        meals: plan.meals.map((m: any) => ({
          id: m.id,
          type: m.meal_type,
          name: m.name,
          description: m.description,
          ingredients: m.description.split('Ingrédients:\n')[1]?.split('\n') || [], // Basic parsing fallback
          macros: {
            calories: m.calories,
            protein: m.protein_g,
            carbs: m.carbs_g,
            fats: m.fats_g
          },
          isEaten: m.is_eaten
        })),
        totalMacros: {
          calories: plan.meals.reduce((acc: number, m: any) => acc + m.calories, 0),
          protein: plan.meals.reduce((acc: number, m: any) => acc + m.protein_g, 0),
          carbs: plan.meals.reduce((acc: number, m: any) => acc + m.carbs_g, 0),
          fats: plan.meals.reduce((acc: number, m: any) => acc + m.fats_g, 0),
        }
      };
    }
  }

  return <AthleteDashboard 
    athlete={profile} 
    programs={programs || []}
    currentProgram={currentProgram}
    sessionLogs={sessionLogs}
    exercises={exercises || []}
    personalRecords={personalRecords || []}
    nutritionProfile={nutritionProfile}
    dailyPlan={dailyPlan}
  />;
}
