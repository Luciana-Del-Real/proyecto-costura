// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import useLessonComments from './useLessonComments';

/**
 * useLessonComments state machine (extracted from CourseDetail/AdminCourseForm):
 * - lazy fetch that REFETCHES on every lesson open (fresh replies)
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
  postForm: vi.fn(),
}));

vi.mock('../services/api', () => ({ get: mocks.get, post: mocks.post, postForm: mocks.postForm }));

function Harness({ lessonId = 'l1', message = 'Hola', replyTo = null, imageFile = null }) {
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
      <button id="sendreply" onClick={() => sendComment(lessonId, message, replyTo)}>
        sendreply
      </button>
      <button id="sendimage" onClick={() => sendComment(lessonId, message, replyTo, imageFile)}>
        sendimage
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

  it('loadComments refetches on every open (fresh replies)', async () => {
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

    // Una segunda apertura debe REFETCHEAR: la profesora pudo responder
    // mientras la lección estaba cerrada.
    mocks.get.mockResolvedValueOnce([
      { id: 'c1', message: 'primera' },
      { id: 'c2', message: 'segunda' },
    ]);
    await act(async () => click(container, 'load'));
    await act(async () => {});

    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(readState(container).commentsByLesson.l1.items).toEqual([
      { id: 'c1', message: 'primera' },
      { id: 'c2', message: 'segunda' },
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

  it('sendComment with a parentId posts { message, parentId } and does not clear the lesson draft', async () => {
    mocks.post.mockResolvedValueOnce({ id: 'c10', message: 'Respuesta', parentId: 'c1' });
    const { container } = await renderApp({ message: 'Respuesta', replyTo: 'c1' });

    await act(async () => click(container, 'setdraft'));
    await act(async () => click(container, 'sendreply'));
    await act(async () => {}); // flush the post microtask

    expect(mocks.post).toHaveBeenCalledTimes(1);
    expect(mocks.post).toHaveBeenCalledWith('/lessons/l1/comments', {
      message: 'Respuesta',
      parentId: 'c1',
    });
    const state = readState(container);
    expect(state.commentsByLesson.l1.items).toEqual([
      { id: 'c10', message: 'Respuesta', parentId: 'c1' },
    ]);
    // Las respuestas de un hilo no tocan el draft del input principal.
    expect(state.drafts.l1).toBe('abc');
    expect(state.sendingFor).toBeNull();
  });

  it('sendComment with an imageFile posts FormData via postForm and appends the created comment', async () => {
    const imageFile = new File(['foto-bytes'], 'foto.jpg', { type: 'image/jpeg' });
    mocks.postForm.mockResolvedValueOnce({
      id: 'c11',
      message: 'Hola',
      image: '/uploads/comments/image-1.jpg',
    });
    const { container } = await renderApp({ message: 'Hola', imageFile });

    await act(async () => click(container, 'setdraft'));
    await act(async () => click(container, 'sendimage'));
    await act(async () => {}); // flush the postForm microtask

    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.postForm).toHaveBeenCalledTimes(1);
    const [url, body] = mocks.postForm.mock.calls[0];
    expect(url).toBe('/lessons/l1/comments');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('message')).toBe('Hola');
    expect(body.get('image')).toBe(imageFile);
    expect(body.has('parentId')).toBe(false);
    const state = readState(container);
    expect(state.commentsByLesson.l1.items).toEqual([
      { id: 'c11', message: 'Hola', image: '/uploads/comments/image-1.jpg' },
    ]);
    expect(state.drafts.l1).toBe('');
    expect(state.sendingFor).toBeNull();
  });

  it('sendComment with an imageFile as reply includes parentId in the FormData', async () => {
    const imageFile = new File(['foto-bytes'], 'foto.jpg', { type: 'image/jpeg' });
    mocks.postForm.mockResolvedValueOnce({
      id: 'c12',
      message: 'Respuesta',
      parentId: 'c1',
      image: '/uploads/comments/image-2.jpg',
    });
    const { container } = await renderApp({ message: 'Respuesta', replyTo: 'c1', imageFile });

    await act(async () => click(container, 'setdraft'));
    await act(async () => click(container, 'sendimage'));
    await act(async () => {}); // flush the postForm microtask

    const [url, body] = mocks.postForm.mock.calls[0];
    expect(url).toBe('/lessons/l1/comments');
    expect(body.get('message')).toBe('Respuesta');
    expect(body.get('parentId')).toBe('c1');
    expect(body.get('image')).toBe(imageFile);
    // Las respuestas de un hilo no tocan el draft del input principal.
    expect(readState(container).drafts.l1).toBe('abc');
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