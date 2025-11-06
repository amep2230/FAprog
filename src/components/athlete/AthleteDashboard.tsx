"use client";

import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dumbbell, LogOut, Calendar, TrendingUp, Trophy } from "lucide-react";
import { signOut } from "@/app/login/actions";
import Link from "next/link";
import PRHistory from "@/components/shared/PRHistory";
import WeeklyProgramView from "./WeeklyProgramView";

interface AthleteDashboardProps {
  athlete: Profile;
  programs: any[];
  currentProgram?: any;
  sessionLogs?: any[];
  exercises: Array<{ id: string; name: string; category: string; muscle_group: string }>;
  personalRecords?: any[];
}

export default function AthleteDashboard({
  athlete,
  programs,
  currentProgram,
  sessionLogs = [],
  exercises,
  personalRecords = [],
}: AthleteDashboardProps) {
  // Calculer la séance du jour et le taux de complétion
  const today = new Date().getDay() || 7; // 0 (dimanche) devient 7
  const todaySession = currentProgram?.sessions?.find(
    (s: any) => s.day_of_week === today
  );
  
  const completedSessions = sessionLogs.length;
  const totalSessions = currentProgram?.sessions?.length || 0;
  const completionRate = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  PowerCoach
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Mon Entraînement</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Taux de complétion discret */}
              {currentProgram && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {completionRate}% complété
                  </span>
                </div>
              )}
              
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {athlete.name}
                </p>
                <p className="text-xs text-gray-500">{athlete.email}</p>
              </div>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Séance du jour - EN PREMIER PLAN */}
        {todaySession && (
          <div className="mb-6 sm:mb-8">
            <Card className="border-2 border-primary shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardDescription className="text-primary font-medium mb-1">
                      🎯 Séance du jour
                    </CardDescription>
                    <CardTitle className="text-2xl sm:text-3xl">
                      {todaySession.name}
                    </CardTitle>
                  </div>
                  <Button 
                    size="lg"
                    className="shadow-md"
                    onClick={() => {
                      // Scroll vers la séance du jour dans WeeklyProgramView
                      document.getElementById(`session-${todaySession.id}`)?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'center'
                      });
                    }}
                  >
                    <Dumbbell className="h-5 w-5 mr-2" />
                    C'est parti !
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Exercices</p>
                    <p className="text-xl font-bold text-gray-900">
                      {todaySession.sets.reduce((acc: number, set: any, idx: number, arr: any[]) => {
                        const prevExercise = idx > 0 ? arr[idx - 1].exercise.id : null;
                        return prevExercise === set.exercise.id ? acc : acc + 1;
                      }, 0)}
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Séries totales</p>
                    <p className="text-xl font-bold text-gray-900">
                      {todaySession.sets.length}
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Statut</p>
                    <p className="text-xl font-bold">
                      {sessionLogs.find((log: any) => log.session_id === todaySession.id) 
                        ? '✅' 
                        : '⏳'}
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Focus</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {todaySession.sets[0]?.exercise?.category || 'Mixte'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Programme de la semaine - Vue complète */}
        {currentProgram && (
          <div className="mb-6 sm:mb-8">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Programme de la semaine
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Vue d'ensemble complète de vos entraînements
              </p>
            </div>
            <WeeklyProgramView
              program={currentProgram}
              sessionLogs={sessionLogs}
              athleteId={athlete.id}
            />
          </div>
        )}

        {/* Programs Section - Liste complète */}
        <Card>
          <CardHeader>
            <CardTitle>Tous mes programmes</CardTitle>
            <CardDescription>
              Historique complet de vos programmes d'entraînement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun programme
                </h3>
                <p className="text-gray-500">
                  Votre coach n'a pas encore créé de programme pour vous
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {programs.map((program: any) => (
                  <Card
                    key={program.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {program.name}
                          </CardTitle>
                          <CardDescription>
                            Semaine {program.week_number} • Créé par{" "}
                            {program.coach?.name}
                          </CardDescription>
                        </div>
                        <Link
                          href={`/dashboard/athlete/programs/${program.id}`}
                        >
                          <Button>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Voir le programme
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Records Section */}
        <PRHistory 
          personalRecords={personalRecords}
          athleteId={athlete.id}
          exercises={exercises}
        />
      </main>
    </div>
  );
}
