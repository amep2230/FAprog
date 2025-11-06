"use client";

import { useState } from "react";
import { Profile, Exercise, RpeTable, PersonalRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { calculateWeight } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProgramCreatorProps {
  coach: Profile;
  athlete: Profile;
  exercises: Exercise[];
  rpeTable: RpeTable[];
  personalRecords: (PersonalRecord & { exercise: Exercise })[];
}

interface SetData {
  id: string;
  exerciseId: string;
  setOrder: number;
  reps: number;
  rpe: number;
  prescribedWeight: number | null;
  instructions: string;
}

interface SessionData {
  id: string;
  dayOfWeek: number;
  name: string;
  sets: SetData[];
}

export default function ProgramCreator({
  coach,
  athlete,
  exercises,
  rpeTable,
  personalRecords,
}: ProgramCreatorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [programName, setProgramName] = useState("");
  const [weekNumber, setWeekNumber] = useState(1);
  const [sessions, setSessions] = useState<SessionData[]>([]);

  const addSession = () => {
    const newSession: SessionData = {
      id: `temp-${Date.now()}`,
      dayOfWeek: sessions.length + 1,
      name: `J${sessions.length + 1}`,
      sets: [],
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
  };

  const updateSession = (sessionId: string, updates: Partial<SessionData>) => {
    setSessions(
      sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
    );
  };

  const addSet = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const newSet: SetData = {
      id: `temp-set-${Date.now()}`,
      exerciseId: exercises[0]?.id || "",
      setOrder: session.sets.length + 1,
      reps: 5,
      rpe: 8,
      prescribedWeight: null,
      instructions: "",
    };

    updateSession(sessionId, {
      sets: [...session.sets, newSet],
    });
  };

  const removeSet = (sessionId: string, setId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    updateSession(sessionId, {
      sets: session.sets.filter((set) => set.id !== setId),
    });
  };

  const updateSet = (
    sessionId: string,
    setId: string,
    updates: Partial<SetData>
  ) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const updatedSets = session.sets.map((set) => {
      if (set.id !== setId) return set;

      const newSet = { ...set, ...updates };

      // Calcul automatique de la charge si exercice, reps et RPE sont définis
      if (
        newSet.exerciseId &&
        newSet.reps &&
        newSet.rpe &&
        updates.exerciseId !== undefined ||
        updates.reps !== undefined ||
        updates.rpe !== undefined
      ) {
        const pr = personalRecords.find(
          (pr) => pr.exercise_id === newSet.exerciseId && pr.reps === 1
        );

        if (pr) {
          const calculated = calculateWeight(
            pr.estimated_1rm,
            newSet.reps,
            newSet.rpe,
            rpeTable
          );
          if (calculated !== null) {
            newSet.prescribedWeight = calculated;
          }
        }
      }

      return newSet;
    });

    updateSession(sessionId, { sets: updatedSets });
  };

  const handleSubmit = async () => {
    if (!programName.trim()) {
      alert("Veuillez donner un nom au programme");
      return;
    }

    if (sessions.length === 0) {
      alert("Veuillez ajouter au moins une séance");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId: coach.id,
          athleteId: athlete.id,
          name: programName,
          weekNumber,
          sessions: sessions.map((session) => ({
            dayOfWeek: session.dayOfWeek,
            name: session.name,
            sets: session.sets.map((set) => ({
              exerciseId: set.exerciseId,
              setOrder: set.setOrder,
              reps: set.reps,
              rpe: set.rpe,
              prescribedWeight: set.prescribedWeight,
              instructions: set.instructions,
            })),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du programme");
      }

      router.push("/dashboard/coach");
    } catch (error) {
      alert("Erreur lors de la création du programme");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/coach">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Nouveau Programme
                </h1>
                <p className="text-sm text-gray-500">
                  Pour {athlete.name}
                </p>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={loading} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Enregistrement..." : "Enregistrer le programme"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Program Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations du Programme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programName">Nom du programme</Label>
                <Input
                  id="programName"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="Ex: Programme B7"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekNumber">Numéro de semaine</Label>
                <Input
                  id="weekNumber"
                  type="number"
                  min="1"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <div className="space-y-6">
          {sessions.map((session, sessionIndex) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom de la séance</Label>
                      <Input
                        value={session.name}
                        onChange={(e) =>
                          updateSession(session.id, { name: e.target.value })
                        }
                        placeholder="Ex: J1 : Squat"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jour de la semaine</Label>
                      <Input
                        type="number"
                        min="1"
                        max="7"
                        value={session.dayOfWeek}
                        onChange={(e) =>
                          updateSession(session.id, {
                            dayOfWeek: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSession(session.id)}
                    className="ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sets Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exercice</TableHead>
                          <TableHead className="text-center">Séries</TableHead>
                          <TableHead className="text-center">Rép</TableHead>
                          <TableHead className="text-center">RPE</TableHead>
                          <TableHead className="text-center">Charge (kg)</TableHead>
                          <TableHead>Instructions</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {session.sets.map((set) => (
                          <TableRow key={set.id}>
                            <TableCell>
                              <Select
                                value={set.exerciseId}
                                onValueChange={(value) =>
                                  updateSet(session.id, set.id, {
                                    exerciseId: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un exercice" />
                                </SelectTrigger>
                                <SelectContent>
                                  {exercises.map((ex) => (
                                    <SelectItem key={ex.id} value={ex.id}>
                                      {ex.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={set.setOrder}
                                onChange={(e) =>
                                  updateSet(session.id, set.id, {
                                    setOrder: parseInt(e.target.value),
                                  })
                                }
                                className="text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={set.reps}
                                onChange={(e) =>
                                  updateSet(session.id, set.id, {
                                    reps: parseInt(e.target.value),
                                  })
                                }
                                className="text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                value={set.rpe}
                                onChange={(e) =>
                                  updateSet(session.id, set.id, {
                                    rpe: parseFloat(e.target.value),
                                  })
                                }
                                className="text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.5"
                                value={set.prescribedWeight || ""}
                                onChange={(e) =>
                                  updateSet(session.id, set.id, {
                                    prescribedWeight: parseFloat(
                                      e.target.value
                                    ),
                                  })
                                }
                                placeholder="Auto"
                                className="text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={set.instructions}
                                onChange={(e) =>
                                  updateSet(session.id, set.id, {
                                    instructions: e.target.value,
                                  })
                                }
                                placeholder="Notes..."
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeSet(session.id, set.id)
                                }
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSet(session.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un exercice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Session Button */}
        <div className="mt-6">
          <Button onClick={addSession} variant="outline" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une séance
          </Button>
        </div>
      </main>
    </div>
  );
}
