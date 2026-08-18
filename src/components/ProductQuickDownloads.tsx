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
  families?: {
    id?: string;
    name?: string;
    dismantleInstructionPdf?: MediaObj | string | null;
  } | string | null;
}

export const ProductQuickDownloads: React.FC = () => {
  const { id } = useDocumentInfo();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [eprelRegNo, setEprelRegNo] = useState<string>('');
  const [onMarketStartDate, setOnMarketStartDate] = useState<string>('2027-01-01');

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function fetchProductDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}?depth=2`);
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

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL 
    || process.env.PAYLOAD_PUBLIC_FRONTEND_URL 
    || (typeof window !== 'undefined' && window.location.hostname.includes('localhost') 
        ? 'http://localhost:3001' 
        : 'https://megaman-frontend.vercel.app');

  const spectrumUrl = getMediaUrl(product?.lightSpectrumGraph);
  const lineDrawingUrl = getMediaUrl(product?.lineDrawing);
  const polarUrl = getMediaUrl(product?.photometricPolarDiagram);
  const beamUrl = getMediaUrl(product?.beamAngleDiagram);
  
  const familyObj = typeof product?.families === 'object' && product?.families !== null ? product.families : null;
  const dismantlePdfUrl = getMediaUrl(familyObj?.dismantleInstructionPdf);

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

  const modelIdentifier = (product as any)?.specifications?.model_identifier 
    || (product as any)?.specifications?.light_source_model_no 
    || product?.name 
    || '';

  const handleDownloadEprelXml = () => {
    if (!id) return;
    const params = new URLSearchParams();
    if (eprelRegNo) params.set('regNumber', eprelRegNo.trim());
    if (onMarketStartDate) params.set('startDate', onMarketStartDate.trim());

    window.open(`/api/products/${id}/eprel-xml?${params.toString()}`, '_blank');
  };

  return (
    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#009fe3' }}>
          📥 Quick Downloads
        </span>
        {loading && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Loading...</span>}
      </div>

      {/* 1. EPREL BULK UPLOAD XML */}
      <div style={sectionHeaderStyle}>
        📦 EPREL Bulk Upload XML
      </div>
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.6)', 
        border: '1px solid rgba(56, 189, 248, 0.25)', 
        borderRadius: '8px', 
        padding: '0.75rem', 
        marginBottom: '0.85rem' 
      }}>
        {modelIdentifier && (
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
            <span style={{ color: '#64748b' }}>Model Identifier (Col BZ): </span>
            <strong style={{ color: '#38bdf8' }}>{modelIdentifier}</strong>
          </div>
        )}

        <div style={{ marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
            EPREL Reg Number:
          </label>
          <input 
            type="text" 
            placeholder="e.g. 2820811"
            value={eprelRegNo}
            onChange={(e) => setEprelRegNo(e.target.value)}
            style={{
              width: '100%',
              padding: '0.35rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '0.6rem' }}>
          <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
            On Market Start Date:
          </label>
          <input 
            type="date" 
            value={onMarketStartDate}
            onChange={(e) => setOnMarketStartDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.35rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleDownloadEprelXml}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: '1px solid #38bdf8',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <span>Export registration-data.xml</span>
          <span>↓</span>
        </button>
      </div>

      {/* 2. FULL TECHNICAL DOCUMENTS (WEB PREVIEW & PDF PRINT) */}
      <div style={sectionHeaderStyle}>
        📄 Full Technical Documents (Web & Print PDF)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <a 
          href={`${frontendUrl}/products/${id}/eprel-light-source`}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
        >
          <span>Tech Doc - Light Source</span>
          <span>↗</span>
        </a>
        <a 
          href={`${frontendUrl}/products/${id}/control-gear`}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
        >
          <span>Tech Doc - Control Gear</span>
          <span>↗</span>
        </a>
        <a 
          href={`${frontendUrl}/products/${id}/containing-product`}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
        >
          <span>Tech Doc - Containing Product</span>
          <span>↗</span>
        </a>
      </div>

      {/* 3. SPECTRUM GRAPH & MEDIA ASSETS */}
      <div style={sectionHeaderStyle}>
        🌈 Spectrum Graph & Image Assets
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

        {dismantlePdfUrl && (
          <a 
            href={dismantlePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={{
              ...buttonStyle,
              color: '#fbbf24',
              backgroundColor: 'rgba(251, 191, 36, 0.08)',
              borderColor: 'rgba(251, 191, 36, 0.25)',
            }}
          >
            <span>Download Dismantle Instruction PDF</span>
            <span>↓</span>
          </a>
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

