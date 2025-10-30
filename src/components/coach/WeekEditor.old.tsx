"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2, Info } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Exercise {
  id: string;
  name: string;
  category: string;
}

interface Set {
  id: string;
  exercise_id: string;
  set_order: number;
  reps: number;
  rpe: number;
  prescribed_weight: number | null;
  instructions: string | null;
  exercise?: Exercise;
}

interface Session {
  id: string;
  day_of_week: number;
  name: string;
  sets: Set[];
}

interface Program {
  id: string;
  week_number: number;
  name: string;
  sessions: Session[];
}

interface WeekEditorProps {
  program: Program;
  previousProgram: Program | null;
  exercises: Exercise[];
  blockId: string;
  blockName: string;
  athleteId: string;
  athleteName: string;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function WeekEditor({ 
  program, 
  previousProgram, 
  exercises, 
  blockId, 
  blockName,
  athleteId,
  athleteName 
}: WeekEditorProps) {
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

  // Fonction pour obtenir les valeurs de la semaine précédente pour un exercice
  const getPreviousSetData = (sessionDayOfWeek: number, exerciseId: string, setOrder: number) => {
    if (!previousProgram) return null;

    const previousSession = previousProgram.sessions.find(s => s.day_of_week === sessionDayOfWeek);
    if (!previousSession) return null;

    const previousSet = previousSession.sets.find(
      s => s.exercise_id === exerciseId && s.set_order === setOrder
    );

    return previousSet || null;
  };

  const handleSetChange = (sessionId: string, setId: string, field: string, value: any) => {
    setEditingSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? {
              ...session,
              sets: session.sets.map(set =>
                set.id === setId ? { ...set, [field]: value } : set
              ),
            }
          : session
      )
    );
  };

  const handleDeleteSet = (sessionId: string, setId: string) => {
    if (!confirm("Supprimer cet exercice ?")) return;

    setEditingSessions(prev =>
      prev.map(session =>
        session.id === sessionId
          ? {
              ...session,
              sets: session.sets.filter(set => set.id !== setId),
            }
          : session
      )
    );
  };

  const handleAddExercise = () => {
    if (!selectedSessionId || !newExercise.exercise_id) {
      alert("Veuillez sélectionner une séance et un exercice");
      return;
    }

    const session = editingSessions.find(s => s.id === selectedSessionId);
    if (!session) return;

    const exercise = exercises.find(e => e.id === newExercise.exercise_id);
    if (!exercise) return;

    const newSet: Set = {
      id: `temp-${Date.now()}`,
      exercise_id: newExercise.exercise_id,
      set_order: session.sets.length + 1,
      reps: newExercise.reps,
      rpe: newExercise.rpe,
      prescribed_weight: newExercise.prescribed_weight ? parseFloat(newExercise.prescribed_weight) : null,
      instructions: newExercise.instructions || null,
      exercise,
    };

    setEditingSessions(prev =>
      prev.map(s =>
        s.id === selectedSessionId
          ? { ...s, sets: [...s.sets, newSet] }
          : s
      )
    );

    setIsAddExerciseDialogOpen(false);
    setNewExercise({
      exercise_id: "",
      reps: 5,
      rpe: 8,
      prescribed_weight: "",
      instructions: "",
    });
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Pour chaque session, mettre à jour ou créer les sets
      for (const session of editingSessions) {
        // Supprimer les sets qui ne sont plus dans la liste
        const currentSetIds = session.sets
          .filter(s => !s.id.startsWith("temp-"))
          .map(s => s.id);

        const { data: existingSets } = await supabase
          .from("v2_sets")
          .select("id")
          .eq("session_id", session.id);

        const setsToDelete = (existingSets || [])
          .filter(s => !currentSetIds.includes(s.id))
          .map(s => s.id);

        if (setsToDelete.length > 0) {
          await supabase
            .from("v2_sets")
            .delete()
            .in("id", setsToDelete);
        }

        // Mettre à jour ou créer les sets
        for (const set of session.sets) {
          if (set.id.startsWith("temp-")) {
            // Créer un nouveau set
            await supabase.from("v2_sets").insert({
              session_id: session.id,
              exercise_id: set.exercise_id,
              set_order: set.set_order,
              reps: set.reps,
              rpe: set.rpe,
              prescribed_weight: set.prescribed_weight,
              instructions: set.instructions,
            });
          } else {
            // Mettre à jour le set existant
            await supabase
              .from("v2_sets")
              .update({
                exercise_id: set.exercise_id,
                set_order: set.set_order,
                reps: set.reps,
                rpe: set.rpe,
                prescribed_weight: set.prescribed_weight,
                instructions: set.instructions,
              })
              .eq("id", set.id);
          }
        }
      }

      alert("Semaine enregistrée avec succès !");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/coach/athletes/${athleteId}/blocks/${blockId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Semaine {program.week_number} - {program.name}
              </h1>
              <p className="text-gray-500">
                {blockName} • {athleteName}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

        {/* Info sur la semaine précédente */}
        {previousProgram && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="flex items-start gap-2 pt-6">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Semaine précédente disponible</p>
                <p className="text-blue-700">
                  Les valeurs de la semaine {program.week_number - 1} sont affichées en gris pour référence
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions par jour */}
        <div className="space-y-6">
          {editingSessions
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {DAYS[session.day_of_week - 1]} - {session.name}
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setIsAddExerciseDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un exercice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {session.sets
                      .sort((a, b) => a.set_order - b.set_order)
                      .map((set, index) => {
                        const previousSet = getPreviousSetData(
                          session.day_of_week,
                          set.exercise_id,
                          set.set_order
                        );

                        return (
                          <div key={set.id} className="grid grid-cols-12 gap-4 items-start p-4 bg-gray-50 rounded-lg">
                            <div className="col-span-1 font-medium text-gray-600">
                              #{set.set_order}
                            </div>
                            
                            <div className="col-span-3">
                              <Label className="text-xs">Exercice</Label>
                              <Select
                                value={set.exercise_id}
                                onValueChange={(value) =>
                                  handleSetChange(session.id, set.id, "exercise_id", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {exercises.map((ex) => (
                                    <SelectItem key={ex.id} value={ex.id}>
                                      {ex.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="col-span-2">
                              <Label className="text-xs">Répétitions</Label>
                              <Input
                                type="number"
                                value={set.reps}
                                onChange={(e) =>
                                  handleSetChange(session.id, set.id, "reps", parseInt(e.target.value))
                                }
                                min="1"
                              />
                              {previousSet && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Précédent: {previousSet.reps}
                                </p>
                              )}
                            </div>

                            <div className="col-span-2">
                              <Label className="text-xs">RPE</Label>
                              <Input
                                type="number"
                                step="0.5"
                                value={set.rpe}
                                onChange={(e) =>
                                  handleSetChange(session.id, set.id, "rpe", parseFloat(e.target.value))
                                }
                                min="0"
                                max="10"
                              />
                              {previousSet && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Précédent: {previousSet.rpe}
                                </p>
                              )}
                            </div>

                            <div className="col-span-2">
                              <Label className="text-xs">Charge (kg ou %)</Label>
                              <Input
                                type="text"
                                value={set.prescribed_weight || ""}
                                onChange={(e) =>
                                  handleSetChange(session.id, set.id, "prescribed_weight", 
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                placeholder="80 ou 75%"
                              />
                              {previousSet && previousSet.prescribed_weight && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Précédent: {previousSet.prescribed_weight}
                                </p>
                              )}
                            </div>

                            <div className="col-span-1 flex items-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSet(session.id, set.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {set.instructions && (
                              <div className="col-span-12 text-sm text-gray-600 italic">
                                📝 {set.instructions}
                              </div>
                            )}
                            {previousSet && previousSet.instructions && previousSet.instructions !== set.instructions && (
                              <div className="col-span-12 text-xs text-gray-400 italic">
                                📝 Précédent: {previousSet.instructions}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Dialog - Ajouter un exercice */}
        <Dialog open={isAddExerciseDialogOpen} onOpenChange={setIsAddExerciseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un exercice</DialogTitle>
              <DialogDescription>
                Ajouter un nouvel exercice à la séance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Exercice *</Label>
                <Select
                  value={newExercise.exercise_id}
                  onValueChange={(value) => setNewExercise({ ...newExercise, exercise_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un exercice" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((ex) => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name} ({ex.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Répétitions</Label>
                  <Input
                    type="number"
                    value={newExercise.reps}
                    onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>RPE</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={newExercise.rpe}
                    onChange={(e) => setNewExercise({ ...newExercise, rpe: parseFloat(e.target.value) })}
                    min="0"
                    max="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Charge</Label>
                  <Input
                    type="text"
                    value={newExercise.prescribed_weight}
                    onChange={(e) => setNewExercise({ ...newExercise, prescribed_weight: e.target.value })}
                    placeholder="80 ou 75%"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instructions (optionnel)</Label>
                <Input
                  value={newExercise.instructions}
                  onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
                  placeholder="Ex: Tempo 3-0-1-0, pause en bas..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddExerciseDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddExercise}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
