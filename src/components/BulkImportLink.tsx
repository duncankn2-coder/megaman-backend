"use client";

import React from 'react'

export const BulkImportLink: React.FC = () => {
  return (
    <div style={{ padding: '0 0 1rem 0' }}>
      <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '1.5rem 0 1.5rem 0', opacity: 0.15 }} />
      <span 
        style={{ 
          fontSize: '0.7rem', 
          fontWeight: 'bold', 
          textTransform: 'uppercase', 
          letterSpacing: '0.15em', 
          color: '#64748b', 
          display: 'block', 
          marginBottom: '0.75rem',
          padding: '0 1rem'
        }}
      >
        Data Utilities
      </span>
      <a 
        href="/api/products/bulk-import" 
        target="_blank"
        rel="noopener noreferrer"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '0.65rem 1rem', 
          fontSize: '0.85rem', 
          color: '#cbd5e1', 
          textDecoration: 'none', 
          borderRadius: '8px', 
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.2s ease',
          fontWeight: 500
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.color = '#cbd5e1';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>📊</span>
        <span>Excel / JSON Bulk Importer</span>
      </a>
    </div>
  )
}
