import { useTranslation } from 'react-i18next';

export default function Pagination({ page, total, perPage = 10, totalPages: explicitTotalPages, onPageChange }) {
  const { t } = useTranslation();
  const totalPages = explicitTotalPages ?? Math.max(1, Math.ceil(total / perPage));

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <span className="text-xs text-text-tan font-medium">
        {t('pagination.page', { page, total: totalPages })}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="btn btn-ghost text-sm"
        >
          {t('pagination.previous')}
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="btn btn-ghost text-sm"
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
}