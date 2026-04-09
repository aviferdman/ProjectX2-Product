import { clsx } from 'clsx';
import {
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint.js';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type SidebarMode = 'hidden' | 'overlay' | 'collapsible' | 'expanded';

export interface ResponsiveLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /** Content for the sidebar navigation */
  sidebarContent?: ReactNode;
  /** Content for the right-side properties panel */
  propertiesContent?: ReactNode;
  /** Whether the properties panel is open */
  propertiesOpen?: boolean;
  /** Callback to close the properties panel */
  onPropertiesClose?: () => void;
  /** Custom header content (rendered after the hamburger) */
  headerContent?: ReactNode;
  /** App title displayed in the header */
  title?: string;
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M3 5h14M3 10h14M3 15h14" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 4l10 10M14 4L4 14" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M10 4L6 8l4 4" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 4l4 4-4 4" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */
interface SidebarInternalProps {
  mode: SidebarMode;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  children?: ReactNode;
}

const Sidebar = ({
  mode,
  open,
  collapsed,
  onClose,
  onToggleCollapse,
  children,
}: SidebarInternalProps) => {
  if (mode === 'hidden' && !open) return null;

  // Overlay (mobile: full-screen, tablet: slide-over)
  if (mode === 'hidden' || mode === 'overlay') {
    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/50 animate-overlay-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        {/* Drawer */}
        <aside
          role="navigation"
          aria-label="Main navigation"
          className={clsx(
            'fixed top-0 left-0 z-50 h-full bg-surface-panel border-r border-slate-700',
            'shadow-xl transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]',
            mode === 'hidden' ? 'w-[280px]' : 'w-sidebar-overlay',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between h-header-mobile md:h-header-desktop px-4 border-b border-slate-700">
            <span className="text-sm font-semibold text-slate-100">Navigation</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
              aria-label="Close navigation"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-var(--cs-header-h,48px))] p-4">
            {children}
          </div>
        </aside>
      </>
    );
  }

  // Persistent (collapsible or expanded)
  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className={clsx(
        'cs-sidebar hidden lg:flex flex-col border-r border-slate-700 bg-surface-panel',
        'transition-[width] duration-200 ease-out overflow-hidden flex-shrink-0',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar-expanded',
      )}
    >
      <div className="flex items-center justify-between h-header-desktop px-3 border-b border-slate-700">
        {!collapsed && (
          <span className="text-sm font-semibold text-slate-100 truncate">Crewspace</span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {children}
      </div>
    </aside>
  );
};

/* ------------------------------------------------------------------ */
/* Bottom Sheet (properties panel on mobile)                           */
/* ------------------------------------------------------------------ */
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

const BottomSheet = ({ open, onClose, children }: BottomSheetProps) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="complementary"
        aria-label="Properties panel"
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-surface-panel border-t border-slate-700 rounded-t-xl shadow-xl',
          'max-h-bottom-sheet animate-bottom-sheet-up',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <span className="text-sm font-semibold text-slate-100">Properties</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
            aria-label="Close properties"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto p-4 max-h-[calc(60vh-48px)]">
          {children}
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Properties Panel (overlay/docked for tablet/desktop)                */
/* ------------------------------------------------------------------ */
interface PropertiesPanelProps {
  mode: 'overlay' | 'docked';
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

const PropertiesPanel = ({ mode, open, onClose, children }: PropertiesPanelProps) => {
  if (!open) return null;

  if (mode === 'overlay') {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
          aria-hidden="true"
        />
        <aside
          role="complementary"
          aria-label="Properties panel"
          className={clsx(
            'fixed top-0 right-0 z-50 h-full w-properties-panel-w',
            'bg-surface-panel border-l border-slate-700 shadow-xl',
            'animate-sidebar-slide-in [animation-direction:reverse] [transform:translateX(0)]',
          )}
          style={{ animationDirection: 'normal', transform: 'translateX(0)' }}
        >
          <div className="flex items-center justify-between h-header-desktop px-4 border-b border-slate-700">
            <span className="text-sm font-semibold text-slate-100">Properties</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
              aria-label="Close properties"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-56px)] p-4">
            {children}
          </div>
        </aside>
      </>
    );
  }

  // Docked mode
  return (
    <aside
      role="complementary"
      aria-label="Properties panel"
      className="hidden xl:flex flex-col w-properties-panel-w border-l border-slate-700 bg-surface-panel flex-shrink-0"
    >
      <div className="flex items-center justify-between h-header-desktop px-4 border-b border-slate-700">
        <span className="text-sm font-semibold text-slate-100">Properties</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors"
          aria-label="Close properties"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </aside>
  );
};

