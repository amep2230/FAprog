"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Plus, Calendar, FileText, Copy } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Week {
  id: string;
  week_number: number;
  name: string;
  notes: string | null;
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
    weeks: Week[];
  };
  athleteId: string;
  athleteName: string;
  coachId: string;
  exercises: any[];
}

export default function BlockDetailView({ block, athleteId, athleteName, coachId, exercises }: BlockDetailViewProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddWeekDialogOpen, setIsAddWeekDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createMode, setCreateMode] = useState<"scratch" | "duplicate">("scratch");
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
    week_number: (block.weeks?.length || 0) + 1,
    notes: "",
  });

  // Trier les semaines par numéro décroissant (plus récent en premier)
  const sortedWeeks = [...(block.weeks || [])].sort((a, b) => b.week_number - a.week_number);

  const handleUpdateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Si le bloc devient actif, désactiver les autres
      if (blockFormData.is_active && !block.is_active) {
        await supabase
          .from("training_blocks")
          .update({ is_active: false })
          .eq("athlete_id", athleteId)
          .neq("id", block.id);
      }

      const { error } = await supabase
        .from("training_blocks")
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

  const handleCreateWeekFromScratch = async () => {
    if (!newWeekFormData.name) {
      alert("Veuillez donner un nom à la semaine");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Créer la semaine vide
      const { data: newWeek, error: weekError } = await supabase
        .from("training_weeks")
        .insert({
          block_id: block.id,
          week_number: newWeekFormData.week_number,
          name: newWeekFormData.name,
          notes: newWeekFormData.notes || null,
        })
        .select()
        .single();

      if (weekError || !newWeek) {
        throw weekError;
      }

      setIsAddWeekDialogOpen(false);
      setNewWeekFormData({
        name: "",
        week_number: (block.weeks?.length || 0) + 2,
        notes: "",
      });
      
      // Rediriger vers l'éditeur de la nouvelle semaine
      router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${block.id}/weeks/${newWeek.id}`);
    } catch (error) {
      console.error("Erreur lors de la création de la semaine:", error);
      alert("Erreur lors de la création de la semaine");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateWeek = async () => {
    if (!selectedPreviousWeek || !newWeekFormData.name) {
      alert("Veuillez sélectionner une semaine à dupliquer et donner un nom");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Récupérer la semaine précédente avec toutes ses sessions et sets
      const { data: previousWeek, error: fetchError } = await supabase
        .from("training_weeks")
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

      if (fetchError || !previousWeek) {
        throw new Error("Impossible de récupérer la semaine précédente");
      }

      // Créer la nouvelle semaine
      const { data: newWeek, error: weekError } = await supabase
        .from("training_weeks")
        .insert({
          block_id: block.id,
          week_number: newWeekFormData.week_number,
          name: newWeekFormData.name,
          notes: newWeekFormData.notes || previousWeek.notes,
        })
        .select()
        .single();

      if (weekError || !newWeek) {
        throw weekError;
      }

      // Dupliquer les sessions et les sets (sans les charges et RPE)
      for (const session of previousWeek.sessions) {
        const { data: newSession, error: sessionError } = await supabase
          .from("sessions")
          .insert({
            week_id: newWeek.id,
            session_number: session.session_number,
            name: session.name,
            notes: session.notes,
          })
          .select()
          .single();

        if (sessionError || !newSession) {
          console.error("Erreur création session:", sessionError);
          continue;
        }

        // Dupliquer les sets (avec RPE et charges réinitialisés)
        if (session.sets && session.sets.length > 0) {
          const setsToInsert = session.sets.map((set: any) => ({
            session_id: newSession.id,
            exercise_name: set.exercise_name,
            exercise_type: set.exercise_type,
            set_number: set.set_number,
            prescribed_reps: set.prescribed_reps,
            prescribed_weight: null, // Charge à null pour remplir
            prescribed_rpe: null, // RPE à null pour remplir
            notes: set.notes,
          }));

          const { error: setsError } = await supabase
            .from("sets")
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
        week_number: (block.weeks?.length || 0) + 2,
        notes: "",
      });
      
      // Rediriger vers la page d'édition de la nouvelle semaine
      router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${block.id}/weeks/${newWeek.id}`);
    } catch (error) {
      console.error("Erreur lors de la duplication de la semaine:", error);
      alert("Erreur lors de la duplication de la semaine");
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
                {block.weeks?.length || 0} semaine{(block.weeks?.length || 0) > 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Liste des semaines */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Semaines du bloc</h2>
          {sortedWeeks.length === 0 ? (
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
              {sortedWeeks.map((week) => (
                <Card
                  key={week.id}
                  className="hover:shadow-md transition-all"
                >
                  <CardContent className="flex items-center justify-between p-6">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        console.log("Navigating to:", `/dashboard/coach/athletes/${athleteId}/blocks/${block.id}/weeks/${week.id}`);
                        router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${block.id}/weeks/${week.id}`);
                      }}
                    >
                      <h3 className="font-semibold text-lg">
                        Semaine {week.week_number} - {week.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {week.sessions?.length || 0} séance{(week.sessions?.length || 0) > 1 ? "s" : ""} •{" "}
                        Créé le {new Date(week.created_at).toLocaleDateString("fr-FR")}
                      </p>
                      {week.notes && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          📝 {week.notes}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = `/dashboard/coach/athletes/${athleteId}/blocks/${block.id}/weeks/${week.id}`;
                        console.log("Button clicked, navigating to:", url);
                        router.push(url);
                      }}
                    >
                      Modifier
                    </Button>
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
                    className="h-4 w-4 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle semaine</DialogTitle>
              <DialogDescription>
                Créer une semaine from scratch ou dupliquer une semaine existante
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={createMode} onValueChange={(v: string) => setCreateMode(v as "scratch" | "duplicate")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scratch">
                  <FileText className="mr-2 h-4 w-4" />
                  Créer from scratch
                </TabsTrigger>
                <TabsTrigger value="duplicate" disabled={sortedWeeks.length === 0}>
                  <Copy className="mr-2 h-4 w-4" />
                  Dupliquer une semaine
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="scratch" className="space-y-4 py-4">
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
                  <Label htmlFor="week-notes">Notes (optionnel)</Label>
                  <Textarea
                    id="week-notes"
                    placeholder="Objectifs de la semaine, focus..."
                    value={newWeekFormData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setNewWeekFormData({ ...newWeekFormData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> La semaine sera créée vide. Vous pourrez ensuite ajouter des séances et des exercices dans l&apos;éditeur.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="duplicate" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="dup-week-number">Numéro de semaine</Label>
                  <Input
                    id="dup-week-number"
                    type="number"
                    min="1"
                    value={newWeekFormData.week_number}
                    onChange={(e) => setNewWeekFormData({ ...newWeekFormData, week_number: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dup-week-name">Nom de la semaine *</Label>
                  <Input
                    id="dup-week-name"
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
                      {sortedWeeks.map((week) => (
                        <SelectItem key={week.id} value={week.id}>
                          Semaine {week.week_number} - {week.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dup-week-notes">Notes (optionnel)</Label>
                  <Textarea
                    id="dup-week-notes"
                    placeholder="Objectifs de la semaine, focus..."
                    value={newWeekFormData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setNewWeekFormData({ ...newWeekFormData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>Note:</strong> La structure (séances et exercices) sera copiée. Les charges et RPE seront remis à zéro.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddWeekDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={createMode === "scratch" ? handleCreateWeekFromScratch : handleDuplicateWeek}
                disabled={isLoading || (createMode === "duplicate" && (!selectedPreviousWeek || sortedWeeks.length === 0))}
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
