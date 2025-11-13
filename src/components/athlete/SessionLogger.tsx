"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, Loader2, Trophy, TrendingUp } from "lucide-react";

interface SessionLoggerProps {
  session: any;
  athleteId: string;
  onClose: () => void;
}

interface SetLog {
  setId: string;
  actualWeight: string;
  actualReps: string;
  actualRpe: string;
  completed: boolean;
}

interface NewPR {
  exercise: {
    name: string;
  };
  weight: number;
  reps: number;
  estimated_1rm: number;
}

export default function SessionLogger({ session, athleteId, onClose }: SessionLoggerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPRs, setNewPRs] = useState<NewPR[]>([]);

  // Infos générales de la séance
  const [bodyWeight, setBodyWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [nutrition, setNutrition] = useState("");
  const [motivation, setMotivation] = useState("");
  const [stress, setStress] = useState("");

  // Logs des sets
  const [setLogs, setSetLogs] = useState<SetLog[]>(
    session.sets.map((set: any) => ({
      setId: set.id,
      actualWeight: set.prescribed_weight?.toString() || "",
      actualReps: set.reps?.toString() || "",
      actualRpe: set.rpe?.toString() || "",
      completed: true,
    }))
  );

  const handleSetChange = (index: number, field: keyof SetLog, value: string | boolean) => {
    const newLogs = [...setLogs];
    newLogs[index] = { ...newLogs[index], [field]: value };
    setSetLogs(newLogs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/session-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          sessionId: session.id,
          bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
          sleep,
          nutrition,
          motivation,
          stress,
          setLogs: setLogs.map((log) => ({
            setId: log.setId,
            actualWeight: log.actualWeight ? parseFloat(log.actualWeight) : null,
            actualReps: log.actualReps ? parseInt(log.actualReps) : null,
            actualRpe: log.actualRpe ? parseFloat(log.actualRpe) : null,
            completed: log.completed,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      const data = await response.json();
      
      // Si des PRs ont été détectés, les afficher
      if (data.newPRs && data.newPRs.length > 0) {
        setNewPRs(data.newPRs);
        // Attendre 3 secondes pour que l'utilisateur voie les PRs
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-lg max-w-4xl w-full min-h-screen sm:min-h-0 sm:my-8">
        <div className="sticky top-0 bg-white border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-none sm:rounded-t-lg z-10">
          <h2 className="text-lg sm:text-2xl font-bold truncate mr-2">Logger: {session.name}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Infos générales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="bodyWeight">Poids (kg)</Label>
                <Input
                  id="bodyWeight"
                  type="number"
                  step="0.1"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder="75.5"
                />
              </div>
              <div>
                <Label htmlFor="sleep">Sommeil</Label>
                <Input
                  id="sleep"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  placeholder="7h"
                />
              </div>
              <div>
                <Label htmlFor="nutrition">Nutrition</Label>
                <Input
                  id="nutrition"
                  value={nutrition}
                  onChange={(e) => setNutrition(e.target.value)}
                  placeholder="Bon"
                />
              </div>
              <div>
                <Label htmlFor="motivation">Motivation (1-10)</Label>
                <Input
                  id="motivation"
                  type="number"
                  min="1"
                  max="10"
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="8"
                />
              </div>
              <div>
                <Label htmlFor="stress">Stress (1-10)</Label>
                <Input
                  id="stress"
                  type="number"
                  min="1"
                  max="10"
                  value={stress}
                  onChange={(e) => setStress(e.target.value)}
                  placeholder="5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Exercices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {session.sets.map((set: any, idx: number) => (
                <div key={set.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">{set.exercise.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Prescrit: {set.reps} reps @ RPE {set.rpe}
                        {set.prescribed_weight && ` • ${set.prescribed_weight} kg`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={setLogs[idx].completed}
                        onChange={(e) =>
                          handleSetChange(idx, "completed", e.target.checked)
                        }
                        className="h-4 w-4 sm:h-5 sm:w-5 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <Label className="text-sm sm:text-base">Fait</Label>
                    </div>
                  </div>

                  {setLogs[idx].completed && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <Label className="text-xs sm:text-sm">Poids (kg)</Label>
                        <Input
                          type="number"
                          step="2.5"
                          value={setLogs[idx].actualWeight}
                          onChange={(e) =>
                            handleSetChange(idx, "actualWeight", e.target.value)
                          }
                          placeholder={set.prescribed_weight?.toString() || "100"}
                          required
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">Reps</Label>
                        <Input
                          type="number"
                          value={setLogs[idx].actualReps}
                          onChange={(e) =>
                            handleSetChange(idx, "actualReps", e.target.value)
                          }
                          placeholder={set.reps.toString()}
                          required
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm">RPE</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          value={setLogs[idx].actualRpe}
                          onChange={(e) =>
                            handleSetChange(idx, "actualRpe", e.target.value)
                          }
                          placeholder={set.rpe.toString()}
                          required
                          className="text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-md text-sm sm:text-base">{error}</div>
          )}

          {/* Nouveaux PRs détectés */}
          {newPRs.length > 0 && (
            <Card className="border-2 border-yellow-400 bg-yellow-50 animate-pulse">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-800 text-base sm:text-lg">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  <span>🎉 Nouveaux Records Personnels !</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {newPRs.map((pr, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 bg-white rounded-lg border border-yellow-300"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                        <span className="font-semibold text-sm sm:text-base">{pr.exercise.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-base sm:text-lg">
                          {pr.weight} kg × {pr.reps} reps
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          1RM estimé: {pr.estimated_1rm.toFixed(1)} kg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-yellow-700 mt-2 sm:mt-3 text-center">
                  Ces records ont été automatiquement enregistrés ! 💪
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sm:space-x-3 sticky bottom-0 bg-white pt-3 sm:pt-4 pb-2 sm:pb-0 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
