import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { coachId, athleteId, name, weekNumber, sessions } = body;

    if (!coachId || !athleteId || !name || !weekNumber || !sessions) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    // Créer le programme
    const { data: program, error: programError } = await supabase
      .from("programs")
      .insert({
        coach_id: coachId,
        athlete_id: athleteId,
        name,
        week_number: weekNumber,
      })
      .select()
      .single();

    if (programError) {
      console.error("Erreur création programme:", programError);
      return NextResponse.json(
        { error: programError.message },
        { status: 400 }
      );
    }

    // Créer les séances et les sets
    for (const sessionData of sessions) {
      const { data: session, error: sessionError } = await supabase
        .from("v2_sessions")
        .insert({
          program_id: program.id,
          day_of_week: sessionData.dayOfWeek,
          name: sessionData.name,
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Erreur création séance:", sessionError);
        continue;
      }

      // Créer les sets pour cette session
      if (sessionData.sets && sessionData.sets.length > 0) {
        const setsToInsert = sessionData.sets.map((set: any) => ({
          session_id: session.id,
          exercise_id: set.exerciseId,
          set_order: set.setOrder,
          reps: set.reps,
          rpe: set.rpe,
          prescribed_weight: set.prescribedWeight,
          instructions: set.instructions || null,
        }));

        const { error: setsError } = await supabase
          .from("v2_sets")
          .insert(setsToInsert);

        if (setsError) {
          console.error("Erreur création sets:", setsError);
        }
      }
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Erreur création programme:", error);
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

    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get("athleteId");
    const coachId = searchParams.get("coachId");

    let query = supabase
      .from("programs")
      .select(`
        *,
        coach:profiles!programs_coach_id_fkey(id, name, email),
        athlete:profiles!programs_athlete_id_fkey(id, name, email),
        sessions(
          *,
          sets(
            *,
            exercise:exercises(*)
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (athleteId) {
      query = query.eq("athlete_id", athleteId);
    }

    if (coachId) {
      query = query.eq("coach_id", coachId);
    }

    const { data: programs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Erreur récupération programmes:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
