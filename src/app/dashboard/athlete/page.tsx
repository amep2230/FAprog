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
    .select("id, name, category")
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

  return <AthleteDashboard 
    athlete={profile} 
    programs={programs || []}
    currentProgram={currentProgram}
    sessionLogs={sessionLogs}
    exercises={exercises || []}
    personalRecords={personalRecords || []}
  />;
}
