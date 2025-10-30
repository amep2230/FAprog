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

  // Créer l'utilisateur
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

  // Vérifier si le profil a été créé par le trigger
  // Sinon le créer manuellement
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    // Créer le profil manuellement
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        name,
        email,
        role,
      });

    if (insertError) {
      console.error("Error creating profile:", insertError);
      return { error: "Erreur lors de la création du profil" };
    }
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
