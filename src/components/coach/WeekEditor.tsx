"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, ArrowLeft, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Set {
  id?: string;
  exercise_name: string;
  exercise_type: string;
  set_number: number;
  prescribed_reps: number | null;
  prescribed_weight: number | null;
  prescribed_rpe: number | null;
  notes: string | null;
}

interface Session {
  id?: string;
  session_number: number;
  name: string;
  notes: string | null;
  sets: Set[];
}

interface Week {
  id: string;
  week_number: number;
  name: string;
  notes: string | null;
  block?: {
    id: string;
    name: string;
    athlete_id: string;
  };
  sessions: Session[];
}

interface WeekEditorProps {
  week: Week;
  athleteId: string;
  blockId: string;
}

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  category: string;
}

export default function WeekEditor({ week: initialWeek, athleteId, blockId }: WeekEditorProps) {
  const router = useRouter();
  const [week, setWeek] = useState<Week>(initialWeek);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);
  const [isAddExerciseDialogOpen, setIsAddExerciseDialogOpen] = useState(false);
  const [selectedSessionForExercise, setSelectedSessionForExercise] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("");

  // Charger les exercices
  useEffect(() => {
    const loadExercises = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exercises")
        .select("id, name, muscle_group, category")
        .order("name");

      if (error) {
        console.error("Erreur lors du chargement des exercices:", error);
        return;
      }

      setExercises(data || []);
    };

    loadExercises();
  }, []);

  // Trier les séances par numéro
  const sortedSessions = [...week.sessions].sort((a, b) => a.session_number - b.session_number);

  const handleAddSession = async () => {
    if (!newSessionName.trim()) return;

    const supabase = createClient();
    const newSessionNumber = Math.max(...week.sessions.map(s => s.session_number), 0) + 1;

    const { data: newSession, error } = await supabase
      .from("sessions")
      .insert({
        week_id: week.id,
        session_number: newSessionNumber,
        name: newSessionName,
        notes: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de la séance:", error);
      alert("Erreur lors de la création de la séance");
      return;
    }

    setWeek({
      ...week,
      sessions: [...week.sessions, { ...newSession, sets: [] }],
    });

    setNewSessionName("");
    setIsAddSessionDialogOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette séance ?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("sessions").delete().eq("id", sessionId);

    if (error) {
      console.error("Erreur lors de la suppression de la séance:", error);
      alert("Erreur lors de la suppression de la séance");
      return;
    }

    setWeek({
      ...week,
      sessions: week.sessions.filter(s => s.id !== sessionId),
    });
  };

  const handleAddExercise = async (sessionId: string) => {
    setSelectedSessionForExercise(sessionId);
    setIsAddExerciseDialogOpen(true);
  };

  const handleConfirmAddExercise = async () => {
    if (!selectedSessionForExercise || !selectedExerciseId) return;

    const supabase = createClient();
    const session = week.sessions.find(s => s.id === selectedSessionForExercise);
    if (!session) return;

    const selectedExercise = exercises.find(e => e.id === selectedExerciseId);
    if (!selectedExercise) return;

    const newSetNumber = Math.max(...session.sets.map(s => s.set_number), 0) + 1;

    const { data: newSet, error } = await supabase
      .from("sets")
      .insert({
        session_id: selectedSessionForExercise,
        exercise_name: selectedExercise.name,
        exercise_type: "main",
        set_number: newSetNumber,
        prescribed_reps: null,
        prescribed_weight: null,
        prescribed_rpe: null,
        notes: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'ajout de l'exercice:", error);
      alert("Erreur lors de l'ajout de l'exercice");
      return;
    }

    setWeek({
      ...week,
      sessions: week.sessions.map(s =>
        s.id === selectedSessionForExercise
          ? { ...s, sets: [...s.sets, newSet] }
          : s
      ),
    });

    setIsAddExerciseDialogOpen(false);
    setSelectedSessionForExercise(null);
    setSelectedExerciseId("");
    setExerciseSearchTerm("");
  };

  const handleUpdateSet = async (sessionId: string, setId: string, field: keyof Set, value: any) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("sets")
      .update({ [field]: value })
      .eq("id", setId);

    if (error) {
      console.error("Erreur lors de la mise à jour:", error);
      return;
    }

    setWeek({
      ...week,
      sessions: week.sessions.map(s =>
        s.id === sessionId
          ? {
              ...s,
              sets: s.sets.map(set =>
                set.id === setId ? { ...set, [field]: value } : set
              ),
            }
          : s
      ),
    });
  };

  const handleDeleteSet = async (sessionId: string, setId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet exercice ?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("sets").delete().eq("id", setId);

    if (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression");
      return;
    }

    setWeek({
      ...week,
      sessions: week.sessions.map(s =>
        s.id === sessionId
          ? { ...s, sets: s.sets.filter(set => set.id !== setId) }
          : s
      ),
    });
  };

  const handleUpdateWeekInfo = async () => {
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("training_weeks")
      .update({
        name: week.name,
        notes: week.notes,
      })
      .eq("id", week.id);

    if (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour");
    }

    setIsSaving(false);
  };

  const handleBack = () => {
    router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${blockId}`);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" onClick={handleBack} className="mb-2 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au bloc
          </Button>
          <div className="space-y-2">
            <Input
              value={week.name}
              onChange={(e) => setWeek({ ...week, name: e.target.value })}
              onBlur={handleUpdateWeekInfo}
              className="text-2xl font-bold h-auto py-2"
            />
            <Textarea
              value={week.notes || ""}
              onChange={(e) => setWeek({ ...week, notes: e.target.value })}
              onBlur={handleUpdateWeekInfo}
              placeholder="Notes sur la semaine..."
              className="resize-none"
              rows={2}
            />
          </div>
        </div>
        <Button onClick={handleUpdateWeekInfo} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {/* Séances */}
      <div className="space-y-4">
        {sortedSessions.map((session) => (
          <Card key={session.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Séance {session.session_number}
                  </span>
                  <span>{session.name}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddExercise(session.id!)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Exercice
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {session.sets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun exercice. Cliquez sur &quot;Exercice&quot; pour en ajouter.
                </div>
              ) : (
                <div className="space-y-4">
                  {session.sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((set, index, arr) => {
                      // Grouper les séries par exercice
                      const isFirstSetOfExercise =
                        index === 0 || arr[index - 1].exercise_name !== set.exercise_name;
                      const isLastSetOfExercise =
                        index === arr.length - 1 || arr[index + 1].exercise_name !== set.exercise_name;

                      return (
                        <div
                          key={set.id}
                          className={`${
                            isFirstSetOfExercise ? "pt-4 border-t" : ""
                          }`}
                        >
                          {isFirstSetOfExercise && (
                            <div className="flex items-center justify-between mb-2">
                              <Input
                                value={set.exercise_name}
                                onChange={(e) =>
                                  handleUpdateSet(session.id!, set.id!, "exercise_name", e.target.value)
                                }
                                className="font-medium"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSet(session.id!, set.id!)}
                                className="ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="grid grid-cols-6 gap-2 items-center pl-4">
                            <div className="text-sm text-muted-foreground">
                              Série {set.set_number}
                            </div>
                            <div>
                              <Input
                                type="number"
                                placeholder="Reps"
                                value={set.prescribed_reps || ""}
                                onChange={(e) =>
                                  handleUpdateSet(
                                    session.id!,
                                    set.id!,
                                    "prescribed_reps",
                                    e.target.value ? parseInt(e.target.value) : null
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                placeholder="Poids (kg)"
                                value={set.prescribed_weight || ""}
                                onChange={(e) =>
                                  handleUpdateSet(
                                    session.id!,
                                    set.id!,
                                    "prescribed_weight",
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                placeholder="RPE"
                                min="0"
                                max="10"
                                step="0.5"
                                value={set.prescribed_rpe || ""}
                                onChange={(e) =>
                                  handleUpdateSet(
                                    session.id!,
                                    set.id!,
                                    "prescribed_rpe",
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                placeholder="Notes..."
                                value={set.notes || ""}
                                onChange={(e) =>
                                  handleUpdateSet(session.id!, set.id!, "notes", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bouton ajouter séance */}
      <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une séance
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle séance</DialogTitle>
            <DialogDescription>
              Créer une nouvelle séance dans cette semaine
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Nom de la séance</Label>
              <Input
                id="session-name"
                placeholder="Ex: Squat + Accessoires"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddSession();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSessionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddSession}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour ajouter un exercice */}
      <Dialog open={isAddExerciseDialogOpen} onOpenChange={setIsAddExerciseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un exercice</DialogTitle>
            <DialogDescription>
              Recherchez et sélectionnez un exercice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Barre de recherche */}
            <div className="space-y-2">
              <Label htmlFor="exercise-search">Rechercher</Label>
              <Input
                id="exercise-search"
                placeholder="Tapez le nom de l'exercice ou du muscle..."
                value={exerciseSearchTerm}
                onChange={(e) => {
                  setExerciseSearchTerm(e.target.value);
                  setSelectedMuscleGroup(""); // Reset muscle group when searching
                }}
                autoFocus
              />
            </div>

            {/* Filtre par groupe musculaire */}
            <div className="space-y-2">
              <Label htmlFor="muscle-select">Filtrer par groupe musculaire (optionnel)</Label>
              <Select value={selectedMuscleGroup || "ALL"} onValueChange={(value) => setSelectedMuscleGroup(value === "ALL" ? "" : value)}>
                <SelectTrigger id="muscle-select">
                  <SelectValue placeholder="Tous les muscles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les muscles</SelectItem>
                  {Array.from(new Set(exercises.map(ex => ex.muscle_group)))
                    .sort()
                    .map((muscleGroup) => (
                      <SelectItem key={muscleGroup} value={muscleGroup}>
                        {muscleGroup}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Liste des exercices filtrés */}
            <div className="space-y-2">
              <Label>Exercices ({exercises.filter(ex => 
                (selectedMuscleGroup === "" || ex.muscle_group === selectedMuscleGroup) &&
                (exerciseSearchTerm === "" || 
                 ex.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                 ex.muscle_group.toLowerCase().includes(exerciseSearchTerm.toLowerCase()))
              ).length} résultats)</Label>
              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                {exercises
                  .filter(ex => 
                    (selectedMuscleGroup === "" || ex.muscle_group === selectedMuscleGroup) &&
                    (exerciseSearchTerm === "" || 
                     ex.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                     ex.muscle_group.toLowerCase().includes(exerciseSearchTerm.toLowerCase()))
                  )
                  .map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => setSelectedExerciseId(exercise.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0 ${
                        selectedExerciseId === exercise.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-sm text-gray-500">{exercise.muscle_group}</div>
                    </button>
                  ))}
                {exercises.filter(ex => 
                  (selectedMuscleGroup === "" || ex.muscle_group === selectedMuscleGroup) &&
                  (exerciseSearchTerm === "" || 
                   ex.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase()) ||
                   ex.muscle_group.toLowerCase().includes(exerciseSearchTerm.toLowerCase()))
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun exercice trouvé
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddExerciseDialogOpen(false);
                setSelectedExerciseId("");
                setExerciseSearchTerm("");
                setSelectedMuscleGroup("");
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirmAddExercise} disabled={!selectedExerciseId}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sortedSessions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              Aucune séance dans cette semaine
            </p>
            <Button onClick={() => setIsAddSessionDialogOpen(true)}>
              Créer la première séance
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
