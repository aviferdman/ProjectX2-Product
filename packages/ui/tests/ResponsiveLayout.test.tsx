import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ResponsiveLayout } from '../src/components/layout/index.js';
import { DashboardPage } from '../src/components/dashboard/index.js';
import { Modal } from '../src/components/Modal.js';
import { WorkflowGrid } from '../src/components/dashboard/WorkflowGrid.js';
import { WorkflowList } from '../src/components/dashboard/WorkflowList.js';
import type { WorkflowSummary } from '../src/components/dashboard/types.js';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
type MediaQueryListener = (e: MediaQueryListEvent) => void;

const listeners = new Map<string, Set<MediaQueryListener>>();
let currentWidth = 1280;

function createMockMatchMedia(width: number) {
  return (query: string): MediaQueryList => {
    const match = query.match(/\(min-width:\s*(\d+)px\)/);
    const breakpoint = match ? parseInt(match[1], 10) : 0;
    const matches = width >= breakpoint;

    if (!listeners.has(query)) {
      listeners.set(query, new Set());
    }

    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: (_: string, fn: MediaQueryListener) => {
        listeners.get(query)?.add(fn);
      },
      removeEventListener: (_: string, fn: MediaQueryListener) => {
        listeners.get(query)?.delete(fn);
      },
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };
}

function setViewportWidth(width: number) {
  currentWidth = width;
  window.matchMedia = createMockMatchMedia(width);
  // Notify all listeners of the change
  listeners.forEach((fns, query) => {
    const match = query.match(/\(min-width:\s*(\d+)px\)/);
    const breakpoint = match ? parseInt(match[1], 10) : 0;
    const event = { matches: width >= breakpoint, media: query } as MediaQueryListEvent;
    fns.forEach((fn) => fn(event));
  });
}

const mockWorkflows: WorkflowSummary[] = [
  {
    id: 'wf-1',
    name: 'Test Workflow',
    description: 'A test workflow',
    status: 'active',
    agentCount: 3,
    taskCount: 5,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-09T08:00:00Z',
  },
  {
    id: 'wf-2',
    name: 'Draft Workflow',
    description: 'Still in progress',
    status: 'draft',
    agentCount: 1,
    taskCount: 2,
    createdAt: '2026-04-02T10:00:00Z',
    updatedAt: '2026-04-08T08:00:00Z',
  },
];

/* ------------------------------------------------------------------ */
/* Setup / Teardown                                                    */
/* ------------------------------------------------------------------ */
beforeEach(() => {
  listeners.clear();
  setViewportWidth(1280); // default desktop
});

afterEach(() => {
  listeners.clear();
});

