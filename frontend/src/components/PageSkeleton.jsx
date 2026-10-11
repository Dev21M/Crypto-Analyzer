import React from 'react';

export function PageSkeleton() {
  return (
    <div className="flex-1 p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-tertiary rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-tertiary rounded" />
          ))}
        </div>
        <div className="h-96 bg-tertiary rounded" />
      </div>
    </div>
  );
}

export default PageSkeleton;