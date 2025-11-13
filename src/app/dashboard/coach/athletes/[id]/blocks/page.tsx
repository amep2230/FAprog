import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import BlockManager from "@/components/coach/BlockManager";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BlocksPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BlocksPage({ params }: BlocksPageProps) {
  const { id: athleteId } = await params;
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

  // Récupérer l'athlète
  const { data: athlete, error: athleteError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", athleteId)
    .eq("coach_id", user.id)
    .single();

  if (athleteError || !athlete) {
    notFound();
  }

  // Récupérer tous les blocs de l'athlète avec le nombre de semaines
  const { data: blocks } = await supabase
    .from("training_blocks")
    .select(`
      *,
      weeks:training_weeks (
        id,
        week_number,
        name,
        created_at
      )
    `)
    .eq("athlete_id", athleteId)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/coach">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Blocs d&apos;entraînement
            </h1>
            <p className="text-gray-500">{athlete.name}</p>
          </div>
        </div>

        {/* Block Manager */}
        <BlockManager
          athleteId={athleteId}
          blocks={blocks || []}
          coachId={user.id}
        />
      </div>
    </div>
  );
}
