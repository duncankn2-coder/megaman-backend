'use client';

import React, { useEffect, useState } from 'react';
import { useDocumentInfo } from '@payloadcms/ui';

interface MediaObj {
  id?: string;
  url?: string;
  filename?: string;
  alt?: string;
}

interface ProductData {
  id: string;
  name: string;
  lightSpectrumGraph?: MediaObj | string | null;
  lineDrawing?: MediaObj | string | null;
  photometricPolarDiagram?: MediaObj | string | null;
  beamAngleDiagram?: MediaObj | string | null;
  techDocLightSource?: MediaObj | string | null;
  techDocControlGear?: MediaObj | string | null;
  techDocContainingProduct?: MediaObj | string | null;
  datasheetPdf?: MediaObj | string | null;
}

export const ProductQuickDownloads: React.FC = () => {
  const { id } = useDocumentInfo();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function fetchProductDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}?depth=1`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setProduct(data);
          }
        }
      } catch (err) {
        console.error('Error fetching product for Quick Downloads component:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProductDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!id) {
    return (
      <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.1)', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
        Save product first to generate Quick Downloads & Spectrum links.
      </div>
    );
  }

  const getMediaUrl = (media: MediaObj | string | null | undefined): string | null => {
    if (!media) return null;
    if (typeof media === 'string') {
      return media.startsWith('http') ? media : `/api/media/file/${media}`;
    }
    if (media.url) {
      return media.url.startsWith('http') ? media.url : media.url;
    }
    if (media.filename) {
      return `/api/media/file/${media.filename}`;
    }
    return null;
  };

  const spectrumUrl = getMediaUrl(product?.lightSpectrumGraph);
  const lineDrawingUrl = getMediaUrl(product?.lineDrawing);
  const polarUrl = getMediaUrl(product?.photometricPolarDiagram);
  const beamUrl = getMediaUrl(product?.beamAngleDiagram);

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    marginBottom: '0.4rem',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#94a3b8',
    marginTop: '0.85rem',
    marginBottom: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#009fe3' }}>
          📥 Quick Downloads
        </span>
        {loading && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Loading...</span>}
      </div>

      {/* 1. TECHNICAL DOCUMENTS */}
      <div style={sectionHeaderStyle}>
        📄 Merged Technical Documents
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <a 
          href={`/api/products/${id}/technical-document?type=datasheet`}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
        >
          <span>Datasheet PDF</span>
          <span>↗</span>
        </a>
        <a 
          href={`/api/products/${id}/technical-document?type=light-source`}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
        >
          <span>Tech Doc - Light Source</span>
          <span>↗</span>
        </a>
        <a 
          href={`/api/products/${id}/technical-document?type=control-gear`}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
        >
          <span>Tech Doc - Control Gear</span>
          <span>↗</span>
        </a>
        <a 
          href={`/api/products/${id}/technical-document?type=containing-product`}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
        >
          <span>Tech Doc - Containing Product</span>
          <span>↗</span>
        </a>
      </div>

      {/* 2. SPECTRUM GRAPH & ASSETS */}
      <div style={sectionHeaderStyle}>
        🌈 Spectrum Graph & Drawings
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {spectrumUrl ? (
          <div>
            <a 
              href={spectrumUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              style={{
                ...buttonStyle,
                color: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.08)',
                borderColor: 'rgba(74, 222, 128, 0.25)',
              }}
            >
              <span>Download Spectrum Graph Image</span>
              <span>↓</span>
            </a>
            {/* Image Preview Thumbnail */}
            <div style={{ marginTop: '0.25rem', marginBottom: '0.5rem', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#000', textAlign: 'center', padding: '4px' }}>
              <img 
                src={spectrumUrl} 
                alt="Light Spectrum Graph" 
                style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', marginBottom: '0.4rem' }}>
            No Spectrum Graph Image uploaded
          </div>
        )}

        {lineDrawingUrl && (
          <a 
            href={lineDrawingUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={buttonStyle}
          >
            <span>Download Line Drawing</span>
            <span>↓</span>
          </a>
        )}

        {polarUrl && (
          <a 
            href={polarUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={buttonStyle}
          >
            <span>Download Polar Diagram</span>
            <span>↓</span>
          </a>
        )}

        {beamUrl && (
          <a 
            href={beamUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={buttonStyle}
          >
            <span>Download Beam Angle Diagram</span>
            <span>↓</span>
          </a>
        )}
      </div>
    </div>
  );
};
