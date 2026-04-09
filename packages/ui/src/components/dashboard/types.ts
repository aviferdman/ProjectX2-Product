/**
 * Dashboard & Workflow Management — shared types
 * TASK-151: Implement dashboard (workflow CRUD, list/grid views)
 */

export type WorkflowStatus = 'draft' | 'active' | 'error' | 'archived';

export type ViewMode = 'grid' | 'list';

export type SortField = 'name' | 'updatedAt' | 'createdAt' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  agentCount: number;
  taskCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardFilters {
  search: string;
  status: WorkflowStatus | 'all';
  sort: { field: SortField; direction: SortDirection };
}
