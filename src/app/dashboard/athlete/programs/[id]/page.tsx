import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import ProgramDetailView from "@/components/athlete/ProgramDetailView";

interface ProgramDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const supabase = await createClient();

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est un athlète
  const { data: athleteProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (athleteProfile?.role !== "athlete") {
    redirect("/dashboard/coach");
  }

  // Récupérer le programme avec toutes ses séances et sets
  // 1. Essayer de récupérer depuis la table programs (ancien système)
  let { data: program, error } = await supabase
    .from("programs")
    .select(`
      *,
      sessions (
        *,
        sets (
          *,
          exercise:exercises (*)
        )
      )
    `)
    .eq("id", params.id)
    .eq("athlete_id", user.id)
    .single();

  // 2. Si pas trouvé, essayer de récupérer depuis training_weeks (nouveau système)
  if (!program) {
    const { data: week, error: weekError } = await supabase
      .from("training_weeks")
      .select(`
        *,
        block:training_blocks (
          *,
          coach:profiles!training_blocks_coach_id_fkey(name, email)
        ),
        sessions (
          *,
          sets (
            *,
            exercise:exercises (*)
          )
        )
      `)
      .eq("id", params.id)
      .single();

    if (week) {
      // Vérifier que le bloc appartient bien à l'athlète
      if (week.block.athlete_id !== user.id) {
        redirect("/dashboard/athlete");
      }

      program = {
        id: week.id,
        name: `${week.block.name} - ${week.name}`,
        week_number: week.week_number,
        created_at: week.created_at,
        coach_id: week.block.coach_id,
        athlete_id: week.block.athlete_id,
        sessions: week.sessions,
        coach: week.block.coach,
        isBlock: true
      };
    }
  }

  if (!program) {
    notFound();
  }

  // Récupérer les infos du coach séparément
  let coachInfo = null;
  if (program?.coach_id) {
    const { data: coach } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", program.coach_id)
      .single();
    coachInfo = coach;
  }

  // Récupérer les logs de séances déjà complétées pour ce programme
  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select(`
      *,
      set_logs (
        *,
        set:sets (
          *,
          exercise:exercises (*)
        )
      )
    `)
    .eq("athlete_id", user.id)
    .in(
      "session_id",
      program.sessions.map((s: any) => s.id)
    )
    .order("completed_at", { ascending: false });

  return (
    <ProgramDetailView
      program={{ ...program, coach: coachInfo }}
      sessionLogs={sessionLogs || []}
      athleteId={user.id}
    />
  );
}