/* ------------------------------------------------------------------ */
/* ResponsiveLayout                                                    */
/* ------------------------------------------------------------------ */
export const ResponsiveLayout = forwardRef<HTMLDivElement, ResponsiveLayoutProps>(
  (
    {
      sidebarContent,
      propertiesContent,
      propertiesOpen = false,
      onPropertiesClose,
      headerContent,
      title = 'Crewspace',
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const { isMobile, isTablet, isDesktop, isXl } = useBreakpoint();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

    // Close mobile sidebar on breakpoint change
    useEffect(() => {
      if (isDesktop) setSidebarOpen(false);
    }, [isDesktop]);

    // Determine sidebar mode from design tokens
    const sidebarMode: SidebarMode = isMobile
      ? 'hidden'
      : isTablet
        ? 'overlay'
        : isXl
          ? 'expanded'
          : 'collapsible';

    const handleSidebarToggle = useCallback(() => {
      if (sidebarMode === 'hidden' || sidebarMode === 'overlay') {
        setSidebarOpen((prev) => !prev);
      } else {
        setSidebarCollapsed((prev) => !prev);
      }
    }, [sidebarMode]);

    const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);

    const handlePropertiesClose = useCallback(() => {
      onPropertiesClose?.();
    }, [onPropertiesClose]);

    // Auto-expand sidebar for xl+
    useEffect(() => {
      if (isXl) setSidebarCollapsed(false);
      else if (isDesktop) setSidebarCollapsed(true);
    }, [isXl, isDesktop]);

    return (
      <div
        ref={ref}
        className={clsx(
          'cs-responsive-layout flex flex-col h-screen w-full overflow-hidden',
          'bg-surface-app text-slate-100',
          className,
        )}
        {...rest}
      >
        {/* Header */}
        <header
          className={clsx(
            'cs-header flex items-center gap-3 border-b border-slate-700 bg-surface-panel px-4 flex-shrink-0',
            'h-header-mobile md:h-header-desktop',
          )}
        >
          {/* Hamburger for mobile/tablet, collapse toggle for desktop */}
          {sidebarContent && (
            <button
              type="button"
              onClick={handleSidebarToggle}
              className={clsx(
                'p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors',
                'min-w-touch-min min-h-touch-min flex items-center justify-center',
                isDesktop && 'hidden',
              )}
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={sidebarOpen}
            >
              <MenuIcon />
            </button>
          )}

          <h1 className="text-page-title-mobile md:text-page-title-desktop text-slate-100 truncate">
            {title}
          </h1>

          {headerContent && (
            <div className="flex-1 flex items-center justify-end gap-2">
              {headerContent}
            </div>
          )}
        </header>

        {/* Body: sidebar + content + properties */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {sidebarContent && (
            <Sidebar
              mode={sidebarMode}
              open={sidebarOpen}
              collapsed={sidebarCollapsed}
              onClose={handleSidebarClose}
              onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            >
              {sidebarContent}
            </Sidebar>
          )}

          {/* Main content */}
          <main
            className={clsx(
              'cs-main-content flex-1 overflow-y-auto',
              'px-container-p-xs sm:px-container-p-sm md:px-container-p-md lg:px-container-p-lg xl:px-container-p-xl 2xl:px-container-p-2xl',
              'py-4 md:py-6',
            )}
          >
            <div className="w-full max-w-content-xl 2xl:max-w-content-2xl mx-auto">
              {children}
            </div>
          </main>

          {/* Properties panel */}
          {propertiesContent && (
            <>
              {isMobile && (
                <BottomSheet
                  open={propertiesOpen}
                  onClose={handlePropertiesClose}
                >
                  {propertiesContent}
                </BottomSheet>
              )}
              {isTablet && (
                <PropertiesPanel
                  mode="overlay"
                  open={propertiesOpen}
                  onClose={handlePropertiesClose}
                >
                  {propertiesContent}
                </PropertiesPanel>
              )}
              {isDesktop && (
                <PropertiesPanel
                  mode={isXl ? 'docked' : 'overlay'}
                  open={propertiesOpen}
                  onClose={handlePropertiesClose}
                >
                  {propertiesContent}
                </PropertiesPanel>
              )}
            </>
          )}
        </div>
      </div>
    );
  },
);

ResponsiveLayout.displayName = 'ResponsiveLayout';