/* ------------------------------------------------------------------ */
/* useBreakpoint hook (tested via ResponsiveLayout)                    */
/* ------------------------------------------------------------------ */
describe('Responsive breakpoint detection', () => {
  it('renders mobile layout at xs viewport (375px)', () => {
    setViewportWidth(375);
    render(
      <ResponsiveLayout
        title="Test App"
        sidebarContent={<div>Sidebar</div>}
      >
        <div>Content</div>
      </ResponsiveLayout>,
    );
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    // Sidebar should be hidden on mobile (no persistent sidebar visible)
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('renders desktop layout at xl viewport (1280px)', () => {
    setViewportWidth(1280);
    render(
      <ResponsiveLayout
        title="Test App"
        sidebarContent={<div>Nav Items</div>}
      >
        <div>Content</div>
      </ResponsiveLayout>,
    );
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* ResponsiveLayout                                                    */
/* ------------------------------------------------------------------ */
describe('ResponsiveLayout', () => {
  it('renders header with title', () => {
    render(
      <ResponsiveLayout title="My App">
        <div>Content</div>
      </ResponsiveLayout>,
    );
    expect(screen.getByText('My App')).toBeInTheDocument();
  });

  it('renders children in main content area', () => {
    render(
      <ResponsiveLayout>
        <p>Main content here</p>
      </ResponsiveLayout>,
    );
    expect(screen.getByText('Main content here')).toBeInTheDocument();
  });

  it('renders header content', () => {
    render(
      <ResponsiveLayout headerContent={<button>Settings</button>}>
        <div>Content</div>
      </ResponsiveLayout>,
    );
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('opens mobile sidebar on hamburger click', () => {
    setViewportWidth(375);
    render(
      <ResponsiveLayout sidebarContent={<div>Nav Links</div>}>
        <div>Content</div>
      </ResponsiveLayout>,
    );

    const hamburger = screen.getByLabelText('Open navigation');
    fireEvent.click(hamburger);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Nav Links')).toBeInTheDocument();
  });

  it('closes mobile sidebar on close button click', () => {
    setViewportWidth(375);
    render(
      <ResponsiveLayout sidebarContent={<div>Nav Links</div>}>
        <div>Content</div>
      </ResponsiveLayout>,
    );

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Open navigation'));
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Nav Links')).toBeInTheDocument();

    // Close sidebar — pick the close button inside the aside
    const closeButtons = screen.getAllByLabelText('Close navigation');
    const insideDrawer = closeButtons.find((btn) =>
      btn.closest('aside'),
    )!;
    fireEvent.click(insideDrawer);
    // On hidden mode, sidebar unmounts when closed
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('renders bottom sheet for properties on mobile', () => {
    setViewportWidth(375);
    const onClose = vi.fn();
    render(
      <ResponsiveLayout
        propertiesContent={<div>Property Fields</div>}
        propertiesOpen={true}
        onPropertiesClose={onClose}
      >
        <div>Content</div>
      </ResponsiveLayout>,
    );

    expect(screen.getByText('Property Fields')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('calls onPropertiesClose when closing bottom sheet', () => {
    setViewportWidth(375);
    const onClose = vi.fn();
    render(
      <ResponsiveLayout
        propertiesContent={<div>Properties</div>}
        propertiesOpen={true}
        onPropertiesClose={onClose}
      >
        <div>Content</div>
      </ResponsiveLayout>,
    );

    fireEvent.click(screen.getByLabelText('Close properties'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies responsive container padding classes', () => {
    render(
      <ResponsiveLayout>
        <div>Content</div>
      </ResponsiveLayout>,
    );

    const main = document.querySelector('.cs-main-content');
    expect(main).toBeTruthy();
    // Should have responsive padding utilities
    expect(main?.className).toContain('px-container-p-xs');
    expect(main?.className).toContain('md:px-container-p-md');
  });

  it('has correct accessibility attributes', () => {
    setViewportWidth(1280);
    render(
      <ResponsiveLayout
        sidebarContent={<div>Nav</div>}
        propertiesContent={<div>Props</div>}
        propertiesOpen={true}
        onPropertiesClose={() => {}}
      >
        <div>Content</div>
      </ResponsiveLayout>,
    );

    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label', 'Properties panel');
  });

  it('merges custom className', () => {
    const { container } = render(
      <ResponsiveLayout className="my-custom-class">
        <div>Content</div>
      </ResponsiveLayout>,
    );

    expect(container.firstElementChild?.className).toContain('my-custom-class');
    expect(container.firstElementChild?.className).toContain('cs-responsive-layout');
  });
});

/* ------------------------------------------------------------------ */
/* Modal — responsive behavior                                         */
/* ------------------------------------------------------------------ */
describe('Modal responsive behavior', () => {
  it('applies full-screen classes for mobile', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('h-full');
    expect(dialog.className).toContain('rounded-none');
    // Desktop overrides
    expect(dialog.className).toContain('md:rounded-xl');
    expect(dialog.className).toContain('md:h-auto');
  });

  it('renders close button with touch-friendly sizing on mobile', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>,
    );

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton.className).toContain('min-w-touch-min');
    expect(closeButton.className).toContain('min-h-touch-min');
  });

  it('renders responsive title sizing', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Responsive Title">
        <p>Content</p>
      </Modal>,
    );

    const title = screen.getByText('Responsive Title');
    expect(title.className).toContain('text-section-title-mobile');
    expect(title.className).toContain('md:text-section-title-desktop');
  });

  it('content area has overflow-y-auto for scrolling', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const contentDiv = dialog.querySelector('.overflow-y-auto');
    expect(contentDiv).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* WorkflowGrid — responsive columns                                   */
/* ------------------------------------------------------------------ */
describe('WorkflowGrid responsive columns', () => {
  it('applies responsive grid column classes', () => {
    const { container } = render(
      <WorkflowGrid workflows={mockWorkflows} />,
    );

    const grid = container.firstElementChild;
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('sm:grid-cols-cards-2');
    expect(grid?.className).toContain('lg:grid-cols-cards-3');
    expect(grid?.className).toContain('2xl:grid-cols-cards-4');
  });

  it('applies responsive gap classes', () => {
    const { container } = render(
      <WorkflowGrid workflows={mockWorkflows} />,
    );

    const grid = container.firstElementChild;
    expect(grid?.className).toContain('gap-grid-gap-mobile');
    expect(grid?.className).toContain('md:gap-grid-gap-tablet');
    expect(grid?.className).toContain('lg:gap-grid-gap-desktop');
  });
});

/* ------------------------------------------------------------------ */
/* WorkflowList — responsive column visibility                         */
/* ------------------------------------------------------------------ */
describe('WorkflowList responsive columns', () => {
  it('renders table with hidden columns for mobile', () => {
    const { container } = render(
      <WorkflowList workflows={mockWorkflows} />,
    );

    const headers = container.querySelectorAll('th');
    // Agents and Tasks columns should have 'hidden md:table-cell'
    const agentsHeader = Array.from(headers).find((h) => h.textContent === 'Agents');
    const tasksHeader = Array.from(headers).find((h) => h.textContent === 'Tasks');
    const updatedHeader = Array.from(headers).find((h) => h.textContent === 'Last Updated');

    expect(agentsHeader?.className).toContain('hidden');
    expect(agentsHeader?.className).toContain('md:table-cell');
    expect(tasksHeader?.className).toContain('hidden');
    expect(tasksHeader?.className).toContain('md:table-cell');
    expect(updatedHeader?.className).toContain('hidden');
    expect(updatedHeader?.className).toContain('sm:table-cell');
  });
});

/* ------------------------------------------------------------------ */
/* DashboardPage — responsive behavior                                 */
/* ------------------------------------------------------------------ */
describe('DashboardPage responsive behavior', () => {
  it('renders with responsive gap classes', () => {
    const { container } = render(
      <DashboardPage workflows={mockWorkflows} />,
    );

    const dashboard = container.querySelector('.cs-dashboard');
    expect(dashboard?.className).toContain('gap-4');
    expect(dashboard?.className).toContain('md:gap-6');
  });

  it('renders grid view by default', () => {
    render(<DashboardPage workflows={mockWorkflows} />);
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
  });

  it('still supports list view', () => {
    render(<DashboardPage workflows={mockWorkflows} defaultViewMode="list" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* DashboardToolbar — responsive layout                                */
/* ------------------------------------------------------------------ */
describe('DashboardToolbar responsive layout', () => {
  it('renders search bar with full width on mobile', () => {
    const { container } = render(
      <DashboardPage workflows={mockWorkflows} />,
    );

    const searchbox = screen.getByRole('searchbox');
    const parent = searchbox.closest('[class*="w-full"]');
    expect(parent).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* WorkflowCard — responsive thumbnail                                 */
/* ------------------------------------------------------------------ */
describe('WorkflowCard responsive thumbnail', () => {
  it('applies responsive thumbnail height', () => {
    render(
      <WorkflowGrid workflows={mockWorkflows} />,
    );

    const cards = document.querySelectorAll('.cs-workflow-card');
    expect(cards.length).toBe(2);

    // Check for responsive height classes on thumbnail
    const thumbnails = document.querySelectorAll('.cs-workflow-card > div:first-child');
    thumbnails.forEach((thumb) => {
      expect(thumb.className).toContain('h-28');
      expect(thumb.className).toContain('sm:h-40');
    });
  });
});

/* ------------------------------------------------------------------ */
/* Touch target compliance                                             */
/* ------------------------------------------------------------------ */
describe('Touch target compliance', () => {
  it('hamburger button meets WCAG 2.5.5 min touch target', () => {
    setViewportWidth(375);
    render(
      <ResponsiveLayout sidebarContent={<div>Nav</div>}>
        <div>Content</div>
      </ResponsiveLayout>,
    );

    const hamburger = screen.getByLabelText('Open navigation');
    expect(hamburger.className).toContain('min-w-touch-min');
    expect(hamburger.className).toContain('min-h-touch-min');
  });
});

/* ------------------------------------------------------------------ */
/* Integration: full responsive layout                                 */
/* ------------------------------------------------------------------ */
describe('Full responsive layout integration', () => {
  it('renders complete layout with all regions', () => {
    setViewportWidth(1280);
    render(
      <ResponsiveLayout
        title="Crewspace"
        sidebarContent={<div>Dashboard Link</div>}
        propertiesContent={<div>Config</div>}
        propertiesOpen={true}
        onPropertiesClose={() => {}}
        headerContent={<button>Profile</button>}
      >
        <DashboardPage workflows={mockWorkflows} />
      </ResponsiveLayout>,
    );

    // Header
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Crewspace');
    expect(screen.getByText('Profile')).toBeInTheDocument();
    // Sidebar
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    // Main content
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    // Properties
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders without optional regions', () => {
    render(
      <ResponsiveLayout title="Minimal">
        <p>Just content</p>
      </ResponsiveLayout>,
    );

    expect(screen.getByText('Minimal')).toBeInTheDocument();
    expect(screen.getByText('Just content')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
  });
});
