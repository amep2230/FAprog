"use client";

import { useMemo } from "react";

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

        // Compter les séries
        stats.series++;

        // Max weight
        if (setLog.actual_weight && setLog.actual_weight > stats.maxWeight) {
          stats.maxWeight = setLog.actual_weight;
        }

        // Tonnage
        if (setLog.actual_weight && setLog.actual_reps) {
          stats.tonnage += setLog.actual_weight * setLog.actual_reps;
        }

        // RPE
        if (setLog.actual_rpe) {
          stats.rpeTotal += setLog.actual_rpe;
          stats.rpeCount++;
        }

        // Estimated 1RM (formule Epley: weight * (1 + reps/30))
        if (setLog.actual_weight && setLog.actual_reps) {
          const estimated = setLog.actual_weight * (1 + setLog.actual_reps / 30);
          if (estimated > stats.estimated1RM) {
            stats.estimated1RM = estimated;
          }
        }
      });
    });

    const sortedWeeks = Object.keys(data).sort((a, b) => {
      const numA = parseInt(a.replace("S", ""));
      const numB = parseInt(b.replace("S", ""));
      return numA - numB;
    });

    return {
      weeklyData: data,
      allExercises: Array.from(exercisesSet).sort(),
      weeks: sortedWeeks,
    };
  }, [sessionLogs]);

  // Grouper les exercices par catégorie
  const mainLifts = allExercises.filter((ex) =>
    ex.toLowerCase().includes("squat") ||
    ex.toLowerCase().includes("bench") ||
    ex.toLowerCase().includes("deadlift")
  );
  const accessories = allExercises.filter((ex) => !mainLifts.includes(ex));

  if (weeks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune donnée d'entraînement disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tableau: Nombre de séries */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mr-2">
            Nombre de séries
          </span>
        </h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-300 px-4 py-2 text-left">Mouvement</th>
              {weeks.map((week) => (
                <th key={week} className="border border-gray-300 px-4 py-2 text-center">
                  {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mainLifts.map((exercise, idx) => (
              <tr
                key={exercise}
                className={
                  exercise.toLowerCase().includes("squat")
                    ? "bg-pink-100"
                    : exercise.toLowerCase().includes("bench")
                    ? "bg-blue-100"
                    : "bg-purple-100"
                }
              >
                <td className="border border-gray-300 px-4 py-2 font-medium">{exercise}</td>
                {weeks.map((week) => (
                  <td key={week} className="border border-gray-300 px-4 py-2 text-center">
                    {weeklyData[week]?.[exercise]?.series || "-"}
                  </td>
                ))}
              </tr>
            ))}
            {accessories.slice(0, 10).map((exercise) => (
              <tr key={exercise} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{exercise}</td>
                {weeks.map((week) => (
                  <td key={week} className="border border-gray-300 px-4 py-2 text-center">
                    {weeklyData[week]?.[exercise]?.series || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tableau: Max effectués */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mr-2">
            Max effectués
          </span>
          <span className="text-sm text-gray-500 ml-2">(kg)</span>
        </h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-300 px-4 py-2 text-left">Mouvement</th>
              {weeks.map((week) => (
                <th key={week} className="border border-gray-300 px-4 py-2 text-center">
                  {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mainLifts.map((exercise) => (
              <tr
                key={exercise}
                className={
                  exercise.toLowerCase().includes("squat")
                    ? "bg-pink-100"
                    : exercise.toLowerCase().includes("bench")
                    ? "bg-blue-100"
                    : "bg-purple-100"
                }
              >
                <td className="border border-gray-300 px-4 py-2 font-medium">{exercise}</td>
                {weeks.map((week) => (
                  <td key={week} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {weeklyData[week]?.[exercise]?.maxWeight
                      ? weeklyData[week][exercise].maxWeight.toFixed(1)
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
            {accessories.slice(0, 10).map((exercise) => (
              <tr key={exercise} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{exercise}</td>
                {weeks.map((week) => (
                  <td key={week} className="border border-gray-300 px-4 py-2 text-center">
                    {weeklyData[week]?.[exercise]?.maxWeight
                      ? weeklyData[week][exercise].maxWeight.toFixed(1)
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tableau: Tonnage */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm mr-2">
            Tonnage
          </span>
          <span className="text-sm text-gray-500 ml-2">(kg total)</span>
        </h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-300 px-4 py-2 text-left">Mouvement</th>
              {weeks.map((week) => (
                <th key={week} className="border border-gray-300 px-4 py-2 text-center">
                  {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mainLifts.map((exercise) => (
              <tr
                key={exercise}
                className={
                  exercise.toLowerCase().includes("squat")
                    ? "bg-pink-100"
                    : exercise.toLowerCase().includes("bench")
                    ? "bg-blue-100"
                    : "bg-purple-100"
                }
              >
                <td className="border border-gray-300 px-4 py-2 font-medium">{exercise}</td>
                {weeks.map((week) => (
                  <td key={week} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {weeklyData[week]?.[exercise]?.tonnage
                      ? Math.round(weeklyData[week][exercise].tonnage).toLocaleString()
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tableau: RPE moyen */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm mr-2">
            RPE moyen
          </span>
        </h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-300 px-4 py-2 text-left">Mouvement</th>
              {weeks.map((week) => (
                <th key={week} className="border border-gray-300 px-4 py-2 text-center">
                  {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mainLifts.map((exercise) => (
              <tr
                key={exercise}
                className={
                  exercise.toLowerCase().includes("squat")
                    ? "bg-pink-100"
                    : exercise.toLowerCase().includes("bench")
                    ? "bg-blue-100"
                    : "bg-purple-100"
                }
              >
                <td className="border border-gray-300 px-4 py-2 font-medium">{exercise}</td>
                {weeks.map((week) => {
                  const stats = weeklyData[week]?.[exercise];
                  const avgRPE = stats && stats.rpeCount > 0 ? stats.rpeTotal / stats.rpeCount : null;
                  return (
                    <td key={week} className="border border-gray-300 px-4 py-2 text-center">
                      {avgRPE ? avgRPE.toFixed(1) : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tableau: 1RM théorique */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm mr-2">
            Max théorique (1RM estimé)
          </span>
          <span className="text-sm text-gray-500 ml-2">(kg)</span>
        </h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-300 px-4 py-2 text-left">1RM</th>
              {weeks.map((week) => (
                <th key={week} className="border border-gray-300 px-4 py-2 text-center">
                  {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mainLifts.map((exercise) => (
              <tr
                key={exercise}
                className={
                  exercise.toLowerCase().includes("squat")
                    ? "bg-pink-100"
                    : exercise.toLowerCase().includes("bench")
                    ? "bg-blue-100"
                    : "bg-purple-100"
                }
              >
                <td className="border border-gray-300 px-4 py-2 font-medium">{exercise}</td>
                {weeks.map((week) => (
                  <td key={week} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                    {weeklyData[week]?.[exercise]?.estimated1RM
                      ? weeklyData[week][exercise].estimated1RM.toFixed(1)
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-gray-200 font-bold">
              <td className="border border-gray-300 px-4 py-2">Total SBD</td>
              {weeks.map((week) => {
                const total = mainLifts.reduce((sum, exercise) => {
                  return sum + (weeklyData[week]?.[exercise]?.estimated1RM || 0);
                }, 0);
                return (
                  <td key={week} className="border border-gray-300 px-4 py-2 text-center">
                    {total > 0 ? total.toFixed(1) : "-"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
