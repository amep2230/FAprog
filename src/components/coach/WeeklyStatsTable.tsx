"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WeeklyStatsProps {
  sessionLogs: any[];
}

interface ExerciseStats {
  [exerciseName: string]: {
    series: number;
    maxWeight: number;
    tonnage: number;
    rpeTotal: number;
    rpeCount: number;
    estimated1RM: number;
  };
}

interface WeekData {
  [week: string]: ExerciseStats;
}

export default function WeeklyStatsTable({ sessionLogs }: WeeklyStatsProps) {
  // Calculer les statistiques par semaine et par exercice
  const { weeklyData, allExercises, weeks } = useMemo(() => {
    const data: WeekData = {};
    const exercisesSet = new Set<string>();

    sessionLogs.forEach((log: any) => {
      const weekKey = `S${log.session?.program?.week_number || 1}`;

      if (!data[weekKey]) {
        data[weekKey] = {};
      }

      log.set_logs?.forEach((setLog: any) => {
        const exerciseName = setLog.set?.exercise?.name || "Inconnu";
        exercisesSet.add(exerciseName);

        if (!data[weekKey][exerciseName]) {
          data[weekKey][exerciseName] = {
            series: 0,
            maxWeight: 0,
            tonnage: 0,
            rpeTotal: 0,
            rpeCount: 0,
            estimated1RM: 0,
          };
        }

        const stats = data[weekKey][exerciseName];
        stats.series += 1;
        stats.maxWeight = Math.max(stats.maxWeight, setLog.actual_weight || 0);
        stats.tonnage += (setLog.actual_weight || 0) * (setLog.actual_reps || 0);

        if (setLog.actual_rpe) {
          stats.rpeTotal += setLog.actual_rpe;
          stats.rpeCount += 1;
        }

        // Utiliser Epley pour estimer le 1RM
        if (setLog.actual_weight && setLog.actual_reps) {
          const weight = setLog.actual_weight;
          const reps = setLog.actual_reps;
          const estimated1RM = weight * (1 + reps / 30);
          stats.estimated1RM = Math.max(stats.estimated1RM, estimated1RM);
        }
      });
    });

    const sortedExercises = Array.from(exercisesSet).sort();
    const sortedWeeks = Object.keys(data).sort();

    return {
      weeklyData: data,
      allExercises: sortedExercises,
      weeks: sortedWeeks,
    };
  }, [sessionLogs]);

  const mainLifts = [
    "Squat",
    "Bench Press",
    "Deadlift",
    "Squat Parallèles",
    "Bench Press Incliné",
  ].filter((lift) => allExercises.some((ex) => ex.toLowerCase().includes(lift.toLowerCase())));

  const accessories = allExercises.filter((ex) => !mainLifts.includes(ex));

  if (weeks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune donnée d'entraînement disponible</p>
      </div>
    );
  }

  const getRowColor = (exercise: string) => {
    if (exercise.toLowerCase().includes("squat")) return "bg-pink-100";
    if (exercise.toLowerCase().includes("bench")) return "bg-blue-100";
    return "bg-purple-100";
  };

  return (
    <div className="space-y-8">
      {/* Table: Nombre de séries */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mr-2">
            Nombre de séries
          </span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 text-white">
              <TableHead className="text-left text-white">Mouvement</TableHead>
              {weeks.map((week) => (
                <TableHead key={week} className="text-center text-white">
                  {week}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mainLifts.map((exercise) => (
              <TableRow key={exercise} className={getRowColor(exercise)}>
                <TableCell className="font-medium">{exercise}</TableCell>
                {weeks.map((week) => (
                  <TableCell key={week} className="text-center">
                    {weeklyData[week]?.[exercise]?.series || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {accessories.slice(0, 10).map((exercise) => (
              <TableRow key={exercise} className="hover:bg-gray-50">
                <TableCell>{exercise}</TableCell>
                {weeks.map((week) => (
                  <TableCell key={week} className="text-center">
                    {weeklyData[week]?.[exercise]?.series || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Table: Max effectués */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mr-2">
            Max effectués
          </span>
          <span className="text-sm text-gray-500 ml-2">(kg)</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 text-white">
              <TableHead className="text-left text-white">Mouvement</TableHead>
              {weeks.map((week) => (
                <TableHead key={week} className="text-center text-white">
                  {week}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mainLifts.map((exercise) => (
              <TableRow key={exercise} className={getRowColor(exercise)}>
                <TableCell className="font-medium">{exercise}</TableCell>
                {weeks.map((week) => (
                  <TableCell key={week} className="text-center font-semibold">
                    {weeklyData[week]?.[exercise]?.maxWeight
                      ? weeklyData[week][exercise].maxWeight.toFixed(1)
                      : "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {accessories.slice(0, 10).map((exercise) => (
              <TableRow key={exercise} className="hover:bg-gray-50">
                <TableCell>{exercise}</TableCell>
                {weeks.map((week) => (
                  <TableCell key={week} className="text-center">
                    {weeklyData[week]?.[exercise]?.maxWeight
                      ? weeklyData[week][exercise].maxWeight.toFixed(1)
                      : "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Table: Tonnage */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm mr-2">
            Tonnage
          </span>
          <span className="text-sm text-gray-500 ml-2">(kg total)</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 text-white">
              <TableHead className="text-left text-white">Mouvement</TableHead>
              {weeks.map((week) => (
                <TableHead key={week} className="text-center text-white">
                  {week}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mainLifts.map((exercise) => (
              <TableRow key={exercise} className={getRowColor(exercise)}>
                <TableCell className="font-medium">{exercise}</TableCell>
                {weeks.map((week) => (
                  <TableCell key={week} className="text-center font-semibold">
                    {weeklyData[week]?.[exercise]?.tonnage
                      ? Math.round(weeklyData[week][exercise].tonnage).toLocaleString()
                      : "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Table: RPE moyen */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm mr-2">
            RPE moyen
          </span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 text-white">
              <TableHead className="text-left text-white">Mouvement</TableHead>
              {weeks.map((week) => (
                <TableHead key={week} className="text-center text-white">
                  {week}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mainLifts.map((exercise) => (
              <TableRow key={exercise} className={getRowColor(exercise)}>
                <TableCell className="font-medium">{exercise}</TableCell>
                {weeks.map((week) => {
                  const stats = weeklyData[week]?.[exercise];
                  const avgRPE = stats && stats.rpeCount > 0 ? stats.rpeTotal / stats.rpeCount : null;
                  return (
                    <TableCell key={week} className="text-center">
                      {avgRPE ? avgRPE.toFixed(1) : "-"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Table: 1RM théorique */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm mr-2">
            Max théorique (1RM estimé)
          </span>
          <span className="text-sm text-gray-500 ml-2">(kg)</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800 text-white">
              <TableHead className="text-left text-white">1RM</TableHead>
              {weeks.map((week) => (
                <TableHead key={week} className="text-center text-white">
                  {week}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mainLifts.map((exercise) => (
              <TableRow key={exercise} className={getRowColor(exercise)}>
                <TableCell className="font-medium">{exercise}</TableCell>
                {weeks.map((week) => (
                  <TableCell key={week} className="text-center font-semibold">
                    {weeklyData[week]?.[exercise]?.estimated1RM
                      ? weeklyData[week][exercise].estimated1RM.toFixed(1)
                      : "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow className="bg-gray-200 font-bold">
              <TableCell className="font-bold">Total SBD</TableCell>
              {weeks.map((week) => {
                const total = mainLifts.reduce((sum, exercise) => {
                  return sum + (weeklyData[week]?.[exercise]?.estimated1RM || 0);
                }, 0);
                return (
                  <TableCell key={week} className="text-center font-bold">
                    {total > 0 ? total.toFixed(1) : "-"}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
