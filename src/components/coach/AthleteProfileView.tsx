"use client";

import { Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, TrendingUp, Award, BarChart3, FolderKanban, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import WeeklyStatsTable from "./WeeklyStatsTable";
import AthleteCharts from "./AthleteCharts";
import AddPRDialog from "@/components/shared/AddPRDialog";
import PRHistory from "@/components/shared/PRHistory";

interface AthleteProfileViewProps {
  athlete: Profile;
  programs: any[];
  personalRecords: any[];
  sessionLogs: any[];
  exercises: Array<{ id: string; name: string; category: string }>;
  currentWeek: any;
  activeBlock: any;
}

export default function AthleteProfileView({
  athlete,
  programs,
  personalRecords,
  sessionLogs,
  exercises,
  currentWeek,
  activeBlock,
}: AthleteProfileViewProps) {
  // Calculer les statistiques
  const stats = useMemo(() => {
    // Calculer le nombre total de séances complétées
    const totalSessions = sessionLogs.length;

    // Calculer le tonnage total
    let totalTonnage = 0;
    sessionLogs.forEach((log: any) => {
      log.set_logs?.forEach((setLog: any) => {
        if (setLog.actual_weight && setLog.actual_reps) {
          totalTonnage += setLog.actual_weight * setLog.actual_reps;
        }
      });
    });

    // Trouver les meilleurs 1RM pour les 3 mouvements principaux
    // On cherche le meilleur estimated_1rm (pas forcément avec 1 rep)
    const squatPRs = personalRecords.filter(
      (pr: any) => pr.exercise?.name?.toLowerCase().includes("squat")
    );
    const squat1RM = squatPRs.length > 0
      ? Math.max(...squatPRs.map((pr: any) => pr.estimated_1rm || 0))
      : 0;

    const benchPRs = personalRecords.filter(
      (pr: any) => pr.exercise?.name?.toLowerCase().includes("bench")
    );
    const bench1RM = benchPRs.length > 0
      ? Math.max(...benchPRs.map((pr: any) => pr.estimated_1rm || 0))
      : 0;

    const deadliftPRs = personalRecords.filter(
      (pr: any) => pr.exercise?.name?.toLowerCase().includes("deadlift")
    );
    const deadlift1RM = deadliftPRs.length > 0
      ? Math.max(...deadliftPRs.map((pr: any) => pr.estimated_1rm || 0))
      : 0;

    const total = squat1RM + bench1RM + deadlift1RM;

    return {
      totalSessions,
      totalTonnage: Math.round(totalTonnage),
      squat1RM,
      bench1RM,
      deadlift1RM,
      total,
    };
  }, [sessionLogs, personalRecords]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/coach">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{athlete.name}</h1>
              <p className="text-gray-500">{athlete.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <AddPRDialog
              athleteId={athlete.id}
              exercises={exercises}
            />
            <Link href={`/dashboard/coach/athletes/${athlete.id}/personal-records`}>
              <Button variant="outline">
                <Dumbbell className="mr-2 h-4 w-4" />
                Gérer les PR
              </Button>
            </Link>
            <Link href={`/dashboard/coach/athletes/${athlete.id}/blocks`}>
              <Button>
                <FolderKanban className="mr-2 h-4 w-4" />
                Gérer les blocs
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Séances complétées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stats.totalSessions}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Tonnage total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stats.totalTonnage.toLocaleString()}</span>
                <span className="text-sm text-gray-500">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-pink-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Squat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-pink-600" />
                <span className="text-2xl font-bold">{stats.squat1RM}</span>
                <span className="text-sm text-gray-500">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bench</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{stats.bench1RM}</span>
                <span className="text-sm text-gray-500">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Deadlift</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{stats.deadlift1RM}</span>
                <span className="text-sm text-gray-500">kg</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total SBD */}
        <Card className="bg-gradient-to-r from-purple-100 to-pink-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total SBD</p>
                <p className="text-4xl font-bold text-gray-900">{stats.total} kg</p>
              </div>
              <BarChart3 className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Semaine en cours */}
        {currentWeek && activeBlock && (
          <Card className="border-2 border-blue-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentWeek.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Bloc: {activeBlock.name} • Semaine {currentWeek.week_number}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentWeek.sessions.filter((s: any) => s.completed).length}/{currentWeek.sessions.length}
                  </div>
                  <div className="text-xs text-gray-500">séances complétées</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {currentWeek.sessions
                  .sort((a: any, b: any) => a.session_number - b.session_number)
                  .map((session: any) => {
                    const completionRate = session.completed ? 100 : 0;
                    
                    return (
                      <div 
                        key={session.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          session.completed 
                            ? 'bg-green-50 border-green-300' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                                session.completed 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-400 text-white'
                              }`}>
                                {session.session_number}
                              </div>
                              <h4 className="font-semibold text-base">{session.name}</h4>
                              {session.completed && (
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                  ✓ Complété
                                </span>
                              )}
                            </div>
                            {session.completed && session.completed_at && (
                              <p className="text-xs text-gray-600">
                                {new Date(session.completed_at).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {session.sets.length} exercice{session.sets.filter((s: any, i: number, arr: any[]) => 
                                i === 0 || arr[i-1].exercise_name !== s.exercise_name
                              ).length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        
                        {/* Exercices de la session */}
                        <div className="space-y-2">
                          {Array.from(new Set(session.sets.map((s: any) => s.exercise_name))).map((exerciseName: any) => {
                            const exerciseSets = session.sets.filter((s: any) => s.exercise_name === exerciseName);
                            return (
                              <div key={exerciseName} className="text-sm pl-8 border-l-2 border-gray-300">
                                <span className="font-medium text-gray-700">{exerciseName}</span>
                                <span className="text-gray-500 ml-2">• {exerciseSets.length} série{exerciseSets.length > 1 ? 's' : ''}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Notes de l'athlète */}
                        {session.log_notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Commentaire de l'athlète :</p>
                            <p className="text-sm text-gray-700 italic bg-white p-2 rounded border border-gray-200">
                              &quot;{session.log_notes}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
              
              {currentWeek.notes && !currentWeek.notes.includes("Créée automatiquement") && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium mb-1">Note du coach :</p>
                  <p className="text-sm text-blue-900">{currentWeek.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Graphiques */}
        <AthleteCharts sessionLogs={sessionLogs} />

        {/* Records Personnels */}
        <PRHistory personalRecords={personalRecords} />

        {/* Tableaux de données détaillées */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques détaillées par semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyStatsTable sessionLogs={sessionLogs} />
          </CardContent>
        </Card>

        {/* Programmes actifs */}
        <Card>
          <CardHeader>
            <CardTitle>Programmes</CardTitle>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun programme créé</p>
                <Link href={`/dashboard/coach/athletes/${athlete.id}/programs/new`}>
                  <Button className="mt-4">Créer le premier programme</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {programs.map((program) => (
                  <div
                    key={program.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-medium">{program.name}</h3>
                      <p className="text-sm text-gray-500">
                        Semaine {program.week_number} • Créé le{" "}
                        {new Date(program.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
