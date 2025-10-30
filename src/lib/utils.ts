import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcule la charge à utiliser en fonction du 1RM, RPE et nombre de répétitions
 * @param oneRM - Le 1RM de l'athlète pour l'exercice
 * @param reps - Le nombre de répétitions prévues
 * @param rpe - Le RPE cible
 * @param rpeTable - La table RPE de référence
 * @returns La charge calculée ou null si non trouvée
 */
export function calculateWeight(
  oneRM: number,
  reps: number,
  rpe: number,
  rpeTable: { reps: number; rpe: number; percentage_of_1rm: number }[]
): number | null {
  const entry = rpeTable.find((row) => row.reps === reps && row.rpe === rpe);
  
  if (!entry) {
    return null;
  }

  return Math.round((oneRM * entry.percentage_of_1rm) / 100 * 2) / 2; // Arrondi au 0.5kg près
}

/**
 * Estime le 1RM basé sur le poids levé, RPE et répétitions
 * @param weight - Poids levé
 * @param reps - Nombre de répétitions effectuées
 * @param rpe - RPE ressenti
 * @param rpeTable - La table RPE de référence
 * @returns Le 1RM estimé ou null si non trouvé
 */
export function estimateOneRM(
  weight: number,
  reps: number,
  rpe: number,
  rpeTable: { reps: number; rpe: number; percentage_of_1rm: number }[]
): number | null {
  const entry = rpeTable.find((row) => row.reps === reps && row.rpe === rpe);
  
  if (!entry) {
    return null;
  }

  return Math.round((weight / entry.percentage_of_1rm) * 100);
}

/**
 * Formate une date au format français
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Formate un nombre avec une décimale
 */
export function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}
