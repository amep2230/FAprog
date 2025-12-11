"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
                {/* Table des exercices */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="text-center w-[10%]">Sér</TableHead>
                        <TableHead className="text-center w-[15%]">Rép</TableHead>
                        <TableHead className="text-center w-[15%]">RPE</TableHead>
                        <TableHead className="text-center w-[20%]">Charge</TableHead>
                        <TableHead className="text-left hidden md:table-cell">Instructions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.sets
                        .sort((a: any, b: any) => (a.set_order || a.set_number || 0) - (b.set_order || b.set_number || 0))
                        .reduce((groups: any[], set: any) => {
                          const lastGroup = groups[groups.length - 1];
                          const exerciseName = set.exercise?.name || set.exercise_name || "Exercice inconnu";
                          
                          if (lastGroup && lastGroup.exerciseName === exerciseName) {
                            lastGroup.sets.push(set);
                          } else {
                            groups.push({
                              exerciseName,
                              sets: [set]
                            });
                          }
                          return groups;
                        }, [])
                        .map((group: any, groupIdx: number) => (
                          <>
                            <TableRow key={`group-${groupIdx}`} className="bg-blue-50/50">
                              <TableCell colSpan={5} className="font-bold text-sm sm:text-base py-3 text-left pl-4">
                                {group.exerciseName}
                              </TableCell>
                            </TableRow>
                            {group.sets.map((set: any, setIdx: number) => (
                              <TableRow
                                key={set.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <TableCell className="text-center text-xs sm:text-sm">
                                  {setIdx + 1}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-xs sm:text-sm">
                                  {set.reps || set.prescribed_reps}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-xs sm:text-sm">
                                  {set.rpe || set.prescribed_rpe}
                                </TableCell>
                                <TableCell className="text-center font-bold text-blue-600 text-xs sm:text-sm">
                                  {set.prescribed_weight ? `${set.prescribed_weight} kg` : "-"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                                  {set.instructions || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        ))}
                    </TableBody>
                  </Table>
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
