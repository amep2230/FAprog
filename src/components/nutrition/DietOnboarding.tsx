'use client';

import { useState, useTransition } from 'react';
import { saveNutritionProfile } from '@/app/actions/nutrition';
import { UserMeasurements, DietaryPreferences, DailyMacroGoal } from '@/lib/nutrition/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export function DietOnboarding() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DailyMacroGoal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [measurements, setMeasurements] = useState<UserMeasurements>({
    weight: 70,
    height: 175,
    age: 30,
    gender: 'male',
    activityLevel: 'moderately_active',
    goal: 'maintenance'
  });

  const [preferences, setPreferences] = useState<DietaryPreferences>({
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isLactoseFree: false,
    allergies: [],
    intolerances: [],
    excludedIngredients: []
  });

  const [otherAllergies, setOtherAllergies] = useState('');

  const handleSubmit = () => {
    setError(null);
    
    // Parse other allergies
    const finalPreferences = {
      ...preferences,
      allergies: otherAllergies 
        ? otherAllergies.split(',').map(s => s.trim()).filter(Boolean) 
        : []
    };

    startTransition(async () => {
      const response = await saveNutritionProfile(measurements, finalPreferences);
      if (response.success && response.macros) {
        setResult(response.macros);
      } else {
        setError(response.error || 'Une erreur est survenue');
      }
    });
  };

  if (result) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Votre Plan Nutritionnel</CardTitle>
          <CardDescription>Basé sur vos objectifs et votre métabolisme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{result.calories}</div>
              <div className="text-sm text-muted-foreground">Kcal</div>
            </div>
            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.protein}g</div>
              <div className="text-sm text-muted-foreground">Protéines</div>
            </div>
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.carbs}g</div>
              <div className="text-sm text-muted-foreground">Glucides</div>
            </div>
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{result.fats}g</div>
              <div className="text-sm text-muted-foreground">Lipides</div>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button onClick={() => setResult(null)} variant="outline">Modifier mes données</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Générateur de Diète</CardTitle>
        <CardDescription>Renseignez vos informations pour obtenir votre plan personnalisé</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Mensurations */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Vos Mensurations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Poids (kg)</Label>
              <Input 
                id="weight" 
                type="number" 
                value={measurements.weight} 
                onChange={(e) => setMeasurements({...measurements, weight: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Taille (cm)</Label>
              <Input 
                id="height" 
                type="number" 
                value={measurements.height} 
                onChange={(e) => setMeasurements({...measurements, height: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Âge</Label>
              <Input 
                id="age" 
                type="number" 
                value={measurements.age} 
                onChange={(e) => setMeasurements({...measurements, age: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sexe</Label>
              <Select 
                value={measurements.gender} 
                onValueChange={(v: any) => setMeasurements({...measurements, gender: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Homme</SelectItem>
                  <SelectItem value="female">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Niveau d'activité</Label>
              <Select 
                value={measurements.activityLevel} 
                onValueChange={(v: any) => setMeasurements({...measurements, activityLevel: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sédentaire (Peu d'exercice)</SelectItem>
                  <SelectItem value="lightly_active">Léger (1-3 jours/semaine)</SelectItem>
                  <SelectItem value="moderately_active">Modéré (3-5 jours/semaine)</SelectItem>
                  <SelectItem value="very_active">Intense (6-7 jours/semaine)</SelectItem>
                  <SelectItem value="extra_active">Très intense (Physique + Sport)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Objectif */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Votre Objectif</h3>
          <div className="space-y-2">
            <Label>Objectif principal</Label>
            <Select 
              value={measurements.goal} 
              onValueChange={(v: any) => setMeasurements({...measurements, goal: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_loss">Perte de poids</SelectItem>
                <SelectItem value="maintenance">Maintien</SelectItem>
                <SelectItem value="muscle_gain">Prise de masse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Préférences */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Préférences Alimentaires</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="vegetarian" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={preferences.isVegetarian}
                onChange={(e) => setPreferences({...preferences, isVegetarian: e.target.checked})}
              />
              <Label htmlFor="vegetarian">Végétarien</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="vegan" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={preferences.isVegan}
                onChange={(e) => setPreferences({...preferences, isVegan: e.target.checked})}
              />
              <Label htmlFor="vegan">Vegan</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="pork_free" 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={preferences.excludedIngredients.includes('pork')}
                onChange={(e) => {
                  const newExcluded = e.target.checked 
                    ? [...preferences.excludedIngredients, 'pork']
                    : preferences.excludedIngredients.filter(i => i !== 'pork');
                  setPreferences({...preferences, excludedIngredients: newExcluded});
                }}
              />
              <Label htmlFor="pork_free">Sans porc</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Autres allergies ou intolérances (séparées par des virgules)</Label>
            <Textarea 
              id="allergies" 
              placeholder="Ex: Arachides, Gluten, Crustacés..." 
              value={otherAllergies}
              onChange={(e) => setOtherAllergies(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}

      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSubmit} 
          disabled={isPending}
        >
          {isPending ? 'Calcul en cours...' : 'Valider et Calculer mon Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
}
