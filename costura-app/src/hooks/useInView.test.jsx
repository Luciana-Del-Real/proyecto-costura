// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useInView } from './useInView';

/**
 * useInView (extracted for course-page scroll animations):
 * - accepts a number (threshold shorthand) or an options object
 * - defaults: threshold 0.15, once true
 * - sets inView true on the first intersecting entry and disconnects when once
 * - SSR guard: no-op when IntersectionObserver is unavailable
 *
 * IntersectionObserver is mocked with a class that captures the callback and
 * options so tests can drive visibility through MockIO.lastCb.
 */
let lastCb = null;
let lastOpts = null;
let disconnected = 0;

class MockIO {
  constructor(cb, opts) {
    lastCb = cb;
    lastOpts = opts;
  }
  observe() {}
  disconnect() {
    disconnected += 1;
  }
}

function Harness({ options }) {
  const [ref, inView] = useInView(options);
  return (
    <div>
      <div ref={ref} data-testid="el" />
      <span data-testid="inview">{String(inView)}</span>
    </div>
  );
}

const roots = [];

async function renderApp(options) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<Harness options={options} />);
  });
  return { container };
}

describe('useInView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastCb = null;
    lastOpts = null;
    disconnected = 0;
    vi.stubGlobal('IntersectionObserver', MockIO);
  });

  afterEach(async () => {
    for (const root of roots) await act(async () => root.unmount());
    roots.length = 0;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('honors a number option as the threshold', async () => {
    await renderApp(0.2);

    expect(lastOpts.threshold).toBe(0.2);
  });

  it('defaults the threshold to 0.15', async () => {
    await renderApp();

    expect(lastOpts.threshold).toBe(0.15);
  });

  it('sets inView true when the observed element intersects', async () => {
    const { container } = await renderApp();
    const inview = container.querySelector('[data-testid="inview"]');
    expect(inview.textContent).toBe('false');

    await act(async () => {
      lastCb([{ isIntersecting: true }]);
    });

    expect(inview.textContent).toBe('true');
  });

  it('disconnects the observer after the first intersect (once default)', async () => {
    const { container } = await renderApp();

    await act(async () => {
      lastCb([{ isIntersecting: true }]);
    });

    expect(container.querySelector('[data-testid="inview"]').textContent).toBe('true');
    expect(disconnected).toBeGreaterThanOrEqual(1);
  });

  it('keeps observing when once is false', async () => {
    const { container } = await renderApp({ once: false });

    await act(async () => {
      lastCb([{ isIntersecting: true }]);
    });

    expect(container.querySelector('[data-testid="inview"]').textContent).toBe('true');
    expect(disconnected).toBe(0); // still observing after intersect
  });

  it('SSR guard: without IntersectionObserver the hook does not throw and inView stays false', async () => {
    // vitest's stubGlobal defines the property as present-but-undefined, while
    // the hook guards on property PRESENCE ('IntersectionObserver' in window),
    // so the property must be removed to simulate a real environment without
    // IntersectionObserver (jsdom has none natively; SSR has no window at all).
    vi.stubGlobal('IntersectionObserver', undefined);
    Reflect.deleteProperty(globalThis, 'IntersectionObserver');

    const { container } = await renderApp();

    expect(container.querySelector('[data-testid="inview"]').textContent).toBe('false');
  });
});