import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  IntegrationCategoryBadge,
  VerifiedBadge,
  StarRating,
  IntegrationCard,
  MarketplaceSearchBar,
  MarketplaceCategoryFilter,
  MarketplaceSortDropdown,
  IntegrationGrid,
  MarketplaceEmptyState,
  MarketplacePagination,
  MarketplaceBrowserPage,
} from '../src/components/marketplace/index.js';
import type { IntegrationSummary } from '../src/components/marketplace/index.js';

/* ---------- Mock data ---------- */

const mockIntegration: IntegrationSummary = {
  id: 'int-1',
  name: 'OpenAI GPT-4',
  description: 'Connect to OpenAI GPT-4 for advanced language model capabilities',
  category: 'llm',
  tags: ['gpt-4', 'openai', 'language-model'],
  author: 'Crewspace',
  installCount: 5400,
  version: '2.1.0',
  verified: true,
  rating: 4.8,
  createdAt: '2025-06-15T10:00:00Z',
  updatedAt: '2026-03-20T14:00:00Z',
};

const mockIntegrations: IntegrationSummary[] = [
  mockIntegration,
  {
    id: 'int-2',
    name: 'Slack Notifier',
    description: 'Send workflow notifications to Slack channels',
    category: 'communication',
    tags: ['slack', 'notifications'],
    author: 'CommTools',
    installCount: 3200,
    version: '1.4.2',
    verified: false,
    rating: 4.2,
    createdAt: '2025-09-10T08:00:00Z',
    updatedAt: '2026-04-01T12:00:00Z',
  },
  {
    id: 'int-3',
    name: 'S3 Storage',
    description: 'Store and retrieve files from Amazon S3 buckets',
    category: 'storage',
    tags: ['aws', 's3', 'files'],
    author: 'CloudTeam',
    installCount: 7800,
    version: '3.0.1',
    verified: true,
    rating: 4.5,
    createdAt: '2025-04-01T09:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
  },
];

/* ---------- IntegrationCategoryBadge ---------- */

describe('IntegrationCategoryBadge', () => {
  it('renders LLM category label', () => {
    render(<IntegrationCategoryBadge category="llm" />);
    expect(screen.getByText('LLM Provider')).toBeInTheDocument();
  });

  it('renders tool category', () => {
    render(<IntegrationCategoryBadge category="tool" />);
    expect(screen.getByText('Tool')).toBeInTheDocument();
  });

  it('renders all categories without crashing', () => {
    const categories = [
      'llm',
      'tool',
      'storage',
      'communication',
      'analytics',
      'monitoring',
    ] as const;
    for (const cat of categories) {
      const { unmount } = render(<IntegrationCategoryBadge category={cat} />);
      unmount();
    }
  });
});

/* ---------- VerifiedBadge ---------- */

describe('VerifiedBadge', () => {
  it('renders verified text', () => {
    render(<VerifiedBadge />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
});

/* ---------- StarRating ---------- */

describe('StarRating', () => {
  it('renders rating value', () => {
    render(<StarRating rating={4.5} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('has correct aria label', () => {
    render(<StarRating rating={3.7} />);
    expect(screen.getByLabelText('3.7 out of 5 stars')).toBeInTheDocument();
  });

  it('clamps to 0-5 range', () => {
    render(<StarRating rating={6} />);
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });
});

/* ---------- IntegrationCard ---------- */

describe('IntegrationCard', () => {
  it('renders integration name and description', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument();
    expect(screen.getByText(/Connect to OpenAI GPT-4/)).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByText('LLM Provider')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByText('gpt-4')).toBeInTheDocument();
    expect(screen.getByText('openai')).toBeInTheDocument();
    expect(screen.getByText('language-model')).toBeInTheDocument();
  });

  it('renders install count formatted', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByText('5.4k installs')).toBeInTheDocument();
  });

  it('renders version', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByText('v2.1.0')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByText('by Crewspace')).toBeInTheDocument();
  });

  it('renders verified badge when verified', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('does not render verified badge when not verified', () => {
    render(<IntegrationCard integration={mockIntegrations[1]} />);
    expect(screen.queryByText('Verified')).toBeNull();
  });

  it('renders star rating', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByLabelText('4.8 out of 5 stars')).toBeInTheDocument();
  });

  it('calls onInstall when Install button clicked', () => {
    const handler = vi.fn();
    render(<IntegrationCard integration={mockIntegration} onInstall={handler} />);
    const btn = screen.getByLabelText('Install OpenAI GPT-4');
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalledWith('int-1');
  });

  it('calls onViewDetails when Details button clicked', () => {
    const handler = vi.fn();
    render(<IntegrationCard integration={mockIntegration} onViewDetails={handler} />);
    const btn = screen.getByLabelText('View details for OpenAI GPT-4');
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalledWith('int-1');
  });

  it('calls onViewDetails on Enter key', () => {
    const handler = vi.fn();
    render(<IntegrationCard integration={mockIntegration} onViewDetails={handler} />);
    const card = screen.getByRole('article');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handler).toHaveBeenCalledWith('int-1');
  });

  it('has correct aria-label', () => {
    render(<IntegrationCard integration={mockIntegration} />);
    expect(screen.getByLabelText('Integration: OpenAI GPT-4')).toBeInTheDocument();
  });
});

