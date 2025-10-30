import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CoachDashboard from "@/components/coach/CoachDashboard";

export default async function CoachPage() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Vérifier que l'utilisateur est bien un coach
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coach") {
    redirect("/dashboard/athlete");
  }

  // Récupérer les athlètes du coach
  const { data: athletes } = await supabase
    .from("profiles")
    .select("*")
    .eq("coach_id", user.id)
    .order("name");

  return <CoachDashboard coach={profile} athletes={athletes || []} />;
}
