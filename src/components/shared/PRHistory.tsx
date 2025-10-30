"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo } from "react";
import AddPRDialog from "./AddPRDialog";

interface PRHistoryProps {
  personalRecords: any[];
  athleteId?: string;
  exercises?: Array<{ id: string; name: string; category: string }>;
}

export default function PRHistory({ personalRecords, athleteId, exercises }: PRHistoryProps) {
  // Grouper les PRs par exercice et calculer la progression
  const prsByExercise = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    personalRecords.forEach((pr: any) => {
      const exerciseName = pr.exercise?.name || "Unknown";
      if (!grouped[exerciseName]) {
        grouped[exerciseName] = [];
      }
      grouped[exerciseName].push(pr);
    });

    // Trier chaque groupe par date décroissante
    Object.keys(grouped).forEach((exerciseName) => {
      grouped[exerciseName].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    return grouped;
  }, [personalRecords]);

  // Calculer la progression pour un exercice
  const getProgression = (prs: any[]) => {
    if (prs.length < 2) return { type: "none", value: 0 };

    const latest = prs[0].weight;
    const previous = prs[1].weight;
    const diff = latest - previous;
    const percentage = ((diff / previous) * 100).toFixed(1);

    if (diff > 0) {
      return { type: "up", value: `+${diff}kg (+${percentage}%)` };
    } else if (diff < 0) {
      return { type: "down", value: `${diff}kg (${percentage}%)` };
    } else {
      return { type: "none", value: "=" };
    }
  };

  if (personalRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Records Personnels
            </CardTitle>
            {athleteId && exercises && (
              <AddPRDialog athleteId={athleteId} exercises={exercises} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Aucun record personnel enregistré
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Records Personnels
          </CardTitle>
          {athleteId && exercises && (
            <AddPRDialog athleteId={athleteId} exercises={exercises} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercice</TableHead>
              <TableHead>Record actuel</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(prsByExercise).map(([exerciseName, prs]) => {
              const latestPR = prs[0];
              const progression = getProgression(prs);

              return (
                <TableRow key={exerciseName}>
                  <TableCell className="font-medium">{exerciseName}</TableCell>
                  <TableCell>
                    <span className="text-lg font-bold">{latestPR.weight} kg</span>
                  </TableCell>
                  <TableCell>
                    {new Date(latestPR.date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {progression.type === "up" && (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">{progression.value}</span>
                        </>
                      )}
                      {progression.type === "down" && (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">{progression.value}</span>
                        </>
                      )}
                      {progression.type === "none" && (
                        <>
                          <Minus className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-400">
                            {prs.length === 1 ? "Premier PR" : "Identique"}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {latestPR.notes || "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Historique détaillé par exercice */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Historique détaillé</h3>
          {Object.entries(prsByExercise).map(([exerciseName, prs]) => (
            <Card key={exerciseName} className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{exerciseName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prs.map((pr: any, idx: number) => (
                    <div
                      key={pr.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">
                        {new Date(pr.date).toLocaleDateString("fr-FR")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pr.weight} kg</span>
                        {idx === 0 && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">
                            Actuel
                          </span>
                        )}
                      </div>
                      {pr.notes && (
                        <span className="text-gray-500 text-xs italic">
                          {pr.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
