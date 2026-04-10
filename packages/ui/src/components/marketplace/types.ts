/**
 * Marketplace Browser types — TASK-166
 */

export type IntegrationCategory =
  | 'llm'
  | 'tool'
  | 'storage'
  | 'communication'
  | 'analytics'
  | 'monitoring';

export type IntegrationSortField = 'name' | 'installs' | 'rating' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface IntegrationSummary {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  tags: string[];
  author: string;
  installCount: number;
  version: string;
  verified: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceFilters {
  search: string;
  category: IntegrationCategory | 'all';
  sort: { field: IntegrationSortField; direction: SortDirection };
}

export const INTEGRATION_CATEGORIES: {
  id: IntegrationCategory;
  label: string;
}[] = [
  { id: 'llm', label: 'LLM Providers' },
  { id: 'tool', label: 'Tools' },
  { id: 'storage', label: 'Storage' },
  { id: 'communication', label: 'Communication' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'monitoring', label: 'Monitoring' },
];

export const MARKETPLACE_SORT_OPTIONS: { field: IntegrationSortField; label: string }[] = [
  { field: 'installs', label: 'Most Installed' },
  { field: 'rating', label: 'Highest Rated' },
  { field: 'name', label: 'Name' },
  { field: 'updatedAt', label: 'Recently Updated' },
];

export const MARKETPLACE_ITEMS_PER_PAGE = 12;
