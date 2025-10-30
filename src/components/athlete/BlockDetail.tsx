"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, Edit, Trash2, Copy, ArrowLeft } from "lucide-react";
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
  created_at: string;
  sessions: Session[];
}

interface Block {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface BlockDetailProps {
  block: Block;
  programs: Program[];
  exercises: Exercise[];
  athleteId: string;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function BlockDetail({ block, programs, exercises, athleteId }: BlockDetailProps) {
  const router = useRouter();
  const [isAddWeekDialogOpen, setIsAddWeekDialogOpen] = useState(false);
  const [isEditBlockDialogOpen, setIsEditBlockDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreviousWeek, setSelectedPreviousWeek] = useState<string>("");
  
  const [blockFormData, setBlockFormData] = useState({
    name: block.name,
    description: block.description || "",
    start_date: block.start_date || "",
    is_active: block.is_active,
  });

  const handleUpdateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("blocks")
        .update({
          name: blockFormData.name,
          description: blockFormData.description || null,
          start_date: blockFormData.start_date || null,
          is_active: blockFormData.is_active,
        })
        .eq("id", block.id);

      if (error) throw error;

      setIsEditBlockDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du bloc:", error);
      alert("Erreur lors de la mise à jour du bloc");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWeek = async () => {
    if (!selectedPreviousWeek) {
      alert("Veuillez sélectionner une semaine à dupliquer");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Non authentifié");

      // Récupérer la semaine précédente avec toutes ses sessions et sets
      const previousProgram = programs.find(p => p.id === selectedPreviousWeek);
      if (!previousProgram) throw new Error("Semaine précédente introuvable");

      // Créer la nouvelle semaine
      const newWeekNumber = Math.max(...programs.map(p => p.week_number), 0) + 1;
      const { data: newProgram, error: programError } = await supabase
        .from("programs")
        .insert({
          coach_id: user.id,
          athlete_id: athleteId,
          block_id: block.id,
          week_number: newWeekNumber,
          name: `Semaine ${newWeekNumber}`,
        })
        .select()
        .single();

      if (programError) throw programError;

      // Dupliquer chaque session
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

        if (sessionError) throw sessionError;

        // Dupliquer tous les sets (sans les charges/RPE)
        const setsToInsert = session.sets.map(set => ({
          session_id: newSession.id,
          exercise_id: set.exercise.id,
          set_order: set.set_order,
          reps: set.reps,
          rpe: 0, // RPE à 0 par défaut, le coach devra le remplir
          prescribed_weight: null, // Charge à null, le coach devra la remplir
          instructions: set.instructions,
        }));

        const { error: setsError } = await supabase
          .from("v2_sets")
          .insert(setsToInsert);

        if (setsError) throw setsError;
      }

      setIsAddWeekDialogOpen(false);
      setSelectedPreviousWeek("");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la semaine:", error);
      alert("Erreur lors de l'ajout de la semaine");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWeek = (programId: string) => {
    router.push(`/dashboard/athlete/blocks/${block.id}/programs/${programId}`);
  };

  // Trier les programmes par numéro de semaine (plus récent en premier pour l'affichage)
  const sortedPrograms = [...programs].sort((a, b) => b.week_number - a.week_number);

  return (
    <div className="space-y-6">
      {/* Header avec retour */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/athlete">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{block.name}</h1>
          {block.description && (
            <p className="text-muted-foreground mt-1">{block.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setIsEditBlockDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier le bloc
        </Button>
      </div>

      {/* Informations du bloc */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {block.start_date && (
              <div>
                <p className="text-sm text-muted-foreground">Date de début</p>
                <p className="font-medium">
                  {new Date(block.start_date).toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Nombre de semaines</p>
              <p className="font-medium">{programs.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="font-medium">
                {block.is_active ? (
                  <span className="text-green-600">Actif</span>
                ) : (
                  <span className="text-muted-foreground">Inactif</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Semaines du bloc</h2>
        <Dialog open={isAddWeekDialogOpen} onOpenChange={setIsAddWeekDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={programs.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une semaine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle semaine</DialogTitle>
              <DialogDescription>
                Sélectionnez une semaine précédente à dupliquer. Les exercices seront copiés,
                vous pourrez ensuite ajuster les charges et RPE.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Dupliquer depuis la semaine</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedPreviousWeek}
                  onChange={(e) => setSelectedPreviousWeek(e.target.value)}
                >
                  <option value="">Sélectionner une semaine...</option>
                  {sortedPrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} (Semaine {program.week_number})
                    </option>
                  ))}
                </select>
              </div>
              {selectedPreviousWeek && (
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium mb-2">Aperçu de la semaine sélectionnée :</p>
                  {sortedPrograms
                    .find(p => p.id === selectedPreviousWeek)
                    ?.sessions.map((session) => (
                      <div key={session.id} className="mb-2">
                        <p className="font-medium">
                          {DAYS[session.day_of_week - 1]} - {session.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {session.sets.length} exercice(s)
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddWeekDialogOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button onClick={handleAddWeek} disabled={isLoading || !selectedPreviousWeek}>
                {isLoading ? "Duplication..." : "Dupliquer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des semaines */}
      {sortedPrograms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedPrograms.map((program) => (
            <Card
              key={program.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => handleEditWeek(program.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Semaine {program.week_number}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {program.sessions.length} séance(s)
                  </span>
                </CardTitle>
                <CardDescription>{program.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {program.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                    >
                      <span className="font-medium">
                        {DAYS[session.day_of_week - 1]}
                      </span>
                      <span className="text-muted-foreground">
                        {session.name}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditWeek(program.id);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune semaine</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Ce bloc ne contient pas encore de semaine. Votre coach doit d'abord en créer une.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de modification du bloc */}
      <Dialog open={isEditBlockDialogOpen} onOpenChange={setIsEditBlockDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateBlock}>
            <DialogHeader>
              <DialogTitle>Modifier le bloc</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nom du bloc *</Label>
                <Input
                  id="edit-name"
                  value={blockFormData.name}
                  onChange={(e) => setBlockFormData({ ...blockFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
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
              <div className="grid gap-2">
                <Label htmlFor="edit-start-date">Date de début</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={blockFormData.start_date}
                  onChange={(e) => setBlockFormData({ ...blockFormData, start_date: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-is-active"
                  checked={blockFormData.is_active}
                  onChange={(e) => setBlockFormData({ ...blockFormData, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-is-active">Bloc actif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditBlockDialogOpen(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
