import React from 'react';
import { GripVertical, EyeOff } from 'lucide-react';
import type { Question, QuestionType } from './types';

export type QuestionItemProps = {
	question: Question;
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
	icon: React.ReactNode;
	typeLabel: string;
	trailing: React.ReactNode;
};

export const QuestionItem: React.FC<QuestionItemProps> = ({ question, isSelected, isDragged, isDragOver, onClick, onDragStart, onDragEnd, onDragOver, onDragEnter, onDragLeave, onDrop, icon, typeLabel, trailing }) => {
	return (
		<div
			key={question.name}
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onDragOver={onDragOver}
			onDragEnter={onDragEnter}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			className={`w-full border rounded-lg p-4 cursor-grab transition-all bg-gray-50 ${
				isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
			} ${isDragged ? 'bg-white-100 shadow-md scale-105' : ''} ${isDragOver ? 'bg-white-100 border-2 border-blue-400 -mt-1' : ''}`}
			onClick={onClick}
		>
			<div className='flex items-start gap-3'>
				<GripVertical className='w-5 h-5 text-gray-400 mt-1' />
				<div className='flex-1'>
					<div className='flex items-center gap-2 mb-1'>
						<span className='text-lg'>{icon}</span>
						<h4 className='font-medium'>{question.title || 'Untitled'}</h4>
						{question.isRequired && <span className='text-red-500 text-sm'>*</span>}
						{!question.visible && <EyeOff className='w-4 h-4 text-gray-400' />}
					</div>
					{question.description && (
						<p className='text-sm text-gray-600'>{question.description}</p>
					)}
					<div className='flex gap-2 mt-2'>
						<span className='text-xs px-2 py-1 bg-gray-100 rounded'>{typeLabel}</span>
						{question.validators?.length > 0 && (
							<span className='text-xs px-2 py-1 bg-yellow-100 rounded'>
								{question.validators.length} validator(s)
							</span>
						)}
					</div>
				</div>
				{trailing}
			</div>
		</div>
	);
};
