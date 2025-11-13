"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  reps: number;
  weight: number;
  estimated_1rm: number;
  created_at: string;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
}

interface PersonalRecordsManagerProps {
  athleteId: string;
  athleteName: string;
}

export default function PersonalRecordsManager({ athleteId, athleteName }: PersonalRecordsManagerProps) {
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PersonalRecord | null>(null);
  
  const [formData, setFormData] = useState({
    exercise_id: "",
    reps: 1,
    weight: 0,
  });

  useEffect(() => {
    loadData();
  }, [athleteId]);

  const loadData = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Charger les exercices
      const { data: exercisesData, error: exercisesError } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);

      // Charger les PR
      const { data: prData, error: prError } = await supabase
        .from("personal_records")
        .select(`
          id,
          exercise_id,
          reps,
          weight,
          estimated_1rm,
          created_at,
          exercises (
            name
          )
        `)
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: false });

      if (prError) throw prError;

      const formattedPRs = (prData || []).map((pr: any) => ({
        id: pr.id,
        exercise_id: pr.exercise_id,
        exercise_name: pr.exercises?.name || "Inconnu",
        reps: pr.reps,
        weight: pr.weight,
        estimated_1rm: pr.estimated_1rm,
        created_at: pr.created_at,
      }));

      setPersonalRecords(formattedPRs);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      alert("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  // Formule de Brzycki pour estimer le 1RM
  const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    return Math.round(weight * (36 / (37 - reps)) * 10) / 10;
  };

  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setSelectedPR(null);
    setFormData({ exercise_id: "", reps: 1, weight: 0 });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (pr: PersonalRecord) => {
    setIsEditMode(true);
    setSelectedPR(pr);
    setFormData({
      exercise_id: pr.exercise_id,
      reps: pr.reps,
      weight: pr.weight,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.exercise_id || formData.weight <= 0) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const estimated1RM = calculate1RM(formData.weight, formData.reps);

      if (isEditMode && selectedPR) {
        // Mise à jour
        const { error } = await supabase
          .from("personal_records")
          .update({
            exercise_id: formData.exercise_id,
            reps: formData.reps,
            weight: formData.weight,
            estimated_1rm: estimated1RM,
          })
          .eq("id", selectedPR.id);

        if (error) throw error;
        alert("✅ PR mis à jour avec succès !");
      } else {
        // Création
        const { error } = await supabase
          .from("personal_records")
          .insert({
            athlete_id: athleteId,
            exercise_id: formData.exercise_id,
            reps: formData.reps,
            weight: formData.weight,
            estimated_1rm: estimated1RM,
          });

        if (error) throw error;
        alert("✅ PR ajouté avec succès !");
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (prId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce PR ?")) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("personal_records")
        .delete()
        .eq("id", prId);

      if (error) throw error;
      alert("✅ PR supprimé avec succès !");
      loadData();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Grouper les PR par exercice
  const groupedPRs = personalRecords.reduce((acc, pr) => {
    if (!acc[pr.exercise_name]) {
      acc[pr.exercise_name] = [];
    }
    acc[pr.exercise_name].push(pr);
    return acc;
  }, {} as Record<string, PersonalRecord[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Records</h1>
          <p className="text-gray-500">{athleteName}</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un PR
        </Button>
      </div>

      {/* Liste des PR groupés par exercice */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">Chargement...</p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedPRs).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">Aucun PR enregistré</p>
              <Button onClick={handleOpenAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter votre premier PR
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {Object.entries(groupedPRs).map(([exerciseName, prs]) => {
            // Trouver le meilleur PR (1RM estimé le plus élevé)
            const bestPR = prs.reduce((max, pr) => 
              pr.estimated_1rm > max.estimated_1rm ? pr : max
            );

            return (
              <Card key={exerciseName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{exerciseName}</span>
                    <span className="text-2xl font-bold text-primary">
                      {bestPR.estimated_1rm} kg
                      <span className="text-sm text-gray-500 ml-2">(1RM estimé)</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prs.map((pr) => (
                      <div
                        key={pr.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="font-semibold">
                            {pr.reps === 1 ? (
                              <span className="text-primary">1RM</span>
                            ) : (
                              <span>{pr.reps} reps</span>
                            )}
                          </div>
                          <div className="text-lg font-bold">
                            {pr.weight} kg
                          </div>
                          {pr.reps > 1 && (
                            <div className="text-sm text-gray-500">
                              → {pr.estimated_1rm} kg (estimé)
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {new Date(pr.created_at).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(pr)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pr.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Ajouter/Modifier PR */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Modifier un PR" : "Ajouter un PR"}
            </DialogTitle>
            <DialogDescription>
              Enregistrez vos performances maximales pour calculer automatiquement les charges d&apos;entraînement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exercise">Exercice *</Label>
              <Select
                value={formData.exercise_id}
                onValueChange={(value) => setFormData({ ...formData, exercise_id: value })}
              >
                <SelectTrigger id="exercise">
                  <SelectValue placeholder="Sélectionner un exercice" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reps">Répétitions *</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Poids (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="2.5"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {formData.weight > 0 && formData.reps > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>1RM estimé :</strong>{" "}
                  {calculate1RM(formData.weight, formData.reps)} kg
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Calculé avec la formule de Brzycki
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : isEditMode ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
