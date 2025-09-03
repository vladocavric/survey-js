import React from 'react';
import { Trash2 } from 'lucide-react';

export type DeleteButtonProps = {
	onClick: () => void;
	title?: string;
	ariaLabel?: string;
	className?: string;
	iconSize?: number;
};

export const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, title, ariaLabel, className, iconSize = 16 }) => {
	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			title={title}
			aria-label={ariaLabel}
			className={className ?? 'p-2 bg-white hover:bg-red-50 rounded-full text-red-600 border border-transparent hover:border-red-100 shadow-sm'}
		>
			<Trash2 className='w-4 h-4' style={{ width: iconSize, height: iconSize }} />
		</button>
	);
};
