export interface CompletenessInfo {
  studio: boolean;
  coordinator: boolean;
  lectureSlide: boolean;
  title: boolean;
  caption: boolean;
  sourcePlatform: boolean;
  score: number; // 0 to 6
  isComplete: boolean;
}

export interface ContentRecord {
  id: string;
  dateTime: string; // Left identifier
  classTime: string; // Class/Scheduled time
  course: string;   // Left identifier
  subject: string;  // Left identifier
  topic: string;    // Left identifier
  studio: string;   // Focus column M
  coordinator: string; // Focus column N
  lectureSlide: string; // Focus column P
  title: string;       // Focus column Q
  caption: string;     // Focus column R
  sourcePlatform: string; // Focus column T
  rawRow: string[];
  completeness: CompletenessInfo;
}

export interface ColumnMetric {
  name: string;
  label: string;
  filledCount: number;
  emptyCount: number;
  totalCount: number;
  percentage: number;
}

export interface DayMetric {
  date: string;
  total: number;
  complete: number;
  incomplete: number;
  completenessRate: number;
}

export interface DashboardStats {
  totalRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  overallCompleteness: number; // percentage
  columnMetrics: ColumnMetric[];
  dayMetrics: DayMetric[];
  allDates: string[];
  allCourses: string[];
  allSubjects: string[];
  allCoordinators: string[];
}
