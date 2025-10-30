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
  const { data: program, error } = await supabase
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

  if (error || !program) {
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
