"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Dumbbell, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SessionLogger from "./SessionLogger";

interface ProgramDetailViewProps {
  program: any;
  sessionLogs: any[];
  athleteId: string;
}

export default function ProgramDetailView({
  program,
  sessionLogs,
  athleteId,
}: ProgramDetailViewProps) {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isLogging, setIsLogging] = useState(false);

  // Grouper les logs par session_id pour faciliter la vérification
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
    // Rafraîchir la page pour voir les nouvelles données
    window.location.reload();
  };

  // Trier les sessions par jour de la semaine
  const sortedSessions = [...program.sessions].sort(
    (a, b) => a.day_of_week - b.day_of_week
  );

  const dayNames = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/athlete">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
              <p className="text-gray-500">
                Semaine {program.week_number}
                {program.coach && <> • Coach: {program.coach.name}</>}
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{sortedSessions.length}</p>
                <p className="text-sm text-gray-600">Séances</p>
              </div>
              <div>
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold">{sessionLogs.length}</p>
                <p className="text-sm text-gray-600">Complétées</p>
              </div>
              <div>
                <Dumbbell className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold">
                  {sortedSessions.reduce((sum: number, s: any) => sum + s.sets.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Exercices total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Séances</h2>
          {sortedSessions.map((session) => {
            const isCompleted = !!logsBySession[session.id];
            const lastLog = logsBySession[session.id];

            return (
              <Card
                key={session.id}
                className={isCompleted ? "border-green-500 border-2" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                      <div>
                        <CardTitle className="text-xl">
                          {dayNames[session.day_of_week]} - {session.name}
                        </CardTitle>
                        {isCompleted && lastLog && (
                          <p className="text-sm text-green-600 mt-1">
                            Complété le{" "}
                            {new Date(lastLog.completed_at).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartLogging(session)}
                      variant={isCompleted ? "outline" : "default"}
                    >
                      {isCompleted ? "Re-logger" : "Logger la séance"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {session.sets.map((set: any, idx: number) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-700">
                            {idx + 1}.
                          </span>
                          <div>
                            <p className="font-medium">{set.exercise.name}</p>
                            <p className="text-sm text-gray-600">
                              {set.reps} reps @ RPE {set.rpe}
                              {set.prescribed_weight && (
                                <span className="ml-2">• {set.prescribed_weight} kg</span>
                              )}
                            </p>
                            {set.instructions && (
                              <p className="text-xs text-gray-500 mt-1">{set.instructions}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
