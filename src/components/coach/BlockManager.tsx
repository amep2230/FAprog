"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronRight, Calendar, Check, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TrainingBlock {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  block_type: "force" | "general";
  created_at: string;
  weeks?: any[];
}

interface BlockManagerProps {
  athleteId: string;
  blocks: TrainingBlock[];
  coachId: string;
}

export default function BlockManager({ athleteId, blocks, coachId }: BlockManagerProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: false,
    block_type: "force" as "force" | "general",
  });

  // Trier les blocs par ordre chronologique inverse (plus récent en premier)
  const sortedBlocks = [...blocks].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Si le nouveau bloc est actif, désactiver tous les autres blocs
      if (formData.is_active) {
        await supabase
          .from("training_blocks")
          .update({ is_active: false })
          .eq("athlete_id", athleteId);
      }

      const { data, error } = await supabase.from("training_blocks").insert({
        coach_id: coachId,
        athlete_id: athleteId,
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        block_type: formData.block_type,
      });

      console.log("Insert result:", { data, error });

      if (error) {
        console.error("Supabase error details:", error);
        throw error;
      }

      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        is_active: false,
        block_type: "force",
      });
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la création du bloc:", error);
      alert(`Erreur lors de la création du bloc: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockClick = (blockId: string) => {
    router.push(`/dashboard/coach/athletes/${athleteId}/blocks/${blockId}`);
  };

  // Fonction pour vérifier si un bloc est en cours
  const isBlockOngoing = (block: TrainingBlock): boolean => {
    if (!block.start_date || !block.end_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(block.start_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(block.end_date);
    endDate.setHours(23, 59, 59, 999);
    return today >= startDate && today <= endDate;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Blocs d&apos;entraînement</h2>
          <p className="text-gray-500">Gérer les cycles d&apos;entraînement par blocs</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau bloc
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleCreateBlock}>
              <DialogHeader>
                <DialogTitle>Créer un nouveau bloc</DialogTitle>
                <DialogDescription>
                  Créer un nouveau cycle d&apos;entraînement pour organiser les semaines
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="block_type">Type de bloc *</Label>
                  <Select value={formData.block_type} onValueChange={(value) => setFormData({ ...formData, block_type: value as "force" | "general" })}>
                    <SelectTrigger id="block_type">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="force">Force</SelectItem>
                      <SelectItem value="general">Général</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du bloc *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Bloc Hypertrophie, Phase Force..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Objectifs du bloc..."
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Bloc actif
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Création..." : "Créer le bloc"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedBlocks.map((block) => (
          <Card
            key={block.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              block.is_active ? "border-primary" : "opacity-60"
            }`}
            onClick={() => handleBlockClick(block.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {block.name}
                    {block.is_active && (
                      <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                        Actif
                      </span>
                    )}
                    {isBlockOngoing(block) && (
                      <span className="text-xs font-normal bg-green-50 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        En cours
                      </span>
                    )}
                  </CardTitle>
                  {block.description && (
                    <CardDescription className="line-clamp-2">
                      {block.description}
                    </CardDescription>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {/* Date de début */}
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700 w-32">Date de début</span>
                  <span className="text-gray-600 font-medium">:</span>
                  {block.start_date ? (
                    <span className="text-gray-600">
                      {new Date(block.start_date).toLocaleDateString("fr-FR")}
                    </span>
                  ) : (
                    <span className="text-gray-400">Non définie</span>
                  )}
                </div>

                {/* Date de fin */}
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700 w-32">Date de fin</span>
                  <span className="text-gray-600 font-medium">:</span>
                  {block.end_date ? (
                    <span className="text-gray-600">
                      {new Date(block.end_date).toLocaleDateString("fr-FR")}
                    </span>
                  ) : (
                    <span className="text-gray-400">Non définie</span>
                  )}
                </div>

                {/* Nombre de semaines */}
                <div className="flex items-center gap-2 pt-1 border-t text-gray-600">
                  <span className="font-medium">
                    {block.weeks?.length || 0} semaine{(block.weeks?.length || 0) > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedBlocks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              Aucun bloc d&apos;entraînement créé
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Créer le premier bloc
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
