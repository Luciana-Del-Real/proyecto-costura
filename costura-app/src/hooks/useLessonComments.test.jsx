// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import useLessonComments from './useLessonComments';

/**
 * useLessonComments state machine (extracted from CourseDetail/AdminCourseForm):
 * - lazy fetch with a per-lesson loaded guard (one fetch per lesson)
 * - optimistic send: trims the message, appends the created comment, clears
 *   the draft, and keeps the draft + alerts on error
 * - per-lesson drafts
 *
 * The services/api boundary is mocked; the hook is driven through a Harness
 * component (same pattern as FavoritesContext.test.jsx).
 */
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../services/api', () => ({ get: mocks.get, post: mocks.post }));

function Harness({ lessonId = 'l1', message = 'Hola' }) {
  const { commentsByLesson, loadComments, sendComment, drafts, setDraft, sendingFor } =
    useLessonComments();
  return (
    <div>
      <span data-testid="state">{JSON.stringify({ commentsByLesson, drafts, sendingFor })}</span>
      <button id="load" onClick={() => loadComments(lessonId)}>
        load
      </button>
      <button id="send" onClick={() => sendComment(lessonId, message)}>
        send
      </button>
      <button id="setdraft" onClick={() => setDraft(lessonId, 'abc')}>
        setdraft
      </button>
    </div>
  );
}

const roots = [];

async function renderApp(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<Harness {...props} />);
  });
  return { container };
}

function readState(container) {
  return JSON.parse(container.querySelector('[data-testid="state"]').textContent);
}

function click(container, id) {
  container.querySelector(`#${id}`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('useLessonComments', () => {
  beforeEach(() => {
    // reset (not clear) so unconsumed mockResolvedValueOnce queues from a
    // previous test cannot leak into the next one (e.g. a loaded-guard test
    // that never consumes its second queued value).
    vi.resetAllMocks();
    mocks.get.mockResolvedValue([]);
    mocks.post.mockResolvedValue({});
  });

  afterEach(async () => {
    for (const root of roots) await act(async () => root.unmount());
    roots.length = 0;
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('loadComments fetches once per lesson (loaded guard)', async () => {
    mocks.get.mockResolvedValueOnce([{ id: 'c1', message: 'primera' }]);
    const { container } = await renderApp();

    await act(async () => click(container, 'load'));
    await act(async () => {}); // flush the fetch microtask

    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith('/lessons/l1/comments');
    expect(readState(container).commentsByLesson.l1).toEqual({
      loaded: true,
      items: [{ id: 'c1', message: 'primera' }],
      loading: false,
    });

    // A second load with a different result must NOT re-fetch.
    mocks.get.mockResolvedValueOnce([{ id: 'c2', message: 'segunda' }]);
    await act(async () => click(container, 'load'));
    await act(async () => {});

    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(readState(container).commentsByLesson.l1.items).toEqual([
      { id: 'c1', message: 'primera' },
    ]);
  });

  it('loadComments marks the lesson loaded with empty items when get rejects', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.get.mockRejectedValueOnce(new Error('boom'));
    const { container } = await renderApp();

    await act(async () => click(container, 'load'));
    await act(async () => {});

    expect(readState(container).commentsByLesson.l1).toEqual({
      loaded: true,
      items: [],
      loading: false,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('sendComment trims the message, posts, appends optimistically and clears the draft', async () => {
    mocks.post.mockResolvedValueOnce({ id: 'c9', message: 'Hola' });
    const { container } = await renderApp({ message: '  Hola  ' });

    await act(async () => click(container, 'setdraft'));
    await act(async () => click(container, 'send'));
    await act(async () => {}); // flush the post microtask

    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.post).toHaveBeenCalledWith('/lessons/l1/comments', { message: 'Hola' });
    const state = readState(container);
    expect(state.commentsByLesson.l1.items).toEqual([{ id: 'c9', message: 'Hola' }]);
    expect(state.drafts.l1).toBe('');
    expect(state.sendingFor).toBeNull();
  });

  it('sendComment with a blank message is a no-op (no post)', async () => {
    const { container } = await renderApp({ message: '   ' });

    await act(async () => click(container, 'send'));
    await act(async () => {});

    expect(mocks.post).not.toHaveBeenCalled();
    expect(readState(container).sendingFor).toBeNull();
  });

  it('sendComment on error alerts, keeps the draft and clears sendingFor', async () => {
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.post.mockRejectedValueOnce(new Error('boom'));
    const { container } = await renderApp();

    await act(async () => click(container, 'setdraft'));
    await act(async () => click(container, 'send'));
    await act(async () => {}); // flush the rejection microtask

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('No se pudo enviar'));
    const state = readState(container);
    expect(state.drafts.l1).toBe('abc'); // draft preserved on error
    expect(state.sendingFor).toBeNull();
    expect(state.commentsByLesson.l1).toBeUndefined();
    errorSpy.mockRestore();
  });

  it('setDraft stores the draft per lesson', async () => {
    const { container } = await renderApp();

    await act(async () => click(container, 'setdraft'));

    expect(readState(container).drafts.l1).toBe('abc');
  });
});