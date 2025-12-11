import { DailyMacroGoal, DietaryPreferences, Meal } from './types';

export function generateMealPlanPrompt(
  macros: DailyMacroGoal,
  preferences: DietaryPreferences,
  lockedMeals: Meal[] = [],
  mealsToAvoid: string[] = []
): string {
  // Construction de la liste des contraintes en texte clair
  const constraints: string[] = [];
  if (preferences.isVegetarian) constraints.push("Végétarien (Pas de viande, pas de poisson)");
  if (preferences.isVegan) constraints.push("Vegan (Aucun produit animal)");
  if (preferences.isGlutenFree) constraints.push("Sans Gluten");
  if (preferences.isLactoseFree) constraints.push("Sans Lactose");
  if (preferences.excludedIngredients.includes('pork')) constraints.push("SANS PORC (Strict)");
  
  if (preferences.allergies.length > 0) {
    constraints.push(`ALLERGIES SÉVÈRES : ${preferences.allergies.join(', ')}`);
  }
  if (preferences.intolerances.length > 0) {
    constraints.push(`Intolérances : ${preferences.intolerances.join(', ')}`);
  }
  if (preferences.excludedIngredients.length > 0) {
    // On filtre le porc car déjà traité spécifiquement
    const otherExcluded = preferences.excludedIngredients.filter(i => i !== 'pork');
    if (otherExcluded.length > 0) {
      constraints.push(`Ingrédients exclus : ${otherExcluded.join(', ')}`);
    }
  }

  const constraintsText = constraints.length > 0 
    ? constraints.join('\n- ') 
    : "Aucune restriction particulière.";

  // Calcul des macros restantes si des repas sont verrouillés
  let targetMacros = { ...macros };
  let contextText = "";
  
  if (lockedMeals.length > 0) {
    const lockedCalories = lockedMeals.reduce((acc, m) => acc + m.macros.calories, 0);
    const lockedProtein = lockedMeals.reduce((acc, m) => acc + m.macros.protein, 0);
    const lockedCarbs = lockedMeals.reduce((acc, m) => acc + m.macros.carbs, 0);
    const lockedFats = lockedMeals.reduce((acc, m) => acc + m.macros.fats, 0);

    targetMacros = {
      calories: Math.max(0, macros.calories - lockedCalories),
      protein: Math.max(0, macros.protein - lockedProtein),
      carbs: Math.max(0, macros.carbs - lockedCarbs),
      fats: Math.max(0, macros.fats - lockedFats)
    };

    const lockedTypes = lockedMeals.map(m => m.type).join(', ');
    contextText = `
CONTEXTE - REPAS DÉJÀ VALIDÉS (NE PAS GÉNÉRER CES TYPES) :
L'utilisateur a déjà validé les repas suivants : ${lockedTypes}.
Tu dois générer UNIQUEMENT les repas manquants pour compléter la journée.
Les macros ci-dessous sont le RESTE à combler.
`;
  }

  let avoidText = "";
  if (mealsToAvoid.length > 0) {
    avoidText = `
VARIATION - ÉVITER CES PLATS (L'utilisateur vient de les refuser) :
- ${mealsToAvoid.join('\n- ')}
Propose des alternatives différentes.
`;
  }

  return `
Tu es un nutritionniste expert spécialisé dans la performance sportive.
Ta mission est de générer un plan de repas précis pour une journée (ou compléter une journée partielle) qui respecte STRICTEMENT les objectifs et contraintes suivants.

${contextText}
${avoidText}

OBJECTIFS MACROS (RESTANT À COMBLER) :
- Calories : ${targetMacros.calories} kcal
- Protéines : ${targetMacros.protein} g
- Glucides : ${targetMacros.carbs} g
- Lipides : ${targetMacros.fats} g
(Marge d'erreur acceptée : +/- 10%)

CONTRAINTES ALIMENTAIRES (CRITIQUE) :
- ${constraintsText}

RÈGLES :
1. Si une contrainte "Sans porc" ou "Végétarien" est présente, tu ne dois JAMAIS inclure l'ingrédient interdit. C'est une question de sécurité et de respect.
2. Les repas doivent être simples à cuisiner, avec des ingrédients courants.
3. Propose des quantités précises (en grammes) pour chaque ingrédient majeur.
4. Ne génère PAS de repas pour les types déjà validés (voir CONTEXTE). Génère les repas manquants logiques (ex: s'il manque le Déjeuner, génère-le).
5. Sois créatif et évite les répétitions si des plats sont à éviter.

FORMAT DE RÉPONSE ATTENDU (JSON STRICT) :
Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant ni après.
Structure du JSON :
{
  "meals": [
    {
      "type": "breakfast", // ou "lunch", "dinner", "snack"
      "name": "Nom du plat",
      "description": "Brève description ou instructions",
      "ingredients": [
        "100g de Flocons d'avoine",
        "2 Oeufs entiers",
        ...
      ],
      "macros": {
        "calories": 500,
        "protein": 30,
        "carbs": 60,
        "fats": 15
      }
    },
    ...
  ],
  "total_macros": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fats": 0
  }
}
`;
}
