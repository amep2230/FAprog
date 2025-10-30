"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, GripVertical, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Exercise {
  id: string;
  name: string;
  category: string;
}

interface SetData {
  id: string;
  set_order: number;
  reps: number;
  rpe: number;
  prescribed_weight: number | null;
  instructions: string | null;
  exercise: Exercise;
}

interface Session {
  id: string;
  day_of_week: number;
  name: string;
  sets: SetData[];
}

interface Program {
  id: string;
  week_number: number;
  name: string;
  sessions: Session[];
}

interface PreviousSetData {
  reps: number;
  rpe: number;
  prescribed_weight: number | null;
}

interface WeekEditorProps {
  blockId: string;
  program: Program;
  previousProgram: Program | null;
  exercises: Exercise[];
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function WeekEditor({ blockId, program, previousProgram, exercises }: WeekEditorProps) {
  const router = useRouter();
  const [editingSessions, setEditingSessions] = useState<Session[]>(program.sessions);
  const [isAddExerciseDialogOpen, setIsAddExerciseDialogOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [newExercise, setNewExercise] = useState({
    exercise_id: "",
    reps: 5,
    rpe: 8,
    prescribed_weight: "",
    instructions: "",
  });

  // Trouver les données précédentes pour un exercice donné
  const getPreviousSetData = (exerciseId: string, sessionDayOfWeek: number): PreviousSetData | null => {
    if (!previousProgram) return null;

    const previousSession = previousProgram.sessions.find(s => s.day_of_week === sessionDayOfWeek);
    if (!previousSession) return null;

    const previousSet = previousSession.sets.find(set => set.exercise.id === exerciseId);
    if (!previousSet) return null;

    return {
      reps: previousSet.reps,
      rpe: previousSet.rpe,
      prescribed_weight: previousSet.prescribed_weight,
    };
  };

  const handleUpdateSet = async (setId: string, field: string, value: any) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("v2_sets")
        .update({ [field]: value === "" ? null : value })
        .eq("id", setId);

      if (error) throw error;

      // Mettre à jour l'état local
      setEditingSessions(sessions =>
        sessions.map(session => ({
          ...session,
          sets: session.sets.map(set =>
            set.id === setId ? { ...set, [field]: value === "" ? null : value } : set
          ),
        }))
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet exercice ?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("v2_sets").delete().eq("id", setId);

      if (error) throw error;

      setEditingSessions(sessions =>
        sessions.map(session => ({
          ...session,
          sets: session.sets.filter(set => set.id !== setId),
        }))
      );

      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleAddExercise = async () => {
    if (!selectedSessionId || !newExercise.exercise_id) {
      alert("Veuillez sélectionner une session et un exercice");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const session = editingSessions.find(s => s.id === selectedSessionId);
      if (!session) throw new Error("Session introuvable");

      const maxOrder = Math.max(...session.sets.map(s => s.set_order), 0);

      const { error } = await supabase.from("v2_sets").insert({
        session_id: selectedSessionId,
        exercise_id: newExercise.exercise_id,
        set_order: maxOrder + 1,
        reps: newExercise.reps,
        rpe: newExercise.rpe,
        prescribed_weight: newExercise.prescribed_weight || null,
        instructions: newExercise.instructions || null,
      });

      if (error) throw error;

      setIsAddExerciseDialogOpen(false);
      setNewExercise({
        exercise_id: "",
        reps: 5,
        rpe: 8,
        prescribed_weight: "",
        instructions: "",
      });
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'exercice:", error);
      alert("Erreur lors de l'ajout de l'exercice");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddExerciseDialog = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsAddExerciseDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/athlete/blocks/${blockId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            Semaine {program.week_number} - {program.name}
          </h1>
          <p className="text-muted-foreground">
            Modifiez les exercices, charges et RPE pour cette semaine
          </p>
        </div>
      </div>

      {/* Info sur les données précédentes */}
      {previousProgram && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">
                  Données de la semaine précédente disponibles
                </p>
                <p className="text-sm text-blue-700">
                  Les charges et RPE de la Semaine {previousProgram.week_number} sont affichés
                  en gris pour vous aider à adapter cette semaine.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions */}
      <div className="space-y-6">
        {editingSessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {DAYS[session.day_of_week - 1]} - {session.name}
                  </CardTitle>
                  <CardDescription>{session.sets.length} exercice(s)</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddExerciseDialog(session.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter exercice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {session.sets.map((set, index) => {
                  const previousData = getPreviousSetData(set.exercise.id, session.day_of_week);

                  return (
                    <div
                      key={set.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg"
                    >
                      {/* Exercice */}
                      <div className="md:col-span-4">
                        <Label className="text-xs text-muted-foreground">Exercice</Label>
                        <p className="font-medium">{set.exercise.name}</p>
                        <p className="text-xs text-muted-foreground">{set.exercise.category}</p>
                      </div>

                      {/* Répétitions */}
                      <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Répétitions</Label>
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(set.id, "reps", parseInt(e.target.value))}
                          className="h-9"
                        />
                        {previousData && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Précédent: {previousData.reps}
                          </p>
                        )}
                      </div>

                      {/* RPE */}
                      <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground">RPE</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="10"
                          value={set.rpe}
                          onChange={(e) => handleUpdateSet(set.id, "rpe", parseFloat(e.target.value))}
                          className="h-9"
                        />
                        {previousData && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Précédent: @{previousData.rpe}
                          </p>
                        )}
                      </div>

                      {/* Charge */}
                      <div className="md:col-span-3">
                        <Label className="text-xs text-muted-foreground">Charge (kg)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={set.prescribed_weight || ""}
                          onChange={(e) => handleUpdateSet(set.id, "prescribed_weight", e.target.value)}
                          placeholder="Optionnel"
                          className="h-9"
                        />
                        {previousData && previousData.prescribed_weight && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Précédent: {previousData.prescribed_weight}kg
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-1 flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSet(set.id)}
                          className="h-9 w-9 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Instructions (pleine largeur) */}
                      {set.instructions && (
                        <div className="md:col-span-12">
                          <Label className="text-xs text-muted-foreground">Instructions</Label>
                          <p className="text-sm mt-1">{set.instructions}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {session.sets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun exercice dans cette séance
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog pour ajouter un exercice */}
      <Dialog open={isAddExerciseDialogOpen} onOpenChange={setIsAddExerciseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un exercice</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel exercice à cette séance
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Exercice *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={newExercise.exercise_id}
                onChange={(e) => setNewExercise({ ...newExercise, exercise_id: e.target.value })}
              >
                <option value="">Sélectionner un exercice...</option>
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name} ({exercise.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Répétitions</Label>
                <Input
                  type="number"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>RPE</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={newExercise.rpe}
                  onChange={(e) => setNewExercise({ ...newExercise, rpe: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Charge (kg) - Optionnel</Label>
              <Input
                type="number"
                step="0.5"
                value={newExercise.prescribed_weight}
                onChange={(e) => setNewExercise({ ...newExercise, prescribed_weight: e.target.value })}
                placeholder="Laisser vide si non spécifié"
              />
            </div>

            <div className="grid gap-2">
              <Label>Instructions - Optionnel</Label>
              <Input
                value={newExercise.instructions}
                onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
                placeholder="Tempo, pause, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddExerciseDialogOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button onClick={handleAddExercise} disabled={isLoading || !newExercise.exercise_id}>
              {isLoading ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
