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

  // Récupérer le bloc avec ses semaines (sans charger les sessions/sets pour la performance)
  const { data: block, error } = await supabase
    .from("training_blocks")
    .select(`
      *,
      weeks:training_weeks (
        id,
        week_number,
        name,
        notes,
        created_at
      )
    `)
    .eq("id", blockId)
    .eq("coach_id", user.id)
    .eq("athlete_id", athleteId)
    .single();

  if (error || !block) {
    notFound();
  }

  // Compter le nombre de sessions pour chaque semaine
  if (block.weeks && block.weeks.length > 0) {
    const weekIds = block.weeks.map((w: any) => w.id);
    
    const { data: sessionCounts } = await supabase
      .from("sessions")
      .select("week_id")
      .in("week_id", weekIds);

    // Créer un map des counts
    const countsMap = new Map<string, number>();
    sessionCounts?.forEach((session: any) => {
      const count = countsMap.get(session.week_id) || 0;
      countsMap.set(session.week_id, count + 1);
    });

    // Ajouter le count à chaque semaine
    block.weeks = block.weeks.map((week: any) => ({
      ...week,
      sessions: new Array(countsMap.get(week.id) || 0), // Créer un tableau vide de la bonne taille
    }));
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
