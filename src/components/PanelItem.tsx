import React from 'react';
import { CircleChevronDown, CirclePlus, Trash2 } from 'lucide-react';
import type { QuestionType, Panel, DynamicPanel } from './types';
import { DeleteButton } from './DeleteButton';

export type PanelItemProps = {
	id: string;
	title: string;
	isSelected: boolean;
	isDragged: boolean;
	isDragOver: boolean;
	onClick: () => void;
	onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
	onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
	onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
	onDragEnter: () => void;
	onDragLeave: () => void;
	onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
	expanded: boolean;
	onToggle: () => void;
	onDelete: () => void;
	QUESTION_TYPES: Record<QuestionType, { label: string; icon: React.ReactNode }>;
	onInlineAdd: (type: QuestionType) => void;
	label: 'Panel' | 'Dynamic Panel';
	children: React.ReactNode;
};

export const PanelItem: React.FC<PanelItemProps> = ({ id, title, isSelected, isDragged, isDragOver, onClick, onDragStart, onDragEnd, onDragOver, onDragEnter, onDragLeave, onDrop, expanded, onToggle, onDelete, QUESTION_TYPES, onInlineAdd, label, children }) => {
	return (
		<div
			key={id}
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onDragOver={onDragOver}
			onDragEnter={onDragEnter}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			className={`w-full border rounded-lg p-3 bg-gray-50 cursor-move transition-all ${
				isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
			} ${isDragged ? 'bg-white shadow-md scale-105' : ''} ${isDragOver ? 'border-2 border-blue-400 -mt-1' : ''}`}
			onClick={onClick}
		>
			<div className='w-full flex flex-col gap-4'>
				<div className='flex items-center justify-between gap-2'>
					<div className='flex items-center gap-2'>
						<button onClick={onToggle} className='p-1'>
							{expanded ? <CircleChevronDown /> : <CirclePlus />}
						</button>
						<strong>{title}</strong>
					</div>
					<DeleteButton onClick={onDelete} />
				</div>
				<div className='flex items-center gap-2'>
					<div className='w-full flex items-center justify-between gap-1'>
						<span className='text-xs px-2 py-0.5 bg-gray-100 rounded'>{label}</span>
						<select
							onClick={(e) => e.stopPropagation()}
							defaultValue=''
							onChange={(e) => {
								const val = e.target.value as QuestionType;
								if (val) onInlineAdd(val);
								e.currentTarget.value = '';
							}}
							className='text-sm px-2 py-1 border rounded bg-white'>
							<option value=''>+ Add Question</option>
							{Object.entries(QUESTION_TYPES).map(([t, cfg]) => (
								<option key={t} value={t}>{cfg.label}</option>
							))}
						</select>
					</div>
				</div>
				{children}
			</div>
		</div>
	);
};
