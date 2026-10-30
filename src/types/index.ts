export type HabitInputType = 
  | 'BOOLEAN' 
  | 'MULTI_STATE' 
  | 'QUANTITY' 
  | 'DURATION' 
  | 'SLOT'
  | 'LATAIF';

export interface MultiStateOption {
  code: string;
  symbol: string;
  label: string;
  urduLabel?: string;
  scoreWeight: number; // 0.0 to 1.0
  color: string;
  bgClass: string;
}

export type HabitCategory = 'POSITIVE' | 'NEGATIVE_ABSTINENCE';

export type CadenceType = 'DAILY' | 'FRIDAY_ONLY' | 'WEEKLY_ONCE';

export interface Habit {
  id: string;
  sectionId: string;
  title: string;
  urduTitle?: string;
  inputType: HabitInputType;
  category: HabitCategory;
  cadence: CadenceType;
  unit?: string;           // e.g. "pages", "min", "count", "ml"
  targetValue?: number;     // e.g. 10 pages, 100 reps, 20 min
  step?: number;            // increment e.g. 1, 10, 100
  multiStates?: MultiStateOption[];
  order: number;
  isCustom?: boolean;
}

export interface HabitSection {
  id: string;
  title: string;
  urduTitle?: string;
  order: number;
}

export type LogStatus = 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'FAILED' | 'RELAPSED';

export interface HabitLog {
  id?: number;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: LogStatus;
  numericValue?: number;
  stateCode?: string;
  unitUsed?: 'count' | 'min'; // For dual Lataif tracking (5000 count = 30 min)
  /** Optional user-entered amount for habits whose main value is a status (done / prayer state) */
  amount?: number;
  amountUnit?: 'count' | 'min';
  notes?: string;
  timestamp: number;
  /** true for records created by "Explore with sample data" */
  sample?: boolean;
}

export interface TrackerTemplate {
  id: string;
  title: string;
  urduTitle?: string;
  description: string;
  icon: string;
  /** Accent colour key (see TEMPLATE_COLORS); defaults to emerald */
  color?: string;
  badge: string;
  sections: HabitSection[];
  habits: Habit[];
}

export interface MonthlyRemark {
  id?: number;
  templateId: string;
  monthKey: string; // YYYY-MM
  remarks: string;
  sample?: boolean;
}

export interface AppSetting {
  key: string;
  value: unknown;
}
