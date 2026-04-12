/**
 * Template Browser types — TASK-159
 */

export type TemplateCategory = 'research' | 'code' | 'support' | 'content' | 'data' | 'automation';

export type TemplateSortField = 'name' | 'popularity' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  author: string;
  usageCount: number;
  agentCount: number;
  taskCount: number;
  featured?: boolean;
  popular?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFilters {
  search: string;
  category: TemplateCategory | 'all';
  sort: { field: TemplateSortField; direction: SortDirection };
}

export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory;
  label: string;
}[] = [
  { id: 'research', label: 'Research' },
  { id: 'code', label: 'Code & Dev' },
  { id: 'support', label: 'Support' },
  { id: 'content', label: 'Content' },
  { id: 'data', label: 'Data & Analytics' },
  { id: 'automation', label: 'Automation' },
];

export const SORT_OPTIONS: { field: TemplateSortField; label: string }[] = [
  { field: 'popularity', label: 'Most Popular' },
  { field: 'name', label: 'Name' },
  { field: 'createdAt', label: 'Newest' },
  { field: 'updatedAt', label: 'Recently Updated' },
];

export const ITEMS_PER_PAGE = 12;
