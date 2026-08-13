import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '',
  style 
}) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, ...style }}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`skeleton-text-container ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm, 8px)' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={`skel-line-${i}`} 
          width={i === lines - 1 && lines > 1 ? '70%' : '100%'} 
          height="16px" 
        />
      ))}
    </div>
  );
};
