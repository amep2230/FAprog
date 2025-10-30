"use client";

import { Profile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

interface AthleteCardProps {
  athlete: Profile;
}

export default function AthleteCard({ athlete }: AthleteCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{athlete.name}</CardTitle>
              <p className="text-sm text-gray-500">{athlete.email}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Membre depuis {new Date(athlete.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <TrendingUp className="h-4 w-4 mr-2" />
          <span>Programmes actifs: 0</span>
        </div>
        <div className="pt-3 space-y-2">
          <Link href={`/dashboard/coach/athletes/${athlete.id}`}>
            <Button variant="outline" className="w-full" size="sm">
              Voir le profil
            </Button>
          </Link>
          <Link href={`/dashboard/coach/athletes/${athlete.id}/blocks`}>
            <Button className="w-full" size="sm">
              Gérer les blocs
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
