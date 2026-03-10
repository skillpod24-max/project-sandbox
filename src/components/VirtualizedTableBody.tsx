import { useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

interface VirtualizedTableBodyProps<T> {
  items: T[];
  estimateSize?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  colSpan?: number;
}

/**
 * Drop-in replacement for TableBody that virtualizes rows.
 * Only renders visible rows in the DOM, even with 10,000+ items.
 * 
 * Usage:
 * Replace <TableBody>{items.map(...)}</TableBody>
 * with <VirtualizedTableBody items={items} renderRow={(item) => <TableRow>...</TableRow>} />
 */
function VirtualizedTableBodyInner<T>({
  items,
  estimateSize = 48,
  renderRow,
  emptyMessage = "No data found",
  colSpan = 8,
}: VirtualizedTableBodyProps<T>) {
  const parentRef = useRef<HTMLTableSectionElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => {
      // Find the scrollable parent (the overflow container)
      let el = parentRef.current?.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
          return el;
        }
        el = el.parentElement;
      }
      return document.documentElement;
    },
    estimateSize: () => estimateSize,
    overscan: 10,
  });

  if (items.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <TableBody ref={parentRef}>
      {virtualRows.length > 0 && virtualRows[0].start > 0 && (
        <tr>
          <td colSpan={colSpan} style={{ height: virtualRows[0].start, padding: 0, border: 'none' }} />
        </tr>
      )}
      {virtualRows.map((virtualRow) => {
        const item = items[virtualRow.index];
        return renderRow(item, virtualRow.index);
      })}
      {virtualRows.length > 0 && virtualRows[virtualRows.length - 1].end < totalSize && (
        <tr>
          <td colSpan={colSpan} style={{ height: totalSize - virtualRows[virtualRows.length - 1].end, padding: 0, border: 'none' }} />
        </tr>
      )}
    </TableBody>
  );
}

export const VirtualizedTableBody = memo(VirtualizedTableBodyInner) as typeof VirtualizedTableBodyInner;
