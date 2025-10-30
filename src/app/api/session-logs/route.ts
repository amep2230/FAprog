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
    const {
      athleteId,
      sessionId,
      bodyWeight,
      sleep,
      nutrition,
      motivation,
      stress,
      setLogs,
    } = body;

    // Vérifier que c'est bien l'athlète qui log
    if (athleteId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Créer le log de séance
    const { data: sessionLog, error: sessionLogError } = await supabase
      .from("session_logs")
      .insert({
        athlete_id: athleteId,
        session_id: sessionId,
        date: new Date().toISOString().split("T")[0],
        weight: bodyWeight,
        sleep,
        nutrition,
        motivation,
        stress,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionLogError) {
      console.error("Error creating session log:", sessionLogError);
      return NextResponse.json(
        { error: "Erreur lors de la création du log de séance" },
        { status: 400 }
      );
    }

    // Créer les logs de sets
    const setLogsToInsert = setLogs
      .filter((log: any) => log.completed)
      .map((log: any) => ({
        session_log_id: sessionLog.id,
        set_id: log.setId,
        completed: log.completed,
        actual_weight: log.actualWeight,
        actual_reps: log.actualReps,
        actual_rpe: log.actualRpe,
      }));

    if (setLogsToInsert.length > 0) {
      const { data: insertedSetLogs, error: setLogsError } = await supabase
        .from("set_logs")
        .insert(setLogsToInsert)
        .select();

      if (setLogsError) {
        console.error("Error creating set logs:", setLogsError);
        // Supprimer le session_log si les set_logs n'ont pas pu être créés
        await supabase.from("session_logs").delete().eq("id", sessionLog.id);
        return NextResponse.json(
          { error: "Erreur lors de la création des logs de sets" },
          { status: 400 }
        );
      }

      // Récupérer les PRs créés automatiquement pour cette séance
      // (le trigger auto_create_pr_from_set_log s'est exécuté)
      const { data: newPRs } = await supabase
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
        .eq("date", new Date().toISOString().split("T")[0])
        .eq("notes", "Auto-détecté lors de la séance");

      // Retourner le sessionLog avec les PRs détectés
      return NextResponse.json({
        sessionLog,
        newPRs: newPRs || [],
      });
    }

    return NextResponse.json({ sessionLog, newPRs: [] });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
