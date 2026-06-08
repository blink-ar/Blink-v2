import React, { useState, useMemo } from 'react';
import { toBankDescriptor } from '../../utils/banks';
import { getBankAccent } from '../../utils/bankColors';
import { bankLogosManifest } from '../../data/bankLogosManifest';

interface BankLogoProps {
  bankName: string;
  size?: number;
  className?: string;
}

const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const lookupManifestEntry = (bankName: string) => {
  const direct = bankLogosManifest[bankName];
  if (direct) return direct;

  const normalized = normalizeKey(bankName);
  if (normalized) {
    if (bankLogosManifest[normalized]) return bankLogosManifest[normalized];
    if (normalized.startsWith('banco')) {
      const stripped = normalized.slice(5);
      if (stripped && bankLogosManifest[stripped]) return bankLogosManifest[stripped];
    }
  }

  const descriptor = toBankDescriptor(bankName);
  return bankLogosManifest[descriptor.logoKey] ?? null;
};

const BankLogo: React.FC<BankLogoProps> = ({ bankName, size = 28, className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const entry = useMemo(() => lookupManifestEntry(bankName), [bankName]);
  const descriptor = useMemo(() => toBankDescriptor(bankName), [bankName]);
  const accent = useMemo(() => getBankAccent(bankName), [bankName]);

  const circleStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (entry && !imageFailed) {
    return (
      <div
        className={className}
        style={{
          ...circleStyle,
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
        }}
        aria-label={`Logo de ${entry.name || bankName}`}
      >
        <img
          src={`/banks/${entry.file}`}
          alt={entry.name || bankName}
          onError={() => setImageFailed(true)}
          style={{ width: '125%', height: '125%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  const fontSize = Math.max(8, Math.round(size * 0.36));
  return (
    <div
      className={className}
      style={{
        ...circleStyle,
        backgroundColor: accent.text,
        color: '#ffffff',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.02em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      aria-label={`Logo de ${bankName}`}
    >
      {descriptor.code}
    </div>
  );
};

export default BankLogo;
