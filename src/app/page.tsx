import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer le profil utilisateur pour connaître son rôle
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    // Si le profil n'existe pas, créons-le
    const userMetadata = user.user_metadata || {};
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        name: userMetadata.name || user.email?.split('@')[0] || 'Utilisateur',
        email: user.email!,
        role: userMetadata.role || 'athlete',
      });

    if (insertError) {
      console.error("Error creating profile:", insertError);
      redirect("/login");
    }

    // Rediriger selon le rôle par défaut
    // Note: Si le profil vient d'être créé dans le callback, ce bloc ne devrait pas être atteint
    // sauf s'il y a eu une erreur de timing ou si le callback n'a pas fonctionné.
    // On utilise 'athlete' par défaut ici si userMetadata.role n'est pas défini.
    const role = userMetadata.role || 'athlete';
    redirect(role === "coach" ? "/dashboard/coach" : "/dashboard/athlete");
  }

  if (profile?.role === "coach") {
    redirect("/dashboard/coach");
  } else if (profile?.role === "athlete") {
    redirect("/dashboard/athlete");
  } else {
    redirect("/login");
  }
}
