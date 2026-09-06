import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '2.5rem' }}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="btn-secondary"
        style={{ padding: '0.5rem 0.75rem', opacity: currentPage === 1 ? 0.5 : 1 }}
      >
        <ChevronLeft size={16} /> Prev
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={currentPage === page ? 'btn-primary' : 'btn-secondary'}
          style={{ width: '38px', height: '38px', padding: 0, fontSize: '0.9rem' }}
        >
          {page}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="btn-secondary"
        style={{ padding: '0.5rem 0.75rem', opacity: currentPage === totalPages ? 0.5 : 1 }}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
