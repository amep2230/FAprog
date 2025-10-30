"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Calendar, CheckCircle } from "lucide-react";
import { useState } from "react";
import SessionLogger from "./SessionLogger";

interface WeeklyProgramViewProps {
  program: any;
  sessionLogs: any[];
  athleteId: string;
}

export default function WeeklyProgramView({
  program,
  sessionLogs,
  athleteId,
}: WeeklyProgramViewProps) {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isLogging, setIsLogging] = useState(false);

  // Grouper les logs par session_id
  const logsBySession = sessionLogs.reduce((acc: any, log: any) => {
    acc[log.session_id] = log;
    return acc;
  }, {});

  const handleStartLogging = (session: any) => {
    setSelectedSession(session);
    setIsLogging(true);
  };

  const handleCloseLogger = () => {
    setIsLogging(false);
    setSelectedSession(null);
    window.location.reload();
  };

  // Trier les sessions par jour de la semaine
  const sortedSessions = [...program.sessions].sort(
    (a, b) => a.day_of_week - b.day_of_week
  );

  const dayNames = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{program.name}</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Semaine {program.week_number}
            </p>
          </div>
        </div>
      </div>

      {/* Affichage de toutes les séances avec exercices */}
      <div className="space-y-6">
        {sortedSessions.map((session) => {
          const isCompleted = !!logsBySession[session.id];
          const lastLog = logsBySession[session.id];

          return (
            <Card
              key={session.id}
              id={`session-${session.id}`}
              className={`${
                isCompleted
                  ? "border-green-500 border-2 bg-green-50"
                  : "border-2 border-gray-200"
              }`}
            >
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {isCompleted && (
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-lg md:text-xl break-words">
                        {dayNames[session.day_of_week]} - {session.name}
                      </CardTitle>
                      {isCompleted && lastLog && (
                        <p className="text-xs sm:text-sm text-green-600 mt-1">
                          ✓ Complété le{" "}
                          {new Date(lastLog.completed_at).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleStartLogging(session)}
                    variant={isCompleted ? "outline" : "default"}
                    className="w-full sm:w-auto sm:min-w-[140px]"
                    size="default"
                  >
                    <Dumbbell className="h-4 w-4 mr-2" />
                    {isCompleted ? "Re-logger" : "Logger"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-0 sm:px-6">
                {/* Table des exercices style Excel */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-full sm:min-w-[640px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-2 text-left font-semibold text-xs w-[35%] sm:w-40 sm:text-sm sm:px-4">
                          Exercice
                        </th>
                        <th className="border border-gray-300 px-1 py-2 text-center font-semibold text-xs w-[10%] sm:w-20 sm:text-sm sm:px-3">
                          Sér
                        </th>
                        <th className="border border-gray-300 px-1 py-2 text-center font-semibold text-xs w-[13%] sm:w-20 sm:text-sm sm:px-3">
                          Rép
                        </th>
                        <th className="border border-gray-300 px-1 py-2 text-center font-semibold text-xs w-[13%] sm:w-20 sm:text-sm sm:px-3">
                          RPE
                        </th>
                        <th className="border border-gray-300 px-1 py-2 text-center font-semibold text-xs w-[29%] sm:w-24 sm:text-sm sm:px-3">
                          Charge
                        </th>
                        <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left font-semibold text-xs sm:text-sm hidden md:table-cell">
                          Instructions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.sets.map((set: any, idx: number) => (
                        <tr
                          key={set.id}
                          className={`
                            ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                            hover:bg-blue-50 transition-colors
                          `}
                        >
                          <td className="border border-gray-300 px-2 py-2 font-medium text-xs w-[35%] sm:w-40 sm:text-sm sm:px-4 sm:py-3">
                            <div className="truncate max-w-full sm:max-w-[160px]">
                              {set.exercise.name}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-1 py-2 text-center text-xs w-[10%] sm:w-20 sm:text-sm sm:px-3 sm:py-3">
                            {idx + 1}
                          </td>
                          <td className="border border-gray-300 px-1 py-2 text-center font-semibold text-xs w-[13%] sm:w-20 sm:text-sm sm:px-3 sm:py-3">
                            {set.reps}
                          </td>
                          <td className="border border-gray-300 px-1 py-2 text-center font-semibold text-xs w-[13%] sm:w-20 sm:text-sm sm:px-3 sm:py-3">
                            {set.rpe}
                          </td>
                          <td className="border border-gray-300 px-1 py-2 text-center font-bold text-blue-600 text-xs w-[29%] sm:w-24 sm:text-sm sm:px-3 sm:py-3">
                            {set.prescribed_weight ? `${set.prescribed_weight} kg` : "-"}
                          </td>
                          <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                            {set.instructions || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Commentaires ou notes additionnels */}
                {session.notes && (
                  <div className="mt-3 sm:mt-4 mx-2 sm:mx-0">
                    <div className="p-2 sm:p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <span className="font-semibold">Note :</span> {session.notes}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de logging */}
      {isLogging && selectedSession && (
        <SessionLogger
          session={selectedSession}
          athleteId={athleteId}
          onClose={handleCloseLogger}
        />
      )}
    </div>
  );
}