/* ---------- MarketplaceSearchBar ---------- */

describe('MarketplaceSearchBar', () => {
  it('renders with placeholder', () => {
    render(<MarketplaceSearchBar value="" onValueChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search integrations...')).toBeInTheDocument();
  });

  it('calls onValueChange when typing', () => {
    const handler = vi.fn();
    render(<MarketplaceSearchBar value="" onValueChange={handler} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'openai' } });
    expect(handler).toHaveBeenCalledWith('openai');
  });

  it('displays current value', () => {
    render(<MarketplaceSearchBar value="hello" onValueChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('hello');
  });
});

/* ---------- MarketplaceCategoryFilter ---------- */

describe('MarketplaceCategoryFilter', () => {
  it('renders All Categories and specific categories', () => {
    render(<MarketplaceCategoryFilter value="all" onChange={() => {}} />);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('LLM Providers')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
  });

  it('marks active category as checked', () => {
    render(<MarketplaceCategoryFilter value="llm" onChange={() => {}} />);
    const llmBtn = screen.getByText('LLM Providers');
    expect(llmBtn).toHaveAttribute('aria-checked', 'true');
    const allBtn = screen.getByText('All Categories');
    expect(allBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange on click', () => {
    const handler = vi.fn();
    render(<MarketplaceCategoryFilter value="all" onChange={handler} />);
    fireEvent.click(screen.getByText('Storage'));
    expect(handler).toHaveBeenCalledWith('storage');
  });
});

/* ---------- MarketplaceSortDropdown ---------- */

describe('MarketplaceSortDropdown', () => {
  const defaultSort = { field: 'installs' as const, direction: 'desc' as const };

  it('renders current sort label', () => {
    render(<MarketplaceSortDropdown value={defaultSort} onChange={() => {}} />);
    expect(screen.getByText('Most Installed')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<MarketplaceSortDropdown value={defaultSort} onChange={() => {}} />);
    fireEvent.click(screen.getByText('Most Installed'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Highest Rated')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Recently Updated')).toBeInTheDocument();
  });

  it('calls onChange when selecting an option', () => {
    const handler = vi.fn();
    render(<MarketplaceSortDropdown value={defaultSort} onChange={handler} />);
    fireEvent.click(screen.getByText('Most Installed'));
    fireEvent.click(screen.getByText('Name'));
    expect(handler).toHaveBeenCalledWith({ field: 'name', direction: 'desc' });
  });
});

/* ---------- IntegrationGrid ---------- */

describe('IntegrationGrid', () => {
  it('renders all integration cards', () => {
    render(<IntegrationGrid integrations={mockIntegrations} />);
    expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Slack Notifier')).toBeInTheDocument();
    expect(screen.getByText('S3 Storage')).toBeInTheDocument();
  });

  it('passes onInstall to cards', () => {
    const handler = vi.fn();
    render(<IntegrationGrid integrations={mockIntegrations} onInstall={handler} />);
    fireEvent.click(screen.getByLabelText('Install OpenAI GPT-4'));
    expect(handler).toHaveBeenCalledWith('int-1');
  });
});

/* ---------- MarketplaceEmptyState ---------- */

describe('MarketplaceEmptyState', () => {
  it('renders default heading and description', () => {
    render(<MarketplaceEmptyState />);
    expect(screen.getByText('No integrations found')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search/)).toBeInTheDocument();
  });

  it('renders Clear Filters button when isSearchResult', () => {
    const handler = vi.fn();
    render(<MarketplaceEmptyState isSearchResult onClearFilters={handler} />);
    const btn = screen.getByText('Clear Filters');
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalled();
  });

  it('does not render Clear Filters when not search result', () => {
    render(<MarketplaceEmptyState />);
    expect(screen.queryByText('Clear Filters')).toBeNull();
  });
});

