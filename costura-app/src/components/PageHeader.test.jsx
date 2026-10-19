import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PageHeader from './PageHeader';

const rootClass = (html) => html.match(/<header class="([^"]*)"/)?.[1] ?? '';

describe('PageHeader', () => {
  it('renders the title as an h1', () => {
    const html = renderToStaticMarkup(<PageHeader title="Todos los cursos" />);
    expect(html).toContain('<h1');
    expect(html).toContain('Todos los cursos');
  });

  it('renders the subtitle when provided', () => {
    const html = renderToStaticMarkup(<PageHeader title="Patrones gratis" subtitle="Descargá patrones en PDF" />);
    expect(html).toContain('<p');
    expect(html).toContain('Descargá patrones en PDF');
  });

  it('does not render a subtitle when omitted', () => {
    const html = renderToStaticMarkup(<PageHeader title="Todos los cursos" />);
    expect(html).not.toContain('<p');
  });

  it('renders the action on the same row as the subtitle', () => {
    const html = renderToStaticMarkup(
      <PageHeader
        title="Mis cursos"
        subtitle="2 cursos adquiridos"
        action={<a href="/mis-cursos">Ver todos →</a>}
      />
    );

    // Subtitle and action share a single flex row container.
    const row = html.match(/<div class="[^"]*\bflex\b[^"]*">(.*?)<\/div>/)?.[1] ?? '';
    expect(row).toContain('<p');
    expect(row).toContain('2 cursos adquiridos');
    expect(row).toContain('Ver todos →');
    // The action is a DIRECT sibling of the subtitle, not a separate row below it.
    expect(row).toMatch(/<\/p><a href="\/mis-cursos">Ver todos →<\/a>/);
  });

  it('renders the accent bar by default', () => {
    const html = renderToStaticMarkup(<PageHeader title="Todos los cursos" />);
    expect(html).toContain('bg-primary');
    expect(html).toContain('aria-hidden="true"');
  });

  it('hides the accent bar when accent is false', () => {
    const html = renderToStaticMarkup(<PageHeader title="Todos los cursos" accent={false} />);
    expect(html).not.toContain('bg-primary');
  });

  it('always renders a header element, including empty states', () => {
    const html = renderToStaticMarkup(<PageHeader title="Mis favoritos" />);
    expect(html).toContain('<header');
  });

  it('renders without props without throwing', () => {
    const html = renderToStaticMarkup(<PageHeader />);
    expect(html).toContain('<header');
  });

  it('root header has no box-surface class', () => {
    const html = renderToStaticMarkup(<PageHeader title="Todos los cursos" subtitle="Subtítulo" />);
    const tokens = rootClass(html).split(/\s+/);
    const boxTokens = tokens.filter(t => /^(card|bg-white|border|shadow|rounded)/.test(t));
    expect(boxTokens).toEqual([]);
  });
});