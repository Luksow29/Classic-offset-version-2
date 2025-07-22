import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  className?: string;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  isLoading?: boolean;
}

function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 60,
  className = '',
  onRowClick,
  keyExtractor,
  emptyState,
  loadingState,
  isLoading = false,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  if (isLoading && loadingState) {
    return <>{loadingState}</>;
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={`overflow-auto ${className}`} ref={parentRef} style={{ height: '500px' }}>
      <div className="w-full relative">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = data[virtualRow.index];
              return (
                <tr
                  key={keyExtractor(item)}
                  className={`hover:bg-muted/20 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  data-index={virtualRow.index}
                >
                  {columns.map((column) => (
                    <td key={`${keyExtractor(item)}-${column.key}`} className={`px-4 py-3 ${column.className || ''}`}>
                      {column.cell(item)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VirtualizedTable;