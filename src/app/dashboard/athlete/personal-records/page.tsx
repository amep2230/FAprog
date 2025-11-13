import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PersonalRecordsManager from "@/components/athlete/PersonalRecordsManager";

export default async function AthletePersonalRecordsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer le profil de l'athlète
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "athlete") {
    redirect("/dashboard/coach");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <PersonalRecordsManager
          athleteId={user.id}
          athleteName={profile.full_name || "Athlète"}
        />
      </div>
    </div>
  );
}
