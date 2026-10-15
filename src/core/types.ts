export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}

export type TrackStatus = "new" | "in_progress" | "complete" | "pending";

export interface TrackMetadata {
  track_id: string;
  type?: string;
  status: TrackStatus;
  created_at?: string;
  updated_at?: string;
  description?: string;
}

export interface TrackInfo {
  track_id: string;
  title: string;
  status: TrackStatus;
  path: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResolveTrackResult {
  status: "matched" | "ambiguous" | "not_found" | "all_complete" | "none";
  track: TrackInfo | null;
  candidates: TrackInfo[];
}

export interface TaskSummary {
  phase: string | null;
  task: string;
  status: "complete" | "in_progress" | "pending";
}

export interface PlanSummary {
  phases: string[];
  tasks: TaskSummary[];
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  current_phase: string | null;
  current_task: string | null;
  next_pending_task: string | null;
  progress_percent: number;
}

export interface ProjectTrackCounts {
  total: number;
  complete: number;
  in_progress: number;
  pending: number;
}

export interface ActiveTrackSummary {
  track_id: string;
  title: string;
  status: TrackStatus;
  current_phase: string | null;
  current_task: string | null;
  next_pending_task: string | null;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  progress_percent: number;
}

export interface ProjectStatus {
  timestamp: string;
  tracks: ProjectTrackCounts;
  active_track: ActiveTrackSummary | null;
}
