"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("Login error:", error.message);
    return { error: error.message };
  }

  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  // Déterminer l'URL de base pour la redirection
  // Priorité: 
  // 1. NEXT_PUBLIC_APP_URL (défini manuellement)
  // 2. VERCEL_URL (défini automatiquement par Vercel)
  // 3. Origin header (navigateur)
  // 4. Localhost (fallback)
  
  let origin = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!origin && process.env.VERCEL_URL) {
    origin = `https://${process.env.VERCEL_URL}`;
  }
  
  if (!origin) {
    origin = headers().get("origin") || "http://localhost:3000";
  }

  // Nettoyer l'URL (enlever le slash final si présent)
  if (origin.endsWith('/')) {
    origin = origin.slice(0, -1);
  }

  console.log("Signup redirect origin:", origin);

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const role = formData.get("role") as string;

  console.log("Attempting signup for:", email);

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
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Signup error:", error);
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Erreur lors de la création du compte" };
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
