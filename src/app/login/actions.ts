"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;

  // Validation des données
  if (!email || !password || !name || !role) {
    return { error: "Tous les champs sont requis" };
  }

  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères" };
  }

  // Créer l'utilisateur avec les métadonnées
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Signup error:", error);
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Erreur lors de la création du compte" };
  }

  // Attendre un peu pour que le trigger se déclenche
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Vérifier si le profil a été créé par le trigger
  try {
    const { data: profile, error: selectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      // Le profil existe déjà (créé par le trigger)
      console.log("Profile created by trigger successfully");
    } else if (selectError) {
      // Le profil n'existe pas, le créer manuellement
      console.log("Profile not found, creating manually:", selectError.message);

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          name,
          email,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error creating profile manually:", insertError);
        return {
          error: `Erreur lors de la création du profil: ${insertError.message}`,
        };
      }

      console.log("Profile created manually successfully");
    }
  } catch (err) {
    console.error("Unexpected error during profile creation:", err);
    return { error: "Une erreur inattendue est survenue" };
  }

  // Si la confirmation par email est désactivée, rediriger
  if (data.user && data.session) {
    redirect("/");
  }

  // Sinon, retourner un message de succès
  return { success: "Compte créé ! Vérifiez vos emails pour confirmer." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
