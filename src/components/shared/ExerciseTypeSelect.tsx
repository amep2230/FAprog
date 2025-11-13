"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExerciseTypeSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
}

export const EXERCISE_TYPES = [
  { id: "normal", name: "Normal", description: "Exercice seul" },
  { id: "superset", name: "Superset", description: "Deux exercices enchaînés" },
  { id: "triset", name: "Triset", description: "Trois exercices enchaînés" },
];

export function ExerciseTypeSelect({ value, onChange }: ExerciseTypeSelectProps) {
  return (
    <Select
      value={value || "normal"}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full h-9">
        <SelectValue placeholder="Sélectionner un type" />
      </SelectTrigger>
      <SelectContent>
        {EXERCISE_TYPES.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            {type.name} - {type.description}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
