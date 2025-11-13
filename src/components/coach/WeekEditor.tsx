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
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Pencil, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Set {
  id?: string;
  exercise_name: string;
  exercise_type: string;
  set_number: number;
  prescribed_reps: number | null;
  prescribed_weight: number | null;
  prescribed_rpe: number | null;
  actual_rpe: number | null;
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
  const [personalRecords, setPersonalRecords] = useState<Map<string, number>>(new Map());
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState("");

  // Charger les PR de l'athlète
  useEffect(() => {
    const loadPersonalRecords = async () => {
      if (!athleteId) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("personal_records")
        .select(`
          *,
          exercise:exercises (
            id,
            name
          )
        `)
        .eq("athlete_id", athleteId);

      if (error) {
        console.error("Erreur lors du chargement des PR:", error);
        return;
      }

      // Créer une map: nom_exercice -> estimated_1rm
      const prMap = new Map<string, number>();
      data?.forEach(pr => {
        if (pr.exercise?.name && pr.estimated_1rm) {
          // Garder le meilleur 1RM par exercice
          const current = prMap.get(pr.exercise.name) || 0;
          if (pr.estimated_1rm > current) {
            prMap.set(pr.exercise.name, pr.estimated_1rm);
          }
        }
      });

      setPersonalRecords(prMap);
    };

    loadPersonalRecords();
  }, [athleteId]);

  // Fonction pour calculer le poids basé sur RPE, reps et 1RM
  const calculateWeightFromRPE = async (
    exerciseName: string,
    reps: number | null,
    rpe: number | null
  ): Promise<number | null> => {
    if (!reps || !rpe) return null;

    // Récupérer le % du 1RM depuis la table RPE
    const supabase = createClient();
    const { data: rpeData } = await supabase
      .from("rpe_table")
      .select("percentage_of_1rm")
      .eq("reps", reps)
      .eq("rpe", rpe)
      .single();

    if (!rpeData || !rpeData.percentage_of_1rm) return null;

    // Récupérer le 1RM de l'athlète pour cet exercice
    const oneRM = personalRecords.get(exerciseName);
    if (!oneRM) return null;

    // Calculer le poids et arrondir à 2.5kg près
    const weight = (oneRM * rpeData.percentage_of_1rm) / 100;
    const rounded = Math.round(weight / 2.5) * 2.5;
    
    return rounded;
  };

  // Fonction pour calculer le RPE basé sur le poids, reps et 1RM
  const calculateRPEFromWeight = async (
    exerciseName: string,
    reps: number | null,
    weight: number | null
  ): Promise<number | null> => {
    if (!reps || !weight) return null;

    // Récupérer le 1RM de l'athlète
    const oneRM = personalRecords.get(exerciseName);
    if (!oneRM) return null;

    // Calculer le % du 1RM que représente ce poids
    const percentage = (weight / oneRM) * 100;

    // Trouver le RPE le plus proche dans la table RPE pour ces reps
    const supabase = createClient();
    const { data: rpeOptions } = await supabase
      .from("rpe_table")
      .select("rpe, percentage_of_1rm")
      .eq("reps", reps)
      .order("percentage_of_1rm", { ascending: true });

    if (!rpeOptions || rpeOptions.length === 0) return null;

    // Trouver le RPE avec le % le plus proche
    let closestRPE = rpeOptions[0].rpe;
    let minDiff = Math.abs(rpeOptions[0].percentage_of_1rm - percentage);

    for (const option of rpeOptions) {
      const diff = Math.abs(option.percentage_of_1rm - percentage);
      if (diff < minDiff) {
        minDiff = diff;
        closestRPE = option.rpe;
      }
    }

    return closestRPE;
  };

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

  const handleUpdateSessionName = async (sessionId: string, newName: string) => {
    if (!newName.trim()) {
      alert("Le nom de la séance ne peut pas être vide");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("sessions")
      .update({ name: newName })
      .eq("id", sessionId);

    if (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert("Erreur lors de la mise à jour du nom de la séance");
      return;
    }

    // Mettre à jour l'état local
    setWeek({
      ...week,
      sessions: week.sessions.map(s =>
        s.id === sessionId ? { ...s, name: newName } : s
      ),
    });

    // Fermer l'édition
    setEditingSessionId(null);
    setEditingSessionName("");
  };

  const handleAddExercise = async (sessionId: string) => {
    setSelectedSessionForExercise(sessionId);
    setIsAddExerciseDialogOpen(true);
  };

  const handleAddSeries = async (sessionId: string, exerciseName: string) => {
    const supabase = createClient();
    const session = week.sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Trouver toutes les séries de cet exercice
    const exerciseSets = session.sets.filter(s => s.exercise_name === exerciseName);
    if (exerciseSets.length === 0) return;

    // Prendre la dernière série comme modèle
    const lastSet = exerciseSets[exerciseSets.length - 1];
    const newSetNumber = Math.max(...session.sets.map(s => s.set_number), 0) + 1;

    // Créer une nouvelle série avec les mêmes valeurs
    const { data: newSet, error } = await supabase
      .from("sets")
      .insert({
        session_id: sessionId,
        exercise_name: exerciseName,
        exercise_type: lastSet.exercise_type || "main",
        set_number: newSetNumber,
        prescribed_reps: lastSet.prescribed_reps,
        prescribed_weight: lastSet.prescribed_weight,
        prescribed_rpe: lastSet.prescribed_rpe,
        actual_rpe: lastSet.actual_rpe,
        notes: lastSet.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'ajout de la série:", error);
      alert("Erreur lors de l'ajout de la série");
      return;
    }

    // Mettre à jour l'état local
    setWeek({
      ...week,
      sessions: week.sessions.map(s =>
        s.id === sessionId
          ? { ...s, sets: [...s.sets, newSet] }
          : s
      ),
    });
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
        actual_rpe: null,  // Sera mis à jour quand prescribed_rpe sera rempli
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

    // Récupérer le set actuel pour avoir toutes les infos
    const session = week.sessions.find(s => s.id === sessionId);
    const currentSet = session?.sets.find(s => s.id === setId);
    if (!currentSet) return;

    // Créer une copie mise à jour du set
    const updatedSet = { ...currentSet, [field]: value };

    // Si c'est un bloc de force, calculer automatiquement
    const isForceBlock = week.block?.block_type === "force";
    
    if (isForceBlock) {
      // Si on modifie le RPE prescrit, calculer automatiquement le poids ET mettre à jour le RPE réel
      if (field === "prescribed_rpe" && value !== null) {
        const calculatedWeight = await calculateWeightFromRPE(
          currentSet.exercise_name,
          updatedSet.prescribed_reps,
          value
        );
        if (calculatedWeight !== null) {
          updatedSet.prescribed_weight = calculatedWeight;
        }
        
        // Si le RPE réel n'a jamais été modifié (null ou égal à l'ancien RPE prescrit),
        // le mettre à jour avec le nouveau RPE prescrit
        if (currentSet.actual_rpe === null || currentSet.actual_rpe === currentSet.prescribed_rpe) {
          updatedSet.actual_rpe = value;
        }
      }
      
      // Si on modifie le poids, calculer automatiquement le RPE prescrit ET mettre à jour le RPE réel
      if (field === "prescribed_weight" && value !== null) {
        const calculatedRPE = await calculateRPEFromWeight(
          currentSet.exercise_name,
          updatedSet.prescribed_reps,
          value
        );
        if (calculatedRPE !== null) {
          updatedSet.prescribed_rpe = calculatedRPE;
          
          // Si le RPE réel n'a jamais été modifié, le mettre à jour aussi
          if (currentSet.actual_rpe === null || currentSet.actual_rpe === currentSet.prescribed_rpe) {
            updatedSet.actual_rpe = calculatedRPE;
          }
        }
      }

      // Si on modifie les reps, recalculer le poids basé sur le RPE actuel
      if (field === "prescribed_reps" && value !== null && updatedSet.prescribed_rpe !== null) {
        const calculatedWeight = await calculateWeightFromRPE(
          currentSet.exercise_name,
          value,
          updatedSet.prescribed_rpe
        );
        if (calculatedWeight !== null) {
          updatedSet.prescribed_weight = calculatedWeight;
        }
        
        // Le RPE réel reste synchronisé si non modifié manuellement
        if (currentSet.actual_rpe === null || currentSet.actual_rpe === currentSet.prescribed_rpe) {
          updatedSet.actual_rpe = updatedSet.prescribed_rpe;
        }
      }
    }

    // MISE À JOUR IMMÉDIATE DE L'ÉTAT LOCAL avec toutes les valeurs calculées
    setWeek({
      ...week,
      sessions: week.sessions.map(s =>
        s.id === sessionId
          ? {
              ...s,
              sets: s.sets.map(set =>
                set.id === setId ? updatedSet : set
              ),
            }
          : s
      ),
    });

    // Puis synchroniser TOUTES les modifications avec la DB en arrière-plan
    const updateData: any = { [field]: value };
    
    if (isForceBlock) {
      if (field === "prescribed_rpe" && updatedSet.prescribed_weight !== currentSet.prescribed_weight) {
        updateData.prescribed_weight = updatedSet.prescribed_weight;
      }
      if ((field === "prescribed_rpe" || field === "prescribed_weight" || field === "prescribed_reps") && 
          updatedSet.actual_rpe !== currentSet.actual_rpe) {
        updateData.actual_rpe = updatedSet.actual_rpe;
      }
      if (field === "prescribed_weight" && updatedSet.prescribed_rpe !== currentSet.prescribed_rpe) {
        updateData.prescribed_rpe = updatedSet.prescribed_rpe;
      }
      if (field === "prescribed_reps" && updatedSet.prescribed_weight !== currentSet.prescribed_weight) {
        updateData.prescribed_weight = updatedSet.prescribed_weight;
      }
    }

    const { error } = await supabase
      .from("sets")
      .update(updateData)
      .eq("id", setId);

    if (error) {
      console.error("Erreur lors de la mise à jour:", error);
      // En cas d'erreur, recharger pour revenir à l'état cohérent
      return;
    }
  };

  const handleDeleteSet = async (sessionId: string, setId: string) => {
    const session = week.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const setToDelete = session.sets.find(s => s.id === setId);
    if (!setToDelete) return;

    // Compter combien de séries appartiennent à cet exercice
    const exerciseSets = session.sets.filter(s => s.exercise_name === setToDelete.exercise_name);
    
    const confirmMessage = exerciseSets.length === 1
      ? "Cette série est la dernière de cet exercice. Supprimer l'exercice complet ?"
      : "Êtes-vous sûr de vouloir supprimer cette série ?";

    if (!confirm(confirmMessage)) return;

    const supabase = createClient();

    // Si c'est la dernière série de l'exercice, supprimer toutes les séries de cet exercice
    if (exerciseSets.length === 1) {
      const { error } = await supabase
        .from("sets")
        .delete()
        .eq("session_id", sessionId)
        .eq("exercise_name", setToDelete.exercise_name);

      if (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression");
        return;
      }

      setWeek({
        ...week,
        sessions: week.sessions.map(s =>
          s.id === sessionId
            ? { ...s, sets: s.sets.filter(set => set.exercise_name !== setToDelete.exercise_name) }
            : s
        ),
      });
    } else {
      // Sinon, supprimer uniquement cette série
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
    }
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
        
        {/* Bannière d'information pour les blocs de force */}
        {!isGeneralBlock && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">⚡</span>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold text-blue-900">Calcul automatique activé (Bloc de Force)</h4>
                  <p className="text-sm text-blue-700">
                    <strong>RPE → Charge :</strong> Le poids se calcule automatiquement selon vos PR et la table RPE.
                    <br />
                    <strong>Charge → RPE :</strong> Le RPE prescrit s'ajuste automatiquement quand vous modifiez le poids.
                    <br />
                    <strong>RPE Réel :</strong> Notez le ressenti réel après l'exécution (n'affecte pas les calculs).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
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
                  {editingSessionId === session.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingSessionName}
                        onChange={(e) => setEditingSessionName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleUpdateSessionName(session.id!, editingSessionName);
                          } else if (e.key === "Escape") {
                            setEditingSessionId(null);
                            setEditingSessionName("");
                          }
                        }}
                        className="text-xl font-semibold h-9"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateSessionName(session.id!, editingSessionName)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSessionId(null);
                          setEditingSessionName("");
                        }}
                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{session.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSessionId(session.id!);
                          setEditingSessionName(session.name);
                        }}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
                <button
                  onClick={() => handleAddExercise(session.id!)}
                  className="w-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed hover:border-solid hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer"
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">Aucun exercice</p>
                  <p className="text-sm text-gray-400">
                    Cliquez pour ajouter le premier exercice
                  </p>
                </button>
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

                      // Calculer le numéro de série relatif à l'exercice (1, 2, 3... pour chaque exercice)
                      const exerciseSetNumber = arr
                        .filter(s => s.exercise_name === set.exercise_name)
                        .sort((a, b) => a.set_number - b.set_number)
                        .findIndex(s => s.id === set.id) + 1;

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
                            </div>
                          )}
                          <div className="grid gap-3 items-end pl-6 py-2 hover:bg-gray-50 rounded-md -ml-2 pl-8" style={{ gridTemplateColumns: isGeneralBlock ? "auto 1fr 1fr 2fr auto" : "auto 1fr 1fr 1fr 1fr 1fr auto" }}>
                            <div className="text-sm font-medium text-gray-600 pb-2.5">
                              Série {exerciseSetNumber}
                            </div>
                            <div>
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

                            <div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Poids (kg)</Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    step="2.5"
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
                              <>
                                <div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">RPE Prescrit</Label>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        max="12.5"
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

                                <div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">RPE Réel</Label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      min="0"
                                      max="12.5"
                                      step="0.5"
                                      value={set.actual_rpe || ""}
                                      onChange={(e) =>
                                        handleUpdateSet(
                                          session.id!,
                                          set.id!,
                                          "actual_rpe",
                                          e.target.value ? parseFloat(e.target.value) : null
                                        )
                                      }
                                      className="h-9 bg-amber-50"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            
                            <div>
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
                            
                            {/* Bouton de suppression de la série */}
                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSet(session.id!, set.id!)}
                                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Bouton pour ajouter une série après la dernière série de cet exercice */}
                          {isLastSetOfExercise && (
                            <div className="pl-8 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSeries(session.id!, set.exercise_name)}
                                className="h-8 text-xs border-dashed hover:border-solid hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Ajouter une série
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  
                  {/* Bouton pour ajouter un exercice en bas de la séance */}
                  <div className="pt-6 mt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleAddExercise(session.id!)}
                      className="w-full h-12 border-2 border-dashed hover:border-solid hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="font-medium">Ajouter un exercice</span>
                    </Button>
                  </div>
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
