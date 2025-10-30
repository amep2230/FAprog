import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un coach
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "coach") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, coachId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Créer le compte Supabase pour l'athlète
    // Note: Dans un environnement de production, utilisez l'Admin API de Supabase
    // Pour cet exemple, nous utilisons l'API publique
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: "athlete",
          coach_id: coachId,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Attendre un peu que le trigger crée le profil
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Utiliser la fonction SQL pour créer/mettre à jour le profil
    if (authData.user) {
      const { data: athleteProfile, error: profileError } = await supabase
        .rpc('create_athlete_profile', {
          athlete_id: authData.user.id,
          athlete_name: name,
          athlete_email: email,
          coach_id: coachId,
        });

      if (profileError) {
        console.error("Error creating profile via RPC:", profileError);
        return NextResponse.json(
          { error: "Erreur création profil: " + profileError.message },
          { status: 400 }
        );
      }

      return NextResponse.json(athleteProfile);
    }

    return NextResponse.json(
      { error: "Erreur lors de la création" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Erreur création athlète:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un coach
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "coach") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer les athlètes du coach
    const { data: athletes, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("coach_id", user.id)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(athletes);
  } catch (error) {
    console.error("Erreur récupération athlètes:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
