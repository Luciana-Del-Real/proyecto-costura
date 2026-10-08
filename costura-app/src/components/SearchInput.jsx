// Shared search input: the magnifier icon + grey pill input used across the
// public pages and admin lists. The grey border is intentional (search inputs
// keep it, see the ui-consistency-unification spec) — do not swap it for a
// token colour.
//
// `className` targets the relative WRAPPER (callers keep their width, e.g.
// `w-full md:w-72` or `w-full max-w-sm`); `inputClassName` targets the input.
export default function SearchInput({ value, onChange, placeholder, className = '', inputClassName = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 hover:border-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-300 ${inputClassName}`}
      />
    </div>
  );
}