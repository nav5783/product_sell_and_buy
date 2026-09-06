import React from 'react';
import { PackageX } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  title = 'No items found',
  description = 'Try adjusting your search query or reset your filter criteria to see results.',
  actionText,
  actionLink,
  onActionClick,
}) => {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3.5rem 1.5rem', width: '100%', margin: '1rem 0' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
        <PackageX size={32} />
      </div>

      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '1.5rem', lineHeight: '1.5' }}>
        {description}
      </p>

      {actionText && (
        actionLink ? (
          <Link to={actionLink} className="btn-primary">
            {actionText}
          </Link>
        ) : (
          <button onClick={onActionClick} className="btn-primary">
            {actionText}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
