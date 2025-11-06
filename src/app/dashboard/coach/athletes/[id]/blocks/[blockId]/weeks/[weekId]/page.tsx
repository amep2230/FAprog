import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WeekEditor from "@/components/coach/WeekEditor";

interface PageProps {
  params: Promise<{
    id: string;
    blockId: string;
    weekId: string;
  }>;
}

export default async function WeekPage({ params }: PageProps) {
  const { id, blockId, weekId } = await params;
  const supabase = await createClient();

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer la semaine avec toutes ses séances
  const { data: week, error } = await supabase
    .from("training_weeks")
    .select(`
      *,
      block:training_blocks (
        id,
        name,
        athlete_id,
        block_type
      ),
      sessions (
        id,
        session_number,
        name,
        notes,
        created_at,
        sets (
          id,
          exercise_name,
          exercise_type,
          set_number,
          prescribed_reps,
          prescribed_weight,
          prescribed_rpe,
          actual_reps,
          actual_weight,
          actual_rpe,
          notes,
          created_at
        )
      )
    `)
    .eq("id", weekId)
    .single();

  console.log("Week data:", week);
  console.log("Week error:", error);
  console.log("Week block:", week?.block);

  if (error || !week) {
    console.log("Redirecting to block page - error or no week");
    redirect(`/dashboard/coach/athletes/${id}/blocks/${blockId}`);
  }

  // Vérifier que le coach a accès à cet athlète
  if (week.block?.athlete_id !== id) {
    console.log("Redirecting to coach dashboard - athlete_id mismatch");
    redirect("/dashboard/coach");
  }

  return <WeekEditor week={week} athleteId={id} blockId={blockId} />;
}
