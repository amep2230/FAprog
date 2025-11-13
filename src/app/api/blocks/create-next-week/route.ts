import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { blockId } = await request.json();

    if (!blockId) {
      return NextResponse.json(
        { error: "Block ID is required" },
        { status: 400 }
      );
    }

    // Vérifier que le bloc est de type "force"
    const { data: block, error: blockError } = await supabase
      .from("training_blocks")
      .select("block_type, name")
      .eq("id", blockId)
      .single();

    if (blockError || !block) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    if (block.block_type !== "force") {
      return NextResponse.json(
        { error: "Cette fonction ne fonctionne que pour les blocs de force" },
        { status: 400 }
      );
    }

    // Récupérer le dernier numéro de semaine
    const { data: weeks, error: weeksError } = await supabase
      .from("training_weeks")
      .select("week_number")
      .eq("block_id", blockId)
      .order("week_number", { ascending: false })
      .limit(1);

    if (weeksError) {
      return NextResponse.json(
        { error: "Error fetching weeks" },
        { status: 500 }
      );
    }

    if (!weeks || weeks.length === 0) {
      return NextResponse.json(
        { error: "Aucune semaine trouvée. Créez d'abord la semaine 1." },
        { status: 400 }
      );
    }

    const lastWeekNumber = weeks[0].week_number;
    const nextWeekNumber = lastWeekNumber + 1;

    // Appeler la fonction PostgreSQL
    const { data, error } = await supabase.rpc("create_week_from_week_one", {
      p_block_id: blockId,
      p_week_number: nextWeekNumber,
      p_week_name: `Semaine ${nextWeekNumber}`,
    });

    if (error) {
      console.error("Error calling create_week_from_week_one:", error);
      return NextResponse.json(
        { error: error.message || "Error creating week" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      weekId: data,
      weekNumber: nextWeekNumber,
      message: `Semaine ${nextWeekNumber} créée avec succès !`,
    });
  } catch (error: any) {
    console.error("Error in create-next-week API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
