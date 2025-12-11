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

  // --- LOGIQUE DE RÉCUPÉRATION DU PROGRAMME (BLOCS OU ANCIEN SYSTÈME) ---
  
  let currentProgram = null;
  let programsList: any[] = [];

  // 1. Essayer de récupérer un BLOC ACTIF
  const { data: activeBlock } = await supabase
    .from("training_blocks")
    .select(`
      *,
      coach:profiles!training_blocks_coach_id_fkey(name, email)
    `)
    .eq("athlete_id", user.id)
    .eq("is_active", true)
    .single();

  if (activeBlock) {
    // Si un bloc actif existe, on récupère ses semaines
    const { data: weeks } = await supabase
      .from("training_weeks")
      .select("*")
      .eq("block_id", activeBlock.id)
      .order("week_number", { ascending: true });

    if (weeks && weeks.length > 0) {
      // Pour l'instant, on prend la première semaine comme semaine active
      // TODO: Implémenter une logique pour déterminer la semaine active basée sur la date
      const currentWeek = weeks[0];

      // Récupérer les sessions de cette semaine
      const { data: sessions } = await supabase
        .from("sessions")
        .select(`
          *,
          sets (
            *,
            exercise:exercises (*)
          )
        `)
        .eq("week_id", currentWeek.id)
        .order("day_of_week", { ascending: true });

      currentProgram = {
        id: currentWeek.id, // On utilise l'ID de la semaine comme ID de programme
        name: activeBlock.name, // Nom du bloc
        week_name: currentWeek.name, // Nom de la semaine
        week_number: currentWeek.week_number,
        sessions: sessions || [],
        coach: activeBlock.coach,
        isBlock: true,
        blockId: activeBlock.id
      };
    }
  }

  // 2. Si pas de bloc actif, essayer l'ANCIEN SYSTÈME (programs)
  if (!currentProgram) {
    const { data: oldProgram } = await supabase
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
      
    currentProgram = oldProgram;
  }

  // Récupérer la liste des programmes (pour l'historique)
  // On combine les blocs et les anciens programmes
  const { data: oldPrograms } = await supabase
    .from("programs")
    .select(`
      *,
      coach:profiles!programs_coach_id_fkey(name, email)
    `)
    .eq("athlete_id", user.id)
    .order("created_at", { ascending: false });
    
  programsList = oldPrograms || [];

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
    programs={programsList}
    currentProgram={currentProgram}
    sessionLogs={sessionLogs}
    exercises={exercises || []}
    personalRecords={personalRecords || []}
    nutritionProfile={nutritionProfile}
    dailyPlan={dailyPlan}
  />;
}
