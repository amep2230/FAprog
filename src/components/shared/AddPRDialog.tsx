"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Plus } from "lucide-react";

interface AddPRDialogProps {
  athleteId: string;
  exercises: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

export default function AddPRDialog({
  athleteId,
  exercises,
  onSuccess,
  triggerButton,
}: AddPRDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    exerciseId: "",
    weight: "",
    date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/personal-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          athlete_id: athleteId,
          exercise_id: formData.exerciseId,
          weight: parseFloat(formData.weight),
          date: formData.date,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout du PR");
      }

      // Reset form
      setFormData({
        exerciseId: "",
        weight: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });

      setOpen(false);

      // Callback de succès
      if (onSuccess) {
        onSuccess();
      } else {
        // Rafraîchir la page par défaut
        window.location.reload();
      }
    } catch (error) {
      console.error("Error adding PR:", error);
      alert("Erreur lors de l'ajout du PR");
    } finally {
      setLoading(false);
    }
  };

  // Trier les exercices par nom pour faciliter la recherche
  const sortedExercises = [...exercises].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un PR
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Nouveau Record Personnel
          </DialogTitle>
          <DialogDescription>
            Enregistrez un nouveau PR pour suivre votre progression
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exercice */}
          <div className="space-y-2">
            <Label htmlFor="exercise">Exercice *</Label>
            <Select
              value={formData.exerciseId}
              onValueChange={(value) =>
                setFormData({ ...formData, exerciseId: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un exercice" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {sortedExercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Poids */}
          <div className="space-y-2">
            <Label htmlFor="weight">Poids (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="2.5"
              min="0"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: e.target.value })
              }
              placeholder="Ex: 100"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              max={new Date().toISOString().split("T")[0]} // Ne peut pas être dans le futur
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Ex: Avec ceinture, pause 2s"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
