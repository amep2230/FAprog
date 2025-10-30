import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import BlockDetailView from "@/components/coach/BlockDetailView";

interface BlockDetailPageProps {
  params: Promise<{
    id: string;
    blockId: string;
  }>;
}

export default async function BlockDetailPage({ params }: BlockDetailPageProps) {
  const { id: athleteId, blockId } = await params;
  const supabase = await createClient();

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

  // Récupérer le bloc avec ses semaines
  const { data: block, error } = await supabase
    .from("training_blocks")
    .select(`
      *,
      weeks:training_weeks (
        *,
        sessions (
          *,
          sets (
            *,
            exercise:exercises (*)
          )
        )
      )
    `)
    .eq("id", blockId)
    .eq("coach_id", user.id)
    .eq("athlete_id", athleteId)
    .single();

  if (error || !block) {
    notFound();
  }

  // Récupérer tous les exercices
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  // Récupérer l'athlète
  const { data: athlete } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", athleteId)
    .single();

  return (
    <BlockDetailView
      block={block}
      athleteId={athleteId}
      athleteName={athlete?.name || "Athlète"}
      coachId={user.id}
      exercises={exercises || []}
    />
  );
}
