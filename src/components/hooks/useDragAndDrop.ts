// src/hooks/useDragAndDrop.ts
import { useState } from 'react';

/**
 * onDrop will be called with (e, index, draggedIndex)
 * so the caller gets the current draggedIndex without relying on closure staleness.
 */
export const useDragAndDrop = (
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number, draggedIndex: number | null) => void
) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    // add class for styling while dragging (same as your previous code)
    try {
      (e.currentTarget as HTMLElement).classList.add('dragging');
    } catch {
      // ignore if not supported
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).classList.remove('dragging');
    } catch {}
    setDragOverItem(null);
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (index: number) => setDragOverItem(index);
  const handleDragLeave = () => setDragOverItem(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    // call the provided callback with the current draggedItem index
    onDrop(e, index, draggedItem);
    // clear drag state (caller can still set it too if needed)
    setDragOverItem(null);
    setDraggedItem(null);
  };

  return {
    draggedItem,
    dragOverItem,
    setDragOverItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } as const;
};
