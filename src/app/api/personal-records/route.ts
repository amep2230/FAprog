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

    const body = await request.json();
    const { athlete_id, exercise_id, weight, date, notes } = body;

    // Vérifier que l'utilisateur a le droit d'ajouter un PR pour cet athlète
    // Soit c'est son propre PR, soit c'est le coach de l'athlète
    const { data: athleteProfile } = await supabase
      .from("profiles")
      .select("id, coach_id")
      .eq("id", athlete_id)
      .single();

    if (!athleteProfile) {
      return NextResponse.json(
        { error: "Athlète non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions : soit l'athlète lui-même, soit son coach
    const isAthlete = user.id === athlete_id;
    const isCoach = user.id === athleteProfile.coach_id;

    if (!isAthlete && !isCoach) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission d'ajouter un PR pour cet athlète" },
        { status: 403 }
      );
    }

    // Créer le PR
    // Note: Pour un 1RM, on considère toujours 1 rep
    const { data: newPR, error: insertError } = await supabase
      .from("personal_records")
      .insert({
        athlete_id,
        exercise_id,
        reps: 1, // Toujours 1 pour un PR (1RM)
        weight,
        estimated_1rm: weight, // Pour un 1RM, c'est le même que le poids
        date,
        notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating PR:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création du PR" },
        { status: 500 }
      );
    }

    return NextResponse.json({ pr: newPR }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/personal-records:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// GET - Récupérer les PRs d'un athlète
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const athleteId = searchParams.get("athlete_id");
    const exerciseId = searchParams.get("exercise_id");

    if (!athleteId) {
      return NextResponse.json(
        { error: "athlete_id requis" },
        { status: 400 }
      );
    }

    // Vérifier les permissions
    const { data: athleteProfile } = await supabase
      .from("profiles")
      .select("id, coach_id")
      .eq("id", athleteId)
      .single();

    if (!athleteProfile) {
      return NextResponse.json(
        { error: "Athlète non trouvé" },
        { status: 404 }
      );
    }

    const isAthlete = user.id === athleteId;
    const isCoach = user.id === athleteProfile.coach_id;

    if (!isAthlete && !isCoach) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de voir les PRs de cet athlète" },
        { status: 403 }
      );
    }

    // Construire la requête
    let query = supabase
      .from("personal_records")
      .select(`
        *,
        exercise:exercises (
          id,
          name,
          category
        )
      `)
      .eq("athlete_id", athleteId)
      .order("date", { ascending: false });

    // Filtrer par exercice si spécifié
    if (exerciseId) {
      query = query.eq("exercise_id", exerciseId);
    }

    const { data: prs, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching PRs:", fetchError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des PRs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prs }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/personal-records:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
