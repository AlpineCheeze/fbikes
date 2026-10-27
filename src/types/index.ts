export type LeagueMode = 'rider_lockout' | 'draft_league' | 'salary_cap';

export type RiderStartStatus = 'provisional' | 'probable' | 'confirmed' | 'dns' | 'dnf' | 'finished';

export type SlotRole = 'starter' | 'alternate_1' | 'alternate_2' | 'alternate_3';

export type RaceType = 'monument' | 'world_tour_1day' | 'world_tour_stage' | 'grand_tour' | 'pro_series';

export type StageProfile = 'flat' | 'hilly' | 'mountain' | 'individual_time_trial' | 'team_time_trial';

export type Specialty = 'climber' | 'sprinter' | 'puncheur' | 'time_trialist' | 'all_rounder' | 'domestique';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  favoriteTeam?: string;
  createdAt: string;
}

export interface ScoringSettings {
  useOfficialUci: boolean;
  captainMultiplier: number; // default 1.5x
  grandTourDailyStageWeight: number; // default 1.0x
  komPointsEnabled: boolean;
  sprintPointsEnabled: boolean;
}

export interface ProTeam {
  id: string;
  name: string;
  uciCode: string; // e.g. UAD, TVL, IGD, SOQ, ADC, RBH
  jerseyColor: string;
  tier: 'WorldTeam' | 'ProTeam';
}

export interface Rider {
  id: string;
  proTeamId: string;
  proTeam?: ProTeam;
  firstName: string;
  lastName: string;
  nationality: string; // ISO 3166-1 alpha-3, e.g. SLO, BEL, DEN, NED
  specialty: Specialty;
  photoUrl?: string;
  currentUciPoints: number;
  fantasyPrice?: number;
}

export interface Race {
  id: string;
  name: string;
  slug: string;
  raceType: RaceType;
  seasonYear: number;
  startDate: string;
  endDate: string;
  lockoutTime: string; // ISO String
  distanceKm: number;
  elevationGainM: number;
  country: string;
  uciPointsScaleCode: string;
  status: 'scheduled' | 'locked' | 'in_progress' | 'completed';
  isMonument?: boolean;
  isGrandTour?: boolean;
}

export interface RaceStartlistEntry {
  id: string;
  raceId: string;
  riderId: string;
  rider: Rider;
  bibNumber?: number;
  status: RiderStartStatus;
  withdrawnAt?: string;
}

export interface League {
  id: string;
  commissionerId: string;
  name: string;
  joinCode: string;
  gameMode: LeagueMode;
  maxRiderUses: number; // Flagship default: 3
  startersCount: number; // Standard: 8
  alternatesCount: number; // Standard: 3
  isPrivate: boolean;
  scoringSettings: ScoringSettings;
  participatingRaceIds: string[];
  createdAt: string;
}

export interface LeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  user: UserProfile;
  teamName: string;
  role: 'commissioner' | 'member';
  cumulativePoints: number;
  joinedAt: string;
}

export interface LineupSlot {
  id: string;
  eventLineupId: string;
  riderId: string;
  rider: Rider;
  slotRole: SlotRole;
  isCaptain: boolean;
  isPromotedFromBench: boolean;
  pointsAwarded: number;
}

export interface EventLineup {
  id: string;
  leagueMemberId: string;
  raceId: string;
  stageId?: string;
  submittedAt: string;
  isLocked: boolean;
  totalEventPoints: number;
  slots: LineupSlot[];
}

export interface RiderQuotaUsage {
  leagueMemberId: string;
  riderId: string;
  raceId: string;
  usesCount: number;
  remainingUses: number;
}
