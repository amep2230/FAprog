import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PersonalRecordsManager from "@/components/athlete/PersonalRecordsManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function CoachAthletePersonalRecordsPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que c'est bien un coach
  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!coachProfile || coachProfile.role !== "coach") {
    redirect("/dashboard/athlete");
  }

  // Récupérer les infos de l'athlète et vérifier qu'il appartient au coach
  const { data: athleteProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .eq("coach_id", user.id)
    .single();

  if (!athleteProfile) {
    redirect("/dashboard/coach");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/coach/athletes/${params.id}`}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au profil
            </Button>
          </Link>
        </div>
        <PersonalRecordsManager
          athleteId={params.id}
          athleteName={athleteProfile.full_name || "Athlète"}
        />
      </div>
    </div>
  );
}
