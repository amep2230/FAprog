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

  // Récupérer les programmes de l'athlète
  const { data: programs } = await supabase
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

  // Récupérer les logs de séances pour calculer les statistiques
  const { data: sessionLogs } = await supabase
    .from("session_logs")
    .select(`
      *,
      session:sessions (
        *,
        program:programs (
          week_number
        )
      ),
      set_logs (
        *,
        set:sets (
          *,
          exercise:exercises (*)
        )
      )
    `)
    .eq("athlete_id", params.id)
    .order("completed_at", { ascending: false });

  // Récupérer tous les exercices pour le formulaire PR
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, category")
    .order("name");

  return (
    <AthleteProfileView
      athlete={athlete}
      programs={programs || []}
      personalRecords={personalRecords || []}
      sessionLogs={sessionLogs || []}
      exercises={exercises || []}
    />
  );
}
