"use client";

import { useState } from "react";
import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, User, Dumbbell, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
import AddAthleteDialog from "./AddAthleteDialog";
import AthleteCard from "./AthleteCard";

interface CoachDashboardProps {
  coach: Profile;
  athletes: Profile[];
}

export default function CoachDashboard({
  coach,
  athletes: initialAthletes,
}: CoachDashboardProps) {
  const [athletes, setAthletes] = useState(initialAthletes);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddAthlete = (newAthlete: Profile) => {
    setAthletes([...athletes, newAthlete]);
    setShowAddDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Dumbbell className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  PowerCoach
                </h1>
                <p className="text-sm text-gray-500">Dashboard Coach</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{coach.name}</p>
                <p className="text-xs text-gray-500">{coach.email}</p>
              </div>
              <form action={signOut}>
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Athlètes</CardDescription>
              <CardTitle className="text-3xl">{athletes.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Programmes actifs</CardDescription>
              <CardTitle className="text-3xl">-</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Séances cette semaine</CardDescription>
              <CardTitle className="text-3xl">-</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Athletes Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mes Athlètes</CardTitle>
                <CardDescription>
                  Gérez vos athlètes et leurs programmes
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un athlète
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {athletes.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun athlète
                </h3>
                <p className="text-gray-500 mb-4">
                  Commencez par ajouter votre premier athlète
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un athlète
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {athletes.map((athlete) => (
                  <AthleteCard key={athlete.id} athlete={athlete} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Athlete Dialog */}
      {showAddDialog && (
        <AddAthleteDialog
          coachId={coach.id}
          onClose={() => setShowAddDialog(false)}
          onSuccess={handleAddAthlete}
        />
      )}
    </div>
  );
}
