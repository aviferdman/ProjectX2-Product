import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TemplateCategoryBadge,
  TemplateTag,
  FeaturedBadge,
  TemplateCard,
  TemplateSearchBar,
  TemplateCategoryFilter,
  TemplateSortDropdown,
  TemplateGrid,
  TemplateEmptyState,
  TemplatePagination,
  TemplateBrowserPage,
} from '../src/components/templates/index.js';
import type { TemplateSummary } from '../src/components/templates/index.js';

/* ---------- Mock data ---------- */

const mockTemplate: TemplateSummary = {
  id: 'tpl-1',
  name: 'Research Assistant',
  description: 'Automated research pipeline with web scraping and summarization',
  category: 'research',
  tags: ['research', 'scraping', 'GPT-4'],
  author: 'Crewspace',
  usageCount: 1234,
  agentCount: 3,
  taskCount: 5,
  featured: true,
  popular: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-03-20T14:00:00Z',
};

const mockTemplates: TemplateSummary[] = [
  mockTemplate,
  {
    id: 'tpl-2',
    name: 'Code Reviewer',
    description: 'Automated PR reviews with AI analysis',
    category: 'code',
    tags: ['code-review', 'CI/CD'],
    author: 'DevTools',
    usageCount: 890,
    agentCount: 2,
    taskCount: 3,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-04-01T12:00:00Z',
  },
  {
    id: 'tpl-3',
    name: 'Customer Support Bot',
    description: 'Multi-channel support automation with escalation',
    category: 'support',
    tags: ['support', 'chatbot', 'slack'],
    author: 'SupportTeam',
    usageCount: 2100,
    agentCount: 4,
    taskCount: 8,
    popular: true,
    createdAt: '2025-12-01T09:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
  },
];

/* ---------- TemplateCategoryBadge ---------- */

describe('TemplateCategoryBadge', () => {
  it('renders category label', () => {
    render(<TemplateCategoryBadge category="research" />);
    expect(screen.getByText('Research')).toBeInTheDocument();
  });

  it('renders code category', () => {
    render(<TemplateCategoryBadge category="code" />);
    expect(screen.getByText('Code & Dev')).toBeInTheDocument();
  });

  it('renders all categories without crashing', () => {
    const categories = ['research', 'code', 'support', 'content', 'data', 'automation'] as const;
    for (const cat of categories) {
      const { unmount } = render(<TemplateCategoryBadge category={cat} />);
      unmount();
    }
  });
});

/* ---------- TemplateTag ---------- */

describe('TemplateTag', () => {
  it('renders tag label', () => {
    render(<TemplateTag label="GPT-4" />);
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });
});

/* ---------- FeaturedBadge ---------- */

describe('FeaturedBadge', () => {
  it('renders featured variant', () => {
    render(<FeaturedBadge variant="featured" />);
    expect(screen.getByText('★ Featured')).toBeInTheDocument();
  });

  it('renders popular variant', () => {
    render(<FeaturedBadge variant="popular" />);
    expect(screen.getByText('🔥 Popular')).toBeInTheDocument();
  });
});

/* ---------- TemplateCard ---------- */

describe('TemplateCard', () => {
  it('renders template name and description', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText('Research Assistant')).toBeInTheDocument();
    expect(screen.getByText(/Automated research pipeline/)).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText('Research')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText('research')).toBeInTheDocument();
    expect(screen.getByText('scraping')).toBeInTheDocument();
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
  });

  it('renders usage count formatted', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText('1.2k uses')).toBeInTheDocument();
  });

  it('renders agent and task counts', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText('3 agents')).toBeInTheDocument();
    expect(screen.getByText('5 tasks')).toBeInTheDocument();
  });

  it('renders author name', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText('by Crewspace')).toBeInTheDocument();
  });

  it('renders featured badge when featured', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByText('★ Featured')).toBeInTheDocument();
  });

  it('calls onUseTemplate when Use button clicked', () => {
    const handler = vi.fn();
    render(<TemplateCard template={mockTemplate} onUseTemplate={handler} />);
    const btn = screen.getByLabelText('Use template Research Assistant');
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalledWith('tpl-1');
  });

  it('calls onPreview when Preview button clicked', () => {
    const handler = vi.fn();
    render(<TemplateCard template={mockTemplate} onPreview={handler} />);
    const btn = screen.getByLabelText('Preview Research Assistant');
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalledWith('tpl-1');
  });

  it('calls onPreview on Enter key', () => {
    const handler = vi.fn();
    render(<TemplateCard template={mockTemplate} onPreview={handler} />);
    const card = screen.getByRole('article');
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handler).toHaveBeenCalledWith('tpl-1');
  });

  it('has correct aria-label', () => {
    render(<TemplateCard template={mockTemplate} />);
    expect(screen.getByLabelText('Template: Research Assistant')).toBeInTheDocument();
  });
});

/* ---------- TemplateSearchBar ---------- */

describe('TemplateSearchBar', () => {
  it('renders with placeholder', () => {
    render(<TemplateSearchBar value="" onValueChange={() => {}} />);
    expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
  });

  it('calls onValueChange when typing', () => {
    const handler = vi.fn();
    render(<TemplateSearchBar value="" onValueChange={handler} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handler).toHaveBeenCalledWith('test');
  });

  it('displays current value', () => {
    render(<TemplateSearchBar value="hello" onValueChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('hello');
  });
});

/* ---------- TemplateCategoryFilter ---------- */

describe('TemplateCategoryFilter', () => {
  it('renders All Categories and specific categories', () => {
    render(<TemplateCategoryFilter value="all" onChange={() => {}} />);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Code & Dev')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Data & Analytics')).toBeInTheDocument();
    expect(screen.getByText('Automation')).toBeInTheDocument();
  });

  it('marks active category as checked', () => {
    render(<TemplateCategoryFilter value="code" onChange={() => {}} />);
    const codeBtn = screen.getByText('Code & Dev');
    expect(codeBtn).toHaveAttribute('aria-checked', 'true');
    const allBtn = screen.getByText('All Categories');
    expect(allBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange on click', () => {
    const handler = vi.fn();
    render(<TemplateCategoryFilter value="all" onChange={handler} />);
    fireEvent.click(screen.getByText('Research'));
    expect(handler).toHaveBeenCalledWith('research');
  });
});

