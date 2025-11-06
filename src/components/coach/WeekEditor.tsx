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
    block_type?: "force" | "general";
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
  const [isDeleteWeekDialogOpen, setIsDeleteWeekDialogOpen] = useState(false);
  const [selectedSessionForExercise, setSelectedSessionForExercise] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("");
  const [previousWeekData, setPreviousWeekData] = useState<Week | null>(null);

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

  // Charger la semaine précédente (N-1)
  useEffect(() => {
    const loadPreviousWeek = async () => {
      if (!blockId || week.week_number <= 1) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("training_weeks")
        .select(`
          *,
          sessions (
            id,
            session_number,
            name,
            sets (
              id,
              exercise_name,
              set_number,
              prescribed_weight,
              prescribed_rpe
            )
          )
        `)
        .eq("block_id", blockId)
        .eq("week_number", week.week_number - 1)
        .single();

      if (!error && data) {
        setPreviousWeekData(data);
      }
    };

    loadPreviousWeek();
  }, [blockId, week.week_number]);

  // Trier les séances par numéro
  const sortedSessions = [...week.sessions].sort((a, b) => a.session_number - b.session_number);

  // Fonction pour trouver les données de la semaine précédente pour un exercice
  const getPreviousWeekData = (sessionNumber: number, exerciseName: string, setNumber: number) => {
    if (!previousWeekData) return null;

    const prevSession = previousWeekData.sessions?.find(s => s.session_number === sessionNumber);
    if (!prevSession) return null;

    const prevSet = prevSession.sets?.find(
      s => s.exercise_name === exerciseName && s.set_number === setNumber
    );
    
    return prevSet;
  };

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

  const handleDeleteWeek = async () => {
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("training_weeks")
      .delete()
      .eq("id", week.id);

    if (error) {
      console.error("Erreur lors de la suppression de la semaine:", error);
      alert("Erreur lors de la suppression de la semaine");
      setIsSaving(false);
      return;
    }

    setIsDeleteWeekDialogOpen(false);
    router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${blockId}`);
    router.refresh();
  };

  const handleBack = () => {
    router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${blockId}`);
  };

  // Déterminer le type de bloc
  const blockType = week.block?.block_type || "force";
  const isGeneralBlock = blockType === "general";

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* En-tête avec badge et breadcrumb */}
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBack} className="-ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au bloc
        </Button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                Semaine {week.week_number}
              </span>
              {week.block && (
                <span className="text-sm text-muted-foreground">
                  · {week.block.name}
                </span>
              )}
            </div>
            <Input
              value={week.name}
              onChange={(e) => setWeek({ ...week, name: e.target.value })}
              onBlur={handleUpdateWeekInfo}
              className="text-3xl font-bold h-auto py-3 border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Nom de la semaine"
            />
            <Textarea
              value={week.notes || ""}
              onChange={(e) => setWeek({ ...week, notes: e.target.value })}
              onBlur={handleUpdateWeekInfo}
              placeholder="Notes sur la semaine... (optionnel)"
              className="resize-none border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpdateWeekInfo} disabled={isSaving} size="lg">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteWeekDialogOpen(true)} 
              size="lg"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Séances */}
      <div className="space-y-6">
        {sortedSessions.map((session) => (
          <Card key={session.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    {session.session_number}
                  </div>
                  <span className="text-xl">{session.name}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddExercise(session.id!)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un exercice
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {session.sets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">Aucun exercice</p>
                  <p className="text-sm text-gray-400">
                    Cliquez sur &quot;Ajouter un exercice&quot; pour commencer
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
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
                            isFirstSetOfExercise ? "pt-4 first:pt-0" : ""
                          }`}
                        >
                          {isFirstSetOfExercise && (
                            <div className="flex items-center justify-between mb-3 pb-3 border-b">
                              <Input
                                value={set.exercise_name}
                                onChange={(e) =>
                                  handleUpdateSet(session.id!, set.id!, "exercise_name", e.target.value)
                                }
                                className="font-semibold text-lg border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 mr-2"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSet(session.id!, set.id!)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="grid grid-cols-12 gap-3 items-center pl-6 py-2 hover:bg-gray-50 rounded-md -ml-2 pl-8">
                            <div className="col-span-2 text-sm font-medium text-gray-600">
                              Série {set.set_number}
                            </div>
                            <div className="col-span-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Reps</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={set.prescribed_reps || ""}
                                  onChange={(e) =>
                                    handleUpdateSet(
                                      session.id!,
                                      set.id!,
                                      "prescribed_reps",
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                  className="h-9"
                                />
                              </div>
                            </div>

                            <div className="col-span-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Poids (kg)</Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={set.prescribed_weight || ""}
                                    onChange={(e) =>
                                      handleUpdateSet(
                                        session.id!,
                                        set.id!,
                                        "prescribed_weight",
                                        e.target.value ? parseFloat(e.target.value) : null
                                      )
                                    }
                                    className="h-9"
                                  />
                                  {(() => {
                                    const prevData = getPreviousWeekData(session.session_number, set.exercise_name, set.set_number);
                                    if (!prevData?.prescribed_weight) return null;
                                    
                                    const isSameAsPrev = set.prescribed_weight === prevData.prescribed_weight;
                                    return (
                                      <span className={`absolute -bottom-5 left-0 text-xs whitespace-nowrap ${
                                        isSameAsPrev ? 'text-green-600' : 'text-blue-600'
                                      }`}>
                                        {isSameAsPrev ? '✓ ' : ''}S{week.week_number - 1}: {prevData.prescribed_weight}kg
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {!isGeneralBlock && (
                              <div className="col-span-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-500">RPE</Label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder="0"
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
                                      className="h-9"
                                    />
                                    {(() => {
                                      const prevData = getPreviousWeekData(session.session_number, set.exercise_name, set.set_number);
                                      if (!prevData?.prescribed_rpe) return null;
                                      
                                      const isSameAsPrev = set.prescribed_rpe === prevData.prescribed_rpe;
                                      return (
                                        <span className={`absolute -bottom-5 left-0 text-xs whitespace-nowrap ${
                                          isSameAsPrev ? 'text-green-600' : 'text-blue-600'
                                        }`}>
                                          {isSameAsPrev ? '✓ ' : ''}S{week.week_number - 1}: {prevData.prescribed_rpe}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className={isGeneralBlock ? "col-span-6" : "col-span-4"}>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Notes</Label>
                                <Input
                                  placeholder="Notes..."
                                  value={set.notes || ""}
                                  onChange={(e) =>
                                    handleUpdateSet(session.id!, set.id!, "notes", e.target.value)
                                  }
                                  className="h-9"
                                />
                              </div>
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
          <Button variant="outline" className="w-full h-16 border-2 border-dashed hover:border-solid hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all">
            <Plus className="mr-2 h-5 w-5" />
            <span className="font-medium">Ajouter une séance</span>
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

      {/* Dialog - Supprimer la semaine */}
      <Dialog open={isDeleteWeekDialogOpen} onOpenChange={setIsDeleteWeekDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la semaine ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les séances et exercices de cette semaine seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
            <p className="text-sm text-red-900">
              <strong>⚠️ Attention :</strong> Vous êtes sur le point de supprimer la semaine <strong>&quot;{week.name}&quot;</strong> (Semaine {week.week_number}) qui contient <strong>{week.sessions?.length || 0} séance(s)</strong>.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteWeekDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteWeek}
              disabled={isSaving}
            >
              {isSaving ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sortedSessions.length === 0 && (
        <Card className="border-2 border-dashed bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune séance dans cette semaine
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Commencez par créer votre première séance d&apos;entraînement pour cette semaine
            </p>
            <Button onClick={() => setIsAddSessionDialogOpen(true)} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Créer la première séance
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
