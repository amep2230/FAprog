import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { INTENSIFICATION_TECHNIQUES } from "@/lib/intensification-techniques";

interface IntensificationTechniqueSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function IntensificationTechniqueSelect({
  value,
  onChange,
  disabled = false,
}: IntensificationTechniqueSelectProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs sm:text-sm">Technique d'intensification</Label>
      <Select value={value || "none"} onValueChange={(val) => onChange(val === "none" ? "" : val)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner une technique..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Aucune</SelectItem>
          {INTENSIFICATION_TECHNIQUES.map((technique) => (
            <SelectItem key={technique.id} value={technique.id}>
              <div className="flex flex-col">
                <span className="font-medium">{technique.name}</span>
                <span className="text-xs text-gray-500">{technique.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