/* ---------- TemplateSortDropdown ---------- */

describe('TemplateSortDropdown', () => {
  const defaultSort = { field: 'popularity' as const, direction: 'desc' as const };

  it('renders current sort label', () => {
    render(<TemplateSortDropdown value={defaultSort} onChange={() => {}} />);
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<TemplateSortDropdown value={defaultSort} onChange={() => {}} />);
    fireEvent.click(screen.getByText('Most Popular'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Newest')).toBeInTheDocument();
  });

  it('calls onChange when selecting an option', () => {
    const handler = vi.fn();
    render(<TemplateSortDropdown value={defaultSort} onChange={handler} />);
    fireEvent.click(screen.getByText('Most Popular'));
    fireEvent.click(screen.getByText('Name'));
    expect(handler).toHaveBeenCalledWith({ field: 'name', direction: 'desc' });
  });
});

/* ---------- TemplateGrid ---------- */

describe('TemplateGrid', () => {
  it('renders all template cards', () => {
    render(<TemplateGrid templates={mockTemplates} />);
    expect(screen.getByText('Research Assistant')).toBeInTheDocument();
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Customer Support Bot')).toBeInTheDocument();
  });

  it('passes onUseTemplate to cards', () => {
    const handler = vi.fn();
    render(<TemplateGrid templates={mockTemplates} onUseTemplate={handler} />);
    fireEvent.click(screen.getByLabelText('Use template Research Assistant'));
    expect(handler).toHaveBeenCalledWith('tpl-1');
  });
});

/* ---------- TemplateEmptyState ---------- */

describe('TemplateEmptyState', () => {
  it('renders default heading and description', () => {
    render(<TemplateEmptyState />);
    expect(screen.getByText('No templates found')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search/)).toBeInTheDocument();
  });

  it('renders Clear Filters button when isSearchResult', () => {
    const handler = vi.fn();
    render(<TemplateEmptyState isSearchResult onClearFilters={handler} />);
    const btn = screen.getByText('Clear Filters');
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalled();
  });

  it('does not render Clear Filters when not search result', () => {
    render(<TemplateEmptyState />);
    expect(screen.queryByText('Clear Filters')).toBeNull();
  });
});

/* ---------- TemplatePagination ---------- */

describe('TemplatePagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = render(
      <TemplatePagination currentPage={1} totalPages={1} onChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons', () => {
    render(<TemplatePagination currentPage={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 3')).toBeInTheDocument();
  });

  it('marks current page', () => {
    render(<TemplatePagination currentPage={2} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Page 2')).toHaveAttribute('aria-current', 'page');
  });

  it('calls onChange on page click', () => {
    const handler = vi.fn();
    render(<TemplatePagination currentPage={1} totalPages={3} onChange={handler} />);
    fireEvent.click(screen.getByLabelText('Page 2'));
    expect(handler).toHaveBeenCalledWith(2);
  });

  it('disables previous on first page', () => {
    render(<TemplatePagination currentPage={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables next on last page', () => {
    render(<TemplatePagination currentPage={3} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Next page')).toBeDisabled();
  });
});

/* ---------- TemplateBrowserPage ---------- */

describe('TemplateBrowserPage', () => {
  it('renders page title', () => {
    render(<TemplateBrowserPage templates={mockTemplates} />);
    expect(screen.getByText('Template Library')).toBeInTheDocument();
  });

  it('renders all templates in grid', () => {
    render(<TemplateBrowserPage templates={mockTemplates} />);
    expect(screen.getByText('Research Assistant')).toBeInTheDocument();
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Customer Support Bot')).toBeInTheDocument();
  });

  it('renders template count', () => {
    render(<TemplateBrowserPage templates={mockTemplates} />);
    expect(screen.getByText('3 templates')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TemplateBrowserPage templates={[]} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no templates', () => {
    render(<TemplateBrowserPage templates={[]} />);
    expect(screen.getByText('No templates yet')).toBeInTheDocument();
  });

  it('filters by search text', () => {
    render(<TemplateBrowserPage templates={mockTemplates} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Code' } });
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.queryByText('Research Assistant')).toBeNull();
    expect(screen.queryByText('Customer Support Bot')).toBeNull();
  });

  it('filters by category', () => {
    render(<TemplateBrowserPage templates={mockTemplates} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Support' }));
    expect(screen.getByText('Customer Support Bot')).toBeInTheDocument();
    expect(screen.queryByText('Research Assistant')).toBeNull();
  });

  it('shows empty state with clear filters when search yields no results', () => {
    render(<TemplateBrowserPage templates={mockTemplates} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'nonexistent-xyz' } });
    expect(screen.getByText('No matching templates')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('clears filters when Clear Filters clicked', () => {
    render(<TemplateBrowserPage templates={mockTemplates} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'nonexistent-xyz' } });
    fireEvent.click(screen.getByText('Clear Filters'));
    expect(screen.getByText('Research Assistant')).toBeInTheDocument();
    expect(screen.getByText('Code Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Customer Support Bot')).toBeInTheDocument();
  });

  it('updates result count when filtering', () => {
    render(<TemplateBrowserPage templates={mockTemplates} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Code' } });
    expect(screen.getByText('1 of 3 templates')).toBeInTheDocument();
  });
});
