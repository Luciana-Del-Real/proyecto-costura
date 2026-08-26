import { useState } from 'react';

const MAX_CHARS = 125;

function truncate(text, max) {
  if (text.length <= max) return { short: text, isTruncated: false };
  // Cortar por palabra para no dejar a mitad
  let cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  return { short: `${cut}…`, isTruncated: true };
}

export default function TestimonialCard({ testimonial }) {
  const [expanded, setExpanded] = useState(false);
  const { short, isTruncated } = truncate(testimonial.text, MAX_CHARS);

  return (
    <div className="card-glow rounded-2xl p-6 h-full flex flex-col justify-between">
      <div>
        <p className="text-text-ink text-sm mb-4 italic leading-relaxed">
          "{expanded ? testimonial.text : short}"
        </p>
        {isTruncated && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary hover:text-primary-hover text-xs font-semibold underline underline-offset-2 mb-4 transition-colors"
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>
      <div>
        <p className="font-semibold text-text-ink text-sm">{testimonial.name}</p>
        <p className="text-text-ink text-xs">{testimonial.course}</p>
      </div>
    </div>
  );
}