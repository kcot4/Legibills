export type LegislativeStatus = 
  | 'introduced'
  | 'referred_to_committee'
  | 'reported_by_committee'
  | 'passed_house'
  | 'passed_senate'
  | 'to_president'
  | 'signed'
  | 'enacted'
  | 'vetoed';

export type BillCategory = 'recent' | 'trending' | 'upcoming' | 'enacted';

export type Topic = string;

export interface Committee {
  name: string;
  chamber: 'house' | 'senate' | 'joint';
  systemCode?: string;
  url?: string;
}

export interface CommitteeActivity {
  id: string;
  committee: Committee;
  date: string;
  activity: string;
  activityType: 'referred' | 'markup' | 'reported' | 'discharged' | 'hearing' | 'other';
}

interface Sponsor {
  id: string;
  name: string;
  party: string;
  state: string;
  district?: string;
  bioguideId?: string;
  sponsorshipDate?: string;
  isOriginalCosponsor?: boolean;
}

interface TimelineEvent {
  date: string;
  action: string;
  status: string;
  committee?: Committee;
}

interface Vote {
  chamber: 'house' | 'senate';
  date: string;
  yeas: number;
  nays: number;
  notVoting: number;
}

export interface Bill {
  id: string;
  number: string;
  title: string;
  summary: string | null;
  simplifiedText: string | null;
  originalText: string | null;
  status: LegislativeStatus;
  chamber: 'house' | 'senate';
  introducedDate: string;
  lastActionDate: string;
  expectedVoteDate?: string;
  category: BillCategory;
  congress: string;
  billType: string;
  billNumber: string;
  topics: Topic[];
  sponsors: Sponsor[];
  timeline: TimelineEvent[];
  votes: Vote[];
  committees: CommitteeActivity[];
  aiSummary?: string;
  keyProvisions?: string[];
  potentialImpact?: string[];
  potentialControversy?: string[];
}

export interface UserPreferences {
  trackedBills: string[];
  topics: Topic[];
  emailNotifications: boolean;
  preferredCommittees?: string[];
  preferredStages?: LegislativeStatus[];
}

// Stage groupings for better organization
export const BILL_STAGES = {
  'Early Stage': ['introduced', 'referred_to_committee'],
  'Committee Review': ['reported_by_committee'],
  'Legislative Process': ['passed_house', 'passed_senate'],
  'Executive Review': ['to_president', 'signed'],
  'Final Status': ['enacted', 'vetoed']
} as const;

export type BillStageGroup = keyof typeof BILL_STAGES;