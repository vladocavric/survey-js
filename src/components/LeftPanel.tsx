import React from 'react';
import { Layers, Copy, FileText, List, ListChecks, CheckSquare, CheckCircle, Calendar, Link as LinkIcon, Mail, Hash, Phone, MessageSquare } from 'lucide-react';
import type { QuestionType } from './types';

export type LeftPanelProps = {
	QUESTION_TYPES: Record<QuestionType, { label: string; icon: React.ReactNode }>;
	CONTAINER_TYPES: Record<'panel' | 'dynamicpanel', { label: string; icon: React.ReactNode }>;
	onAddQuestion: (type: QuestionType) => void;
	onAddContainer: (type: 'panel' | 'dynamicpanel') => void;
};

export const LeftPanel: React.FC<LeftPanelProps> = ({ QUESTION_TYPES, CONTAINER_TYPES, onAddQuestion, onAddContainer }) => {
	return (
		<div className='w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto'>
			<h3 className='text-lg font-semibold mb-4'>Create</h3>
			<div className='space-y-4'>
				<div className='bg-indigo-50 border border-indigo-100 rounded-lg p-3'>
					<h4 className='text-sm font-semibold mb-2'>Question Types</h4>
					<div className='space-y-2'>
						{Object.entries(QUESTION_TYPES).map(([type, config]) => (
							<button
								key={type}
								onClick={() => onAddQuestion(type as QuestionType)}
								className='w-full flex items-center gap-3 p-3 text-left bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200'>
								<span className='text-xl'>{config.icon}</span>
								<span className='text-sm font-medium'>{config.label}</span>
							</button>
						))}
					</div>
				</div>
				<div className='bg-indigo-50 border border-indigo-100 rounded-lg p-3'>
					<h4 className='text-sm font-semibold mb-2'>Containers</h4>
					<div className='space-y-2'>
						{Object.entries(CONTAINER_TYPES).map(([type, config]) => (
							<button
								key={type}
								aria-label={`Add ${config.label}`}
								onClick={() => onAddContainer(type as 'panel' | 'dynamicpanel')}
								className='w-full flex items-center gap-3 p-3 text-left bg-white hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200'>
								<span className='text-xl'>{config.icon}</span>
								<span className='text-sm font-medium'>{config.label}</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