/* ---------- MarketplacePagination ---------- */

describe('MarketplacePagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(
      <MarketplacePagination currentPage={1} totalPages={1} onChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons', () => {
    render(<MarketplacePagination currentPage={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 3')).toBeInTheDocument();
  });

  it('marks current page', () => {
    render(<MarketplacePagination currentPage={2} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Page 2')).toHaveAttribute('aria-current', 'page');
  });

  it('calls onChange on page click', () => {
    const handler = vi.fn();
    render(<MarketplacePagination currentPage={1} totalPages={3} onChange={handler} />);
    fireEvent.click(screen.getByLabelText('Page 2'));
    expect(handler).toHaveBeenCalledWith(2);
  });

  it('disables previous on first page', () => {
    render(<MarketplacePagination currentPage={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables next on last page', () => {
    render(<MarketplacePagination currentPage={3} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });
});

/* ---------- MarketplaceBrowserPage ---------- */

describe('MarketplaceBrowserPage', () => {
  it('renders page title', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('renders page subtitle', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    expect(screen.getByText(/Discover and install integrations/)).toBeInTheDocument();
  });

  it('renders all integrations in grid', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Slack Notifier')).toBeInTheDocument();
    expect(screen.getByText('S3 Storage')).toBeInTheDocument();
  });

  it('renders integration count', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    expect(screen.getByText('3 integrations')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<MarketplaceBrowserPage integrations={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no integrations', () => {
    render(<MarketplaceBrowserPage integrations={[]} />);
    expect(screen.getByText('No integrations yet')).toBeInTheDocument();
  });

  it('filters by search text', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Slack' } });
    expect(screen.getByText('Slack Notifier')).toBeInTheDocument();
    expect(screen.queryByText('OpenAI GPT-4')).toBeNull();
    expect(screen.queryByText('S3 Storage')).toBeNull();
  });

  it('filters by category', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Storage' }));
    expect(screen.getByText('S3 Storage')).toBeInTheDocument();
    expect(screen.queryByText('OpenAI GPT-4')).toBeNull();
  });

  it('shows empty state with clear filters when search yields no results', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'nonexistent-xyz' } });
    expect(screen.getByText('No matching integrations')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('clears filters when Clear Filters clicked', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'nonexistent-xyz' } });
    fireEvent.click(screen.getByText('Clear Filters'));
    expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Slack Notifier')).toBeInTheDocument();
    expect(screen.getByText('S3 Storage')).toBeInTheDocument();
  });

  it('updates result count when filtering', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Slack' } });
    expect(screen.getByText('1 of 3 integrations')).toBeInTheDocument();
  });

  it('searches by tags', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'aws' } });
    expect(screen.getByText('S3 Storage')).toBeInTheDocument();
    expect(screen.queryByText('OpenAI GPT-4')).toBeNull();
  });

  it('searches by author', () => {
    render(<MarketplaceBrowserPage integrations={mockIntegrations} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'CommTools' } });
    expect(screen.getByText('Slack Notifier')).toBeInTheDocument();
    expect(screen.queryByText('OpenAI GPT-4')).toBeNull();
  });
});
