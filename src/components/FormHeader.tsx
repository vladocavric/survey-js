import React from 'react';

export type FormHeaderProps = {
	title: string;
	description: string;
	onChange: (next: { title: string; description: string }) => void;
};

export const FormHeader: React.FC<FormHeaderProps> = ({ title, description, onChange }) => {
	return (
		<div className='flex-1 space-y-2'>
			<input
				type='text'
				value={title}
				onChange={(e) => onChange({ title: e.target.value, description })}
				placeholder='Form title'
				className='w-full text-xl font-semibold px-3 py-2 border rounded-md'
			/>
			<textarea
				value={description}
				onChange={(e) => onChange({ title, description: e.target.value })}
				placeholder='Form description'
				className='w-full text-sm text-gray-700 px-3 py-2 border rounded-md'
				rows={2}
			/>
		</div>
	);
};
