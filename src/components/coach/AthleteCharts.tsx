"use client";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

interface ChartsProps {
  sessionLogs: any[];
}

const COLORS = {
  squat: "#EC4899",    // Pink
  bench: "#3B82F6",    // Blue
  deadlift: "#A855F7", // Purple
};

export default function AthleteCharts({ sessionLogs }: ChartsProps) {
  // Calculer les données pour le graphique de tonnage
  const tonnageData = useMemo(() => {
    const weeklyTonnage: { [week: string]: { week: string; Squat: number; Bench: number; Deadlift: number } } = {};

    sessionLogs.forEach((log: any) => {
      const weekKey = `S${log.session?.program?.week_number || 1}`;

      if (!weeklyTonnage[weekKey]) {
        weeklyTonnage[weekKey] = { week: weekKey, Squat: 0, Bench: 0, Deadlift: 0 };
      }

      log.set_logs?.forEach((setLog: any) => {
        const exerciseName = setLog.set?.exercise?.name?.toLowerCase() || "";
        const tonnage =
          setLog.actual_weight && setLog.actual_reps
            ? setLog.actual_weight * setLog.actual_reps
            : 0;

        if (exerciseName.includes("squat")) {
          weeklyTonnage[weekKey].Squat += tonnage;
        } else if (exerciseName.includes("bench")) {
          weeklyTonnage[weekKey].Bench += tonnage;
        } else if (exerciseName.includes("deadlift")) {
          weeklyTonnage[weekKey].Deadlift += tonnage;
        }
      });
    });

    return Object.values(weeklyTonnage).sort((a, b) => {
      const numA = parseInt(a.week.replace("S", ""));
      const numB = parseInt(b.week.replace("S", ""));
      return numA - numB;
    });
  }, [sessionLogs]);

  // Calculer les données pour le camembert (répartition des max)
  const maxDistribution = useMemo(() => {
    let squatMax = 0;
    let benchMax = 0;
    let deadliftMax = 0;

    sessionLogs.forEach((log: any) => {
      log.set_logs?.forEach((setLog: any) => {
        const exerciseName = setLog.set?.exercise?.name?.toLowerCase() || "";
        const weight = setLog.actual_weight || 0;

        if (exerciseName.includes("squat") && weight > squatMax) {
          squatMax = weight;
        } else if (exerciseName.includes("bench") && weight > benchMax) {
          benchMax = weight;
        } else if (exerciseName.includes("deadlift") && weight > deadliftMax) {
          deadliftMax = weight;
        }
      });
    });

    const total = squatMax + benchMax + deadliftMax;

    if (total === 0) return [];

    return [
      { name: "Squat", value: squatMax, percentage: ((squatMax / total) * 100).toFixed(1) },
      { name: "Bench", value: benchMax, percentage: ((benchMax / total) * 100).toFixed(1) },
      { name: "Deadlift", value: deadliftMax, percentage: ((deadliftMax / total) * 100).toFixed(1) },
    ];
  }, [sessionLogs]);

  if (sessionLogs.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique de tonnage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Évolution du tonnage</CardTitle>
        </CardHeader>
        <CardContent>
          {tonnageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tonnageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickLine={{ stroke: "#9ca3af" }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickLine={{ stroke: "#9ca3af" }}
                  label={{ value: "Tonnage (kg)", angle: -90, position: "insideLeft", fill: "#6b7280" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                  formatter={(value: number) => `${Math.round(value).toLocaleString()} kg`}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="Squat"
                  stroke={COLORS.squat}
                  strokeWidth={2}
                  dot={{ fill: COLORS.squat, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Bench"
                  stroke={COLORS.bench}
                  strokeWidth={2}
                  dot={{ fill: COLORS.bench, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Deadlift"
                  stroke={COLORS.deadlift}
                  strokeWidth={2}
                  dot={{ fill: COLORS.deadlift, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Pas encore de données de tonnage
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camembert de répartition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition des maxs</CardTitle>
        </CardHeader>
        <CardContent>
          {maxDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maxDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {maxDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "Squat"
                          ? COLORS.squat
                          : entry.name === "Bench"
                          ? COLORS.bench
                          : COLORS.deadlift
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)} kg`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Pas encore de données de max
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
