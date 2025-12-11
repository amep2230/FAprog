-- ============================================
-- MODULE NUTRITION
-- Gestion des profils nutritionnels et génération de repas
-- ============================================

-- 1. ENUMS pour la standardisation
-- ============================================
CREATE TYPE activity_level_enum AS ENUM (
    'sedentary',      -- Peu ou pas d'exercice
    'lightly_active', -- Exercice léger 1-3 jours/semaine
    'moderately_active', -- Exercice modéré 3-5 jours/semaine
    'very_active',    -- Exercice intense 6-7 jours/semaine
    'extra_active'    -- Exercice très intense + travail physique
);

CREATE TYPE diet_goal_enum AS ENUM (
    'weight_loss',    -- Perte de poids
    'maintenance',    -- Maintien
    'muscle_gain'     -- Prise de masse
);

CREATE TYPE meal_type_enum AS ENUM (
    'breakfast',
    'lunch',
    'dinner',
    'snack_1',
    'snack_2',
    'pre_workout',
    'post_workout'
);

-- 2. TABLE: nutrition_profiles
-- Stocke les données physiologiques, préférences et objectifs calculés
-- Relation 1:1 avec la table profiles existante
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Données physiologiques (Onboarding)
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    activity_level activity_level_enum NOT NULL DEFAULT 'moderately_active',
    goal diet_goal_enum NOT NULL DEFAULT 'maintenance',
    
    -- Préférences alimentaires (JSONB pour flexibilité)
    -- Structure attendue: { 
    --   "is_vegetarian": boolean, 
    --   "is_vegan": boolean, 
    --   "allergies": ["peanuts", "shellfish"], 
    --   "intolerances": ["lactose", "gluten"],
    --   "excluded_ingredients": ["pork", "cilantro"]
    -- }
    dietary_preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Objectifs calculés (Le système mettra à jour ces champs)
    target_calories INTEGER,
    target_protein_g INTEGER,
    target_carbs_g INTEGER,
    target_fats_g INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 3. TABLE: nutrition_daily_plans
-- Le plan pour une journée spécifique.
-- Permet de garder un historique si les objectifs changent.
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_daily_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Snapshot des objectifs pour cette journée précise
    target_calories INTEGER,
    target_macros JSONB, -- { "protein": 150, "carbs": 200, "fats": 60 }
    
    -- État de la journée
    is_generated BOOLEAN DEFAULT false, -- Si l'IA a déjà proposé des repas
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- 4. TABLE: nutrition_meals
-- Les repas spécifiques proposés par l'IA ou ajoutés par l'utilisateur
-- ============================================
CREATE TABLE IF NOT EXISTS nutrition_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_plan_id UUID NOT NULL REFERENCES nutrition_daily_plans(id) ON DELETE CASCADE,
    
    meal_type meal_type_enum NOT NULL,
    name TEXT NOT NULL, -- ex: "Poulet Basquaise et Riz"
    description TEXT, -- Liste des ingrédients ou instructions courtes
    
    -- Macros spécifiques de ce repas
    calories INTEGER,
    protein_g INTEGER,
    carbs_g INTEGER,
    fats_g INTEGER,
    
    -- Statut
    is_eaten BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES pour la performance
CREATE INDEX idx_nutrition_profiles_user ON nutrition_profiles(user_id);
CREATE INDEX idx_nutrition_daily_plans_user_date ON nutrition_daily_plans(user_id, date);
CREATE INDEX idx_nutrition_meals_plan ON nutrition_meals(daily_plan_id);

-- RLS (Row Level Security)
-- ============================================
ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_meals ENABLE ROW LEVEL SECURITY;

-- Policies (Exemple simple: l'utilisateur voit ses propres données)
CREATE POLICY "Users can view own nutrition profile" ON nutrition_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition profile" ON nutrition_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition profile" ON nutrition_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- (Similaire pour daily_plans et meals...)
