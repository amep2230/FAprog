'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateDailyMealPlan } from '@/app/actions/generate-meals';
import { toggleMealStatus } from '@/app/actions/toggle-meal';
import { DayMealPlan, Meal, DailyMacroGoal } from '@/lib/nutrition/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ChefHat, Utensils, Flame, RefreshCw, CheckCircle2, Circle, Lock, Unlock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NutritionDashboardProps {
  initialPlan?: DayMealPlan | null;
  profile: any; // Nutrition Profile from DB
}

export function NutritionDashboard({ initialPlan, profile }: NutritionDashboardProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<DayMealPlan | null>(initialPlan || null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lockedMeals, setLockedMeals] = useState<Set<string>>(new Set());
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  // Sync state with prop updates (e.g. after router.refresh())
  useEffect(() => {
    setPlan(initialPlan || null);
  }, [initialPlan]);

  // Calculate Targets (Priority: Plan specific > Profile general)
  const targets: DailyMacroGoal = plan ? {
    calories: profile.target_calories, // Usually same, but could differ if plan was generated with old targets
    protein: profile.target_protein_g,
    carbs: profile.target_carbs_g,
    fats: profile.target_fats_g
  } : {
    calories: profile.target_calories,
    protein: profile.target_protein_g,
    carbs: profile.target_carbs_g,
    fats: profile.target_fats_g
  };

  // Calculate Realized (Sum of eaten meals)
  const realized: DailyMacroGoal = plan ? plan.meals.reduce((acc, meal) => {
    if (meal.isEaten) {
      return {
        calories: acc.calories + meal.macros.calories,
        protein: acc.protein + meal.macros.protein,
        carbs: acc.carbs + meal.macros.carbs,
        fats: acc.fats + meal.macros.fats,
      };
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 }) : { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      // Pass locked meals to the generator
      const result = await generateDailyMealPlan(undefined, Array.from(lockedMeals));
      if (result.success && result.data) {
        // Refresh the page data to get the new meals with their DB IDs
        router.refresh();
      } else {
        setError(result.error || "Impossible de générer le plan.");
      }
    });
  };

  const handleToggleMeal = async (mealId: string, currentStatus: boolean) => {
    // Optimistic update
    if (!plan) return;
    
    const updatedMeals = plan.meals.map(m => 
      m.id === mealId ? { ...m, isEaten: !currentStatus } : m
    );
    setPlan({ ...plan, meals: updatedMeals });

    const result = await toggleMealStatus(mealId, !currentStatus);
    if (!result.success) {
      // Revert if failed
      setPlan({ ...plan, meals: plan.meals });
      setError("Erreur lors de la mise à jour du repas");
    }
  };

  const toggleLock = (mealId: string) => {
    const newLocked = new Set(lockedMeals);
    if (newLocked.has(mealId)) {
      newLocked.delete(mealId);
    } else {
      newLocked.add(mealId);
    }
    setLockedMeals(newLocked);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. MACRO PROGRESS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroProgressCard 
          label="Calories" 
          current={realized.calories} 
          target={targets.calories} 
          unit="kcal" 
          colorClass="bg-primary"
        />
        <MacroProgressCard 
          label="Protéines" 
          current={realized.protein} 
          target={targets.protein} 
          unit="g" 
          colorClass="bg-blue-500"
        />
        <MacroProgressCard 
          label="Glucides" 
          current={realized.carbs} 
          target={targets.carbs} 
          unit="g" 
          colorClass="bg-green-500"
        />
        <MacroProgressCard 
          label="Lipides" 
          current={realized.fats} 
          target={targets.fats} 
          unit="g" 
          colorClass="bg-yellow-500"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* 2. MEALS LIST SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Journal des Repas
          </h3>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {plan ? (lockedMeals.size > 0 ? `Régénérer (${lockedMeals.size} verrouillés)` : 'Régénérer tout') : 'Générer des exemples'}
              </>
            )}
          </Button>
        </div>

        {!plan ? (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="py-8 text-center text-muted-foreground">
              <p>Aucun repas planifié pour aujourd'hui.</p>
              <p className="text-sm mt-1">Cliquez sur "Générer des exemples" pour obtenir des suggestions de l'IA.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {plan.meals.map((meal) => (
              <MealItem 
                key={meal.id} 
                meal={meal} 
                isLocked={lockedMeals.has(meal.id)}
                onToggle={() => handleToggleMeal(meal.id, meal.isEaten)} 
                onLockToggle={() => toggleLock(meal.id)}
                onSelect={() => setSelectedMeal(meal)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMeal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  <Utensils className="w-4 h-4" />
                  {mapTypeLabel(selectedMeal.type)}
                </div>
                <DialogTitle className="text-2xl">{selectedMeal.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Macros Grid */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5 text-orange-500" />
                      {selectedMeal.macros.calories}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">Calories</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedMeal.macros.protein}g</div>
                    <div className="text-xs text-muted-foreground uppercase">Protéines</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{selectedMeal.macros.carbs}g</div>
                    <div className="text-xs text-muted-foreground uppercase">Glucides</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{selectedMeal.macros.fats}g</div>
                    <div className="text-xs text-muted-foreground uppercase">Lipides</div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ChefHat className="w-5 h-5" />
                    Préparation & Description
                  </h4>
                  <div className="text-muted-foreground whitespace-pre-line bg-muted/30 p-4 rounded-md">
                    {selectedMeal.description.split('Ingrédients:')[0].trim()}
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="font-semibold mb-2">Ingrédients</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMeal.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function mapTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    breakfast: 'Petit Déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snack_1: 'Collation 1',
    snack_2: 'Collation 2',
    pre_workout: 'Pré-Workout',
    post_workout: 'Post-Workout'
  };
  return typeLabels[type] || type;
}

function MacroProgressCard({ label, current, target, unit, colorClass }: { label: string, current: number, target: number, unit: string, colorClass: string }) {
  const percentage = Math.min(100, Math.round((current / target) * 100));
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="text-right">
            <span className="text-2xl font-bold">{current}</span>
            <span className="text-sm text-muted-foreground"> / {target} {unit}</span>
          </div>
        </div>
        <Progress value={percentage} className="h-2" indicatorClassName={colorClass} />
      </CardContent>
    </Card>
  );
}

function MealItem({ meal, isLocked, onToggle, onLockToggle, onSelect }: { meal: Meal, isLocked: boolean, onToggle: () => void, onLockToggle: () => void, onSelect: () => void }) {
  return (
    <Card 
      className={cn("transition-all duration-200 cursor-pointer group", meal.isEaten ? "bg-muted/50 border-transparent" : "hover:border-primary/50 hover:shadow-md")}
      onClick={onSelect}
    >
      <CardContent className="p-4 flex items-start gap-4">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn(
            "mt-1 flex-shrink-0 transition-colors",
            meal.isEaten ? "text-green-500" : "text-muted-foreground hover:text-primary"
          )}
        >
          {meal.isEaten ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>
        
        <div className="flex-grow min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                {mapTypeLabel(meal.type)}
              </span>
              <h4 className={cn("font-semibold text-lg truncate group-hover:text-primary transition-colors", meal.isEaten && "line-through text-muted-foreground")}>
                {meal.name}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 text-xs font-medium">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-400">
                  {meal.macros.protein}g P
                </span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">
                  {meal.macros.carbs}g G
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded dark:bg-yellow-900/30 dark:text-yellow-400">
                  {meal.macros.fats}g L
                </span>
                <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {meal.macros.calories}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={(e) => { e.stopPropagation(); onLockToggle(); }} 
                title={isLocked ? "Déverrouiller" : "Verrouiller pour ne pas régénérer"}
              >
                {isLocked ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>
          
          {!meal.isEaten && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {meal.description.split('\n')[0]}...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
