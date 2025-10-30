"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Plus, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Program {
  id: string;
  week_number: number;
  name: string;
  sessions: any[];
  created_at: string;
}

interface BlockDetailViewProps {
  block: {
    id: string;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
    programs: Program[];
  };
  athleteId: string;
  athleteName: string;
  exercises: any[];
}

export default function BlockDetailView({ block, athleteId, athleteName, exercises }: BlockDetailViewProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddWeekDialogOpen, setIsAddWeekDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreviousWeek, setSelectedPreviousWeek] = useState<string>("");
  
  const [blockFormData, setBlockFormData] = useState({
    name: block.name,
    description: block.description || "",
    start_date: block.start_date || "",
    end_date: block.end_date || "",
    is_active: block.is_active,
  });

  const [newWeekFormData, setNewWeekFormData] = useState({
    name: "",
    week_number: (block.programs?.length || 0) + 1,
  });

  // Trier les programmes par numéro de semaine décroissant (plus récent en premier)
  const sortedPrograms = [...(block.programs || [])].sort((a, b) => b.week_number - a.week_number);

  const handleUpdateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Si le bloc devient actif, désactiver les autres
      if (blockFormData.is_active && !block.is_active) {
        await supabase
          .from("v2_training_blocks")
          .update({ is_active: false })
          .eq("athlete_id", athleteId)
          .neq("id", block.id);
      }

      const { error } = await supabase
        .from("v2_training_blocks")
        .update({
          name: blockFormData.name,
          description: blockFormData.description || null,
          start_date: blockFormData.start_date || null,
          end_date: blockFormData.end_date || null,
          is_active: blockFormData.is_active,
        })
        .eq("id", block.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du bloc:", error);
      alert("Erreur lors de la mise à jour du bloc");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWeek = async () => {
    if (!selectedPreviousWeek || !newWeekFormData.name) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Récupérer la semaine précédente avec toutes ses sessions et sets
      const { data: previousProgram, error: fetchError } = await supabase
        .from("programs")
        .select(`
          *,
          sessions (
            *,
            sets (
              *,
              exercise:exercises (*)
            )
          )
        `)
        .eq("id", selectedPreviousWeek)
        .single();

      if (fetchError || !previousProgram) {
        throw new Error("Impossible de récupérer le programme précédent");
      }

      // Créer le nouveau programme
      const { data: newProgram, error: programError } = await supabase
        .from("programs")
        .insert({
          coach_id: previousProgram.coach_id,
          athlete_id: previousProgram.athlete_id,
          block_id: block.id,
          week_number: newWeekFormData.week_number,
          name: newWeekFormData.name,
        })
        .select()
        .single();

      if (programError || !newProgram) {
        throw programError;
      }

      // Dupliquer les sessions et les sets (sans les charges et RPE)
      for (const session of previousProgram.sessions) {
        const { data: newSession, error: sessionError } = await supabase
          .from("v2_sessions")
          .insert({
            program_id: newProgram.id,
            day_of_week: session.day_of_week,
            name: session.name,
          })
          .select()
          .single();

        if (sessionError || !newSession) {
          console.error("Erreur création session:", sessionError);
          continue;
        }

        // Dupliquer les sets
        if (session.sets && session.sets.length > 0) {
          const setsToInsert = session.sets.map((set: any) => ({
            session_id: newSession.id,
            exercise_id: set.exercise_id,
            set_order: set.set_order,
            reps: set.reps,
            rpe: 0, // RPE à 0 pour que le coach le remplisse
            prescribed_weight: null, // Charge à null
            instructions: set.instructions,
          }));

          const { error: setsError } = await supabase
            .from("v2_sets")
            .insert(setsToInsert);

          if (setsError) {
            console.error("Erreur création sets:", setsError);
          }
        }
      }

      setIsAddWeekDialogOpen(false);
      setSelectedPreviousWeek("");
      setNewWeekFormData({
        name: "",
        week_number: (block.programs?.length || 0) + 2,
      });
      
      // Rediriger vers la page d'édition de la nouvelle semaine
      router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${block.id}/programs/${newProgram.id}`);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la semaine:", error);
      alert("Erreur lors de l'ajout de la semaine");
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
            <Link href={`/dashboard/coach/athletes/${athleteId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900">{block.name}</h1>
                {block.is_active && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-gray-500">{athleteName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier le bloc
            </Button>
            <Button onClick={() => setIsAddWeekDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une semaine
            </Button>
          </div>
        </div>

        {/* Informations du bloc */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {block.description && (
              <p className="text-gray-600">{block.description}</p>
            )}
            {block.start_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Du {new Date(block.start_date).toLocaleDateString("fr-FR")}
                  {block.end_date && ` au ${new Date(block.end_date).toLocaleDateString("fr-FR")}`}
                </span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {block.programs?.length || 0} semaine{(block.programs?.length || 0) > 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Liste des semaines */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Semaines du bloc</h2>
          {sortedPrograms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-center mb-4">
                  Aucune semaine dans ce bloc
                </p>
                <Button onClick={() => setIsAddWeekDialogOpen(true)}>
                  Créer la première semaine
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedPrograms.map((program) => (
                <Card
                  key={program.id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${block.id}/programs/${program.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Semaine {program.week_number} - {program.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {program.sessions?.length || 0} séance{(program.sessions?.length || 0) > 1 ? "s" : ""} •{" "}
                        Créé le {new Date(program.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Button variant="outline">Modifier</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Dialog - Modifier le bloc */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <form onSubmit={handleUpdateBlock}>
              <DialogHeader>
                <DialogTitle>Modifier le bloc</DialogTitle>
                <DialogDescription>
                  Mettre à jour les informations du bloc d&apos;entraînement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom du bloc *</Label>
                  <Input
                    id="edit-name"
                    value={blockFormData.name}
                    onChange={(e) => setBlockFormData({ ...blockFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={blockFormData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setBlockFormData({ ...blockFormData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-date">Date de début</Label>
                    <Input
                      id="edit-start-date"
                      type="date"
                      value={blockFormData.start_date}
                      onChange={(e) => setBlockFormData({ ...blockFormData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end-date">Date de fin</Label>
                    <Input
                      id="edit-end-date"
                      type="date"
                      value={blockFormData.end_date}
                      onChange={(e) => setBlockFormData({ ...blockFormData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-is-active"
                    checked={blockFormData.is_active}
                    onChange={(e) => setBlockFormData({ ...blockFormData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="edit-is-active" className="cursor-pointer">
                    Bloc actif
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog - Ajouter une semaine */}
        <Dialog open={isAddWeekDialogOpen} onOpenChange={setIsAddWeekDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle semaine</DialogTitle>
              <DialogDescription>
                La structure de la semaine sélectionnée sera dupliquée (exercices et séances).
                Les charges et RPE seront à remplir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="week-number">Numéro de semaine</Label>
                <Input
                  id="week-number"
                  type="number"
                  min="1"
                  value={newWeekFormData.week_number}
                  onChange={(e) => setNewWeekFormData({ ...newWeekFormData, week_number: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="week-name">Nom de la semaine *</Label>
                <Input
                  id="week-name"
                  placeholder="Ex: Semaine d'accumulation, Deload..."
                  value={newWeekFormData.name}
                  onChange={(e) => setNewWeekFormData({ ...newWeekFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previous-week">Dupliquer la structure de *</Label>
                <Select value={selectedPreviousWeek} onValueChange={setSelectedPreviousWeek}>
                  <SelectTrigger id="previous-week">
                    <SelectValue placeholder="Sélectionner une semaine" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedPrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        Semaine {program.week_number} - {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sortedPrograms.length === 0 && (
                  <p className="text-sm text-amber-600">
                    Aucune semaine disponible. Créez d&apos;abord un programme complet.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddWeekDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAddWeek} 
                disabled={isLoading || !selectedPreviousWeek || sortedPrograms.length === 0}
              >
                {isLoading ? "Création..." : "Créer la semaine"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
