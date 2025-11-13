/**
 * Liste des principales techniques d'intensification
 * Utilisées pour les blocs d'entraînement de type "Général"
 */

export interface IntensificationTechnique {
  id: string;
  name: string;
  description: string;
}

export const INTENSIFICATION_TECHNIQUES: IntensificationTechnique[] = [
  {
    id: "drop-set",
    name: "Drop Set",
    description: "Baisser la charge après l'échec et continuer la série."
  },
  {
    id: "rest-pause",
    name: "Rest-Pause",
    description: "Prendre une courte pause (5–20s) après l'échec puis continuer."
  },
  {
    id: "partial-reps",
    name: "Répétitions partielles",
    description: "Alterner une répétition avec amplitude compète, et une repétition avec la moitié de l'amplitude"
  },
  {
    id: "tempo-tut",
    name: "Tempo lent",
    description: "Effectuer la phase excentrique en 3 secondes"
  },
  {
    id: "isometric",
    name: "Isométrique",
    description: "Bloquer le mouvement pendant 3 secondes entre la phase excentrique et la phase concentrique"
  }
];

/**
 * Utilitaire pour récupérer une technique par son ID
 */
export function getTechniqueById(id: string): IntensificationTechnique | undefined {
  return INTENSIFICATION_TECHNIQUES.find(t => t.id === id);
}

/**
 * Utilitaire pour récupérer le nom de la technique par son ID
 */
export function getTechniqueName(id: string | null | undefined): string {
  if (!id) return "Aucune";
  const technique = getTechniqueById(id);
  return technique ? technique.name : "Inconnue";
}
