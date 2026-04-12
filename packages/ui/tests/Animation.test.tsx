import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  FadeIn,
  SlideIn,
  ScaleIn,
  PageTransition,
  AnimatePresence,
  Skeleton,
  Shimmer,
  PulseLoader,
  StaggerList,
  DURATION,
  EASING,
  STAGGER,
} from '../src/components/animation/index.js';

/* ------------------------------------------------------------------ */
/* FadeIn                                                              */
/* ------------------------------------------------------------------ */
describe('FadeIn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(<FadeIn>Hello</FadeIn>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('starts with opacity 0 and transitions to 1', () => {
    const { container } = render(<FadeIn>Content</FadeIn>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe('0');

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(el.style.opacity).toBe('1');
  });

  it('respects delay prop', () => {
    const { container } = render(<FadeIn delay={200}>Delayed</FadeIn>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe('0');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(el.style.opacity).toBe('0');

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(el.style.opacity).toBe('1');
  });

  it('applies custom duration to transition', () => {
    const { container } = render(<FadeIn duration={500}>Custom</FadeIn>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transition).toContain('500ms');
  });

  it('applies custom className', () => {
    const { container } = render(<FadeIn className="my-class">Classed</FadeIn>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('my-class');
  });
});

/* ------------------------------------------------------------------ */
/* SlideIn                                                             */
/* ------------------------------------------------------------------ */
describe('SlideIn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(<SlideIn>Slide content</SlideIn>);
    expect(screen.getByText('Slide content')).toBeInTheDocument();
  });

  it('defaults to "up" direction', () => {
    const { container } = render(<SlideIn>Up</SlideIn>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('data-direction')).toBe('up');
  });

  it('starts translated and transitions in', () => {
    const { container } = render(
      <SlideIn direction="left" distance={20}>
        Left
      </SlideIn>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transform).toContain('translateX(20px)');

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(el.style.transform).toBe('translate(0, 0)');
  });

  it('respects delay', () => {
    const { container } = render(<SlideIn delay={100}>Delayed slide</SlideIn>);
    const el = container.firstElementChild as HTMLElement;

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(el.style.opacity).toBe('0');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(el.style.opacity).toBe('1');
  });
});

/* ------------------------------------------------------------------ */
/* ScaleIn                                                             */
/* ------------------------------------------------------------------ */
describe('ScaleIn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(<ScaleIn>Scale content</ScaleIn>);
    expect(screen.getByText('Scale content')).toBeInTheDocument();
  });

  it('starts at scale 0.92 by default', () => {
    const { container } = render(<ScaleIn>Default scale</ScaleIn>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transform).toBe('scale(0.92)');
  });

  it('accepts custom from scale', () => {
    const { container } = render(<ScaleIn from={0.5}>Half</ScaleIn>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transform).toBe('scale(0.5)');
  });

  it('uses spring easing when spring prop is true', () => {
    const { container } = render(<ScaleIn spring>Spring</ScaleIn>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transition).toContain(EASING.spring);
  });

  it('transitions to scale(1) after mount', () => {
    const { container } = render(<ScaleIn>Grow</ScaleIn>);
    const el = container.firstElementChild as HTMLElement;

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(el.style.transform).toBe('scale(1)');
    expect(el.style.opacity).toBe('1');
  });
});

/* ------------------------------------------------------------------ */
/* PageTransition                                                      */
/* ------------------------------------------------------------------ */
describe('PageTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(<PageTransition>Page content</PageTransition>);
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('defaults to fade variant', () => {
    const { container } = render(<PageTransition>Fade page</PageTransition>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('data-variant')).toBe('fade');
  });

  it('starts with opacity 0 for fade variant', () => {
    const { container } = render(<PageTransition variant="fade">Hidden</PageTransition>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.opacity).toBe('0');
  });

  it('starts with translateY for slideUp variant', () => {
    const { container } = render(<PageTransition variant="slideUp">Sliding</PageTransition>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.transform).toContain('translateY(16px)');
  });

  it('transitions in after mount', () => {
    const { container } = render(<PageTransition variant="slideUp">Mounted</PageTransition>);
    const el = container.firstElementChild as HTMLElement;

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(el.style.opacity).toBe('1');
    expect(el.getAttribute('data-entered')).toBe('true');
  });
});

