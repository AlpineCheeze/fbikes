-- ==============================================================================
-- PALMARES DATABASE INITIALIZATION SCRIPT
-- PostgreSQL / Supabase Schema for Fantasy Road Cycling
-- Game Mode Flagship: 3-Race Maximum Quota per rider per season
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
    CREATE TYPE league_mode AS ENUM ('rider_lockout', 'draft_league', 'salary_cap');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rider_start_status AS ENUM ('provisional', 'probable', 'confirmed', 'dns', 'dnf', 'finished');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE slot_role AS ENUM ('starter', 'alternate_1', 'alternate_2', 'alternate_3');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE race_type AS ENUM ('monument', 'world_tour_1day', 'world_tour_stage', 'grand_tour', 'pro_series');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stage_profile AS ENUM ('flat', 'hilly', 'mountain', 'individual_time_trial', 'team_time_trial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Mirrors auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    favorite_team TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. LEAGUES TABLE
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commissioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    join_code VARCHAR(8) UNIQUE NOT NULL,
    game_mode league_mode DEFAULT 'rider_lockout' NOT NULL,
    max_rider_uses INT DEFAULT 3 NOT NULL, -- Core "3-Race Max" Quota
    starters_count INT DEFAULT 8 NOT NULL, -- 8 Starters per event
    alternates_count INT DEFAULT 3 NOT NULL, -- 3 Alternates per event
    is_private BOOLEAN DEFAULT TRUE NOT NULL,
    scoring_settings JSONB DEFAULT '{
        "use_official_uci": true,
        "captain_multiplier": 1.5,
        "grand_tour_daily_stage_weight": 1.0,
        "kom_points_enabled": true,
        "sprint_points_enabled": true
    }'::JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. LEAGUE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS league_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    team_name TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('commissioner', 'member')),
    cumulative_points NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(league_id, user_id)
);

-- 6. TEAMS (UCI WorldTeams & ProTeams)
CREATE TABLE IF NOT EXISTS pro_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    uci_code VARCHAR(3) UNIQUE NOT NULL, -- e.g. UAD, TVL, IGD, SOQ, ADC, RBH
    jersey_url TEXT,
    tier TEXT DEFAULT 'WorldTeam'
);

-- 7. PRO RIDERS TABLE
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pro_team_id UUID REFERENCES pro_teams(id),
    uci_id VARCHAR(20) UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    nationality VARCHAR(3),
    specialty TEXT CHECK (specialty IN ('climber', 'sprinter', 'puncheur', 'time_trialist', 'all_rounder', 'domestique')),
    photo_url TEXT,
    current_uci_points INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. CALENDAR: RACES
CREATE TABLE IF NOT EXISTS races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    race_type race_type NOT NULL,
    season_year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    lockout_time TIMESTAMPTZ NOT NULL,
    distance_km NUMERIC(6, 1),
    elevation_gain_m INT,
    country VARCHAR(3),
    uci_points_scale_code VARCHAR(20) DEFAULT 'WT_MONUMENT',
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'locked', 'in_progress', 'completed'))
);

-- 9. STAGES (For Stage Races & Grand Tours)
CREATE TABLE IF NOT EXISTS stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    stage_number INT NOT NULL,
    date DATE NOT NULL,
    lockout_time TIMESTAMPTZ NOT NULL,
    profile stage_profile DEFAULT 'flat',
    distance_km NUMERIC(5, 1),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'locked', 'in_progress', 'completed')),
    UNIQUE(race_id, stage_number)
);

-- 10. LEAGUE PARTICIPATING RACES
CREATE TABLE IF NOT EXISTS league_races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(league_id, race_id)
);

-- 11. RACE STARTLISTS (Ingested with 3-tier status)
CREATE TABLE IF NOT EXISTS race_startlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    bib_number INT,
    status rider_start_status DEFAULT 'provisional' NOT NULL,
    withdrawn_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(race_id, rider_id)
);

-- 12. EVENT LINEUPS
CREATE TABLE IF NOT EXISTS event_lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_member_id UUID NOT NULL REFERENCES league_members(id) ON DELETE CASCADE,
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    total_event_points NUMERIC(10, 2) DEFAULT 0.00,
    UNIQUE(league_member_id, race_id, stage_id)
);

-- 13. LINEUP SLOTS (8 Starters + 3 Alternates)
CREATE TABLE IF NOT EXISTS lineup_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_lineup_id UUID NOT NULL REFERENCES event_lineups(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    slot_role slot_role NOT NULL,
    is_captain BOOLEAN DEFAULT FALSE,
    is_promoted_from_bench BOOLEAN DEFAULT FALSE,
    points_awarded NUMERIC(10, 2) DEFAULT 0.00,
    UNIQUE(event_lineup_id, rider_id)
);

-- 14. LEAGUE RIDER USAGE (Tracks 3-Race Max Quota)
CREATE TABLE IF NOT EXISTS league_rider_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_member_id UUID NOT NULL REFERENCES league_members(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    is_promoted_starter BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(league_member_id, rider_id, race_id)
);

-- 15. OFFICIAL RACE RESULTS
CREATE TABLE IF NOT EXISTS race_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES stages(id),
    rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
    rank INT,
    time_seconds INT,
    time_behind_seconds INT,
    finish_status rider_start_status NOT NULL,
    official_uci_points NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(race_id, stage_id, rider_id)
);

-- 16. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_rider_usage ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Leagues: Public read, member access
CREATE POLICY "Leagues are viewable by anyone" ON leagues FOR SELECT USING (true);
CREATE POLICY "Commissioners can manage their leagues" ON leagues FOR ALL USING (auth.uid() = commissioner_id);

-- Lineups: Owner can manage; Rivals can only view after lockout
CREATE POLICY "Users can manage own lineups" ON event_lineups FOR ALL
USING (auth.uid() IN (SELECT user_id FROM league_members WHERE id = event_lineups.league_member_id));

CREATE POLICY "Rival members can view lineups post-lockout" ON event_lineups FOR SELECT
USING (
    is_locked = TRUE AND
    EXISTS (
        SELECT 1 FROM league_members
        WHERE league_members.id = event_lineups.league_member_id
          AND league_members.league_id IN (
              SELECT league_id FROM league_members WHERE user_id = auth.uid()
          )
    )
);
