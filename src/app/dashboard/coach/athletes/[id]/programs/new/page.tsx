import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProgramCreator from "@/components/coach/ProgramCreator";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewProgramPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est un coach
  const { data: coach } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (coach?.role !== "coach") {
    redirect("/dashboard/athlete");
  }

  // Récupérer l'athlète
  const { data: athlete } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("coach_id", user.id)
    .single();

  if (!athlete) {
    redirect("/dashboard/coach");
  }

  // Récupérer tous les exercices
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  // Récupérer la table RPE
  const { data: rpeTable } = await supabase
    .from("rpe_table")
    .select("*")
    .order("reps", { ascending: true })
    .order("rpe", { ascending: true });

  // Récupérer les PRs de l'athlète
  const { data: personalRecords } = await supabase
    .from("personal_records")
    .select("*, exercise:exercises(*)")
    .eq("athlete_id", id);

  return (
    <ProgramCreator
      coach={coach}
      athlete={athlete}
      exercises={exercises || []}
      rpeTable={rpeTable || []}
      personalRecords={personalRecords || []}
    />
  );
}