/* ------------------------------------------------------------------ */
/* AnimatePresence                                                     */
/* ------------------------------------------------------------------ */
describe('AnimatePresence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mounts children when show is true', () => {
    render(<AnimatePresence show={true}>Visible</AnimatePresence>);
    expect(screen.getByText('Visible')).toBeInTheDocument();
  });

  it('does not mount children when show starts false', () => {
    render(<AnimatePresence show={false}>Hidden</AnimatePresence>);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('calls onEntered after enter animation', () => {
    const onEntered = vi.fn();
    render(
      <AnimatePresence show={true} variant="fade" onEntered={onEntered}>
        Content
      </AnimatePresence>,
    );

    expect(onEntered).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DURATION.slow + 10);
    });

    expect(onEntered).toHaveBeenCalledOnce();
  });

  it('sets data-phase to entering initially', () => {
    const { container } = render(<AnimatePresence show={true}>Phase test</AnimatePresence>);
    const el = container.querySelector('[data-phase]') as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.getAttribute('data-phase')).toBe('entering');
  });

  it('sets data-phase to entered after duration', () => {
    const { container } = render(<AnimatePresence show={true}>Phase test 2</AnimatePresence>);
    const el = container.querySelector('[data-phase]') as HTMLElement;

    act(() => {
      vi.advanceTimersByTime(DURATION.slow + 10);
    });

    expect(el.getAttribute('data-phase')).toBe('entered');
  });
});

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */
describe('Skeleton', () => {
  it('renders with status role', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible "Loading" label', () => {
    render(<Skeleton />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('renders as text variant by default', () => {
    render(<Skeleton />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('cs-skeleton--text');
  });

  it('renders circle variant', () => {
    render(<Skeleton variant="circle" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('cs-skeleton--circle');
    expect(el.style.borderRadius).toBe('50%');
  });

  it('renders rect variant', () => {
    render(<Skeleton variant="rect" width={200} height={100} />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('cs-skeleton--rect');
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('100px');
  });

  it('renders multiple lines for text variant', () => {
    render(<Skeleton variant="text" lines={3} />);
    const group = screen.getByRole('status');
    const skeletonLines = group.querySelectorAll('.cs-skeleton--text');
    expect(skeletonLines.length).toBe(3);
  });

  it('last line in multi-line is shorter (75%)', () => {
    render(<Skeleton variant="text" lines={3} />);
    const group = screen.getByRole('status');
    const skeletonLines = group.querySelectorAll('.cs-skeleton--text');
    const lastLine = skeletonLines[2] as HTMLElement;
    expect(lastLine.style.width).toBe('75%');
  });

  it('disables animation when animate=false', () => {
    render(<Skeleton animate={false} />);
    const el = screen.getByRole('status');
    expect(el.style.animation).toBe('none');
  });
});

/* ------------------------------------------------------------------ */
/* Shimmer                                                             */
/* ------------------------------------------------------------------ */
describe('Shimmer', () => {
  it('renders with status role', () => {
    render(<Shimmer />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<Shimmer />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('contains a sweep overlay when animate=true', () => {
    render(<Shimmer animate={true} />);
    const el = screen.getByRole('status');
    const sweep = el.querySelector('.cs-shimmer__sweep');
    expect(sweep).not.toBeNull();
  });

  it('does not contain sweep when animate=false', () => {
    render(<Shimmer animate={false} />);
    const el = screen.getByRole('status');
    const sweep = el.querySelector('.cs-shimmer__sweep');
    expect(sweep).toBeNull();
  });

  it('applies custom width and height', () => {
    render(<Shimmer width={300} height={50} />);
    const el = screen.getByRole('status');
    expect(el.style.width).toBe('300px');
    expect(el.style.height).toBe('50px');
  });
});

/* ------------------------------------------------------------------ */
/* PulseLoader                                                         */
/* ------------------------------------------------------------------ */
describe('PulseLoader', () => {
  it('renders with status role', () => {
    render(<PulseLoader />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders 3 dots by default', () => {
    render(<PulseLoader />);
    const el = screen.getByRole('status');
    const dots = el.querySelectorAll('span[aria-hidden="true"]');
    expect(dots.length).toBe(3);
  });

  it('renders custom number of dots', () => {
    render(<PulseLoader dots={5} />);
    const el = screen.getByRole('status');
    const dots = el.querySelectorAll('span[aria-hidden="true"]');
    expect(dots.length).toBe(5);
  });

  it('applies custom dot size', () => {
    render(<PulseLoader size={12} />);
    const el = screen.getByRole('status');
    const dot = el.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(dot.style.width).toBe('12px');
    expect(dot.style.height).toBe('12px');
  });

  it('applies custom color', () => {
    render(<PulseLoader color="red" />);
    const el = screen.getByRole('status');
    const dot = el.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(dot.style.backgroundColor).toBe('red');
  });
});

/* ------------------------------------------------------------------ */
/* StaggerList                                                         */
/* ------------------------------------------------------------------ */
describe('StaggerList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders all children', () => {
    render(
      <StaggerList>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </StaggerList>,
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('wraps each child in a stagger-item container', () => {
    render(
      <StaggerList>
        <div>A</div>
        <div>B</div>
      </StaggerList>,
    );
    const items = document.querySelectorAll('.cs-stagger-item');
    expect(items.length).toBe(2);
  });

  it('applies incremental transition delays to children', () => {
    render(
      <StaggerList staggerDelay={50}>
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </StaggerList>,
    );
    const items = document.querySelectorAll('.cs-stagger-item');
    expect((items[0] as HTMLElement).style.transition).toContain('0ms');
    expect((items[1] as HTMLElement).style.transition).toContain('50ms');
    expect((items[2] as HTMLElement).style.transition).toContain('100ms');
  });

  it('caps delay at maxDelay', () => {
    render(
      <StaggerList staggerDelay={200} maxDelay={300}>
        <div>A</div>
        <div>B</div>
        <div>C</div>
        <div>D</div>
      </StaggerList>,
    );
    const items = document.querySelectorAll('.cs-stagger-item');
    expect((items[2] as HTMLElement).style.transition).toContain('300ms');
    expect((items[3] as HTMLElement).style.transition).toContain('300ms');
  });
});

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */
describe('Animation constants', () => {
  it('exports DURATION with expected keys', () => {
    expect(DURATION.instant).toBe(50);
    expect(DURATION.fast).toBe(100);
    expect(DURATION.normal).toBe(150);
    expect(DURATION.moderate).toBe(200);
    expect(DURATION.slow).toBe(300);
    expect(DURATION.enter).toBe(250);
    expect(DURATION.exit).toBe(200);
    expect(DURATION.page).toBe(350);
  });

  it('exports EASING with valid CSS values', () => {
    expect(EASING.default).toContain('cubic-bezier');
    expect(EASING.in).toContain('cubic-bezier');
    expect(EASING.out).toContain('cubic-bezier');
    expect(EASING.spring).toContain('cubic-bezier');
  });

  it('exports STAGGER with expected defaults', () => {
    expect(STAGGER.delay).toBe(40);
    expect(STAGGER.maxDelay).toBe(500);
    expect(STAGGER.maxItems).toBe(12);
  });
});
