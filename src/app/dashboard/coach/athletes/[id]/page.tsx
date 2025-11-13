import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import AthleteProfileView from "@/components/coach/AthleteProfileView";

interface AthleteProfilePageProps {
  params: {
    id: string;
  };
}

export default async function AthleteProfilePage({ params }: AthleteProfilePageProps) {
  const supabase = await createClient();

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est un coach
  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (coachProfile?.role !== "coach") {
    redirect("/dashboard/athlete");
  }

  // Récupérer le profil de l'athlète
  const { data: athlete, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .eq("coach_id", user.id)
    .single();

  if (error || !athlete) {
    notFound();
  }

  // Récupérer les programmes de l'athlète (sans détails sessions/sets pour la performance)
  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, week_number, created_at, athlete_id")
    .eq("athlete_id", params.id)
    .order("created_at", { ascending: false });

  // Récupérer les records personnels
  const { data: personalRecords } = await supabase
    .from("personal_records")
    .select(`
      *,
      exercise:exercises (*)
    `)
    .eq("athlete_id", params.id)
    .order("created_at", { ascending: false });

  // Récupérer les logs de séances pour calculer les statistiques (uniquement les champs nécessaires)
  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select(`
      id,
      completed_at,
      set_logs (
        actual_weight,
        actual_reps
      )
    `)
    .eq("athlete_id", params.id)
    .order("completed_at", { ascending: false });

  // Récupérer tous les exercices pour le formulaire PR
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, category")
    .order("name");

  // Récupérer la semaine en cours (bloc actif, dernière semaine avec des sessions)
  const { data: activeBlock } = await supabase
    .from("training_blocks")
    .select(`
      id,
      name,
      weeks:training_weeks (
        id,
        week_number,
        name,
        notes,
        sessions (
          id,
          session_number,
          name,
          notes,
          sets (
            id,
            exercise_name,
            set_number,
            prescribed_reps,
            prescribed_weight,
            prescribed_rpe
          )
        )
      )
    `)
    .eq("athlete_id", params.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Trouver la semaine en cours (la plus récente avec des sessions)
  let currentWeek = null;
  if (activeBlock?.weeks && activeBlock.weeks.length > 0) {
    // Trier les semaines par numéro décroissant
    const sortedWeeks = [...activeBlock.weeks].sort((a: any, b: any) => b.week_number - a.week_number);
    // Prendre la plus récente qui a des sessions
    currentWeek = sortedWeeks.find((w: any) => w.sessions && w.sessions.length > 0) || sortedWeeks[0];
    
    if (currentWeek) {
      // Charger les logs de session pour cette semaine pour voir l'accomplissement
      const sessionIds = currentWeek.sessions.map((s: any) => s.id);
      if (sessionIds.length > 0) {
        const { data: logs } = await supabase
          .from("session_logs")
          .select("session_id, completed_at, notes")
          .in("session_id", sessionIds)
          .eq("athlete_id", params.id);
        
        // Ajouter les logs aux sessions
        currentWeek.sessions = currentWeek.sessions.map((session: any) => {
          const log = logs?.find((l: any) => l.session_id === session.id);
          return {
            ...session,
            completed: !!log,
            completed_at: log?.completed_at,
            log_notes: log?.notes
          };
        });
      }
    }
  }

  return (
    <AthleteProfileView
      athlete={athlete}
      programs={programs || []}
      personalRecords={personalRecords || []}
      sessionLogs={sessionLogs || []}
      exercises={exercises || []}
      currentWeek={currentWeek}
      activeBlock={activeBlock}
    />
  );
}
