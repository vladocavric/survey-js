import React from 'react';

export type DropZoneProps = {
	onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
	onDragLeave: () => void;
	onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
	active?: boolean;
	label: string;
	className?: string;
	heightClass?: string;
};

export const DropZone: React.FC<DropZoneProps> = ({ onDragOver, onDragLeave, onDrop, active, label, className, heightClass = 'h-8' }) => {
	return (
		<div
			onDragOver={(e) => {
				e.preventDefault();
				onDragOver(e);
			}}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			className={`${heightClass} rounded flex items-center justify-center text-sm text-gray-400 ${active ? 'border-2 border-blue-400' : ''} ${className ?? ''}`}
		>
			{label}
		</div>
	);
};
