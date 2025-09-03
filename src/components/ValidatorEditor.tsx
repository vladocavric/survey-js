import React from 'react';
import type { ValidatorType, Validator, ExpressionValidator, RegexValidator, NumericValidator, TextValidator } from './types';

export type ValidatorEditorProps = {
	validators: Validator[];
	availableTypes: Array<{ value: ValidatorType; label: string }>;
	onAdd: (type: ValidatorType) => void;
	onUpdate: (index: number, updates: Partial<Validator>) => void;
	onRemove: (index: number) => void;
};

export const ValidatorEditor: React.FC<ValidatorEditorProps> = ({ validators, availableTypes, onAdd, onUpdate, onRemove }) => {
	return (
		<div>
			<span className='block text-sm font-medium mb-2'>Validators</span>
			<div className='space-y-3'>
				{validators.map((validator, index) => (
					<div key={index} className='border rounded-md p-3 space-y-2'>
						<div className='flex items-center gap-2'>
							<select
								value={validator.type}
								onChange={(e) => onUpdate(index, { type: e.target.value as ValidatorType })}
								className='px-2 py-1 border rounded text-sm'>
								{availableTypes.map((t) => (
									<option key={t.value} value={t.value}>{t.label}</option>
								))}
							</select>
							<button
								onClick={() => onRemove(index)}
								className='ml-auto px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100'>
								Remove
							</button>
						</div>

						<input
							type='text'
							value={validator.text}
							onChange={(e) => onUpdate(index, { text: e.target.value })}
							placeholder='Validation message shown to user'
							className='w-full px-2 py-1 border rounded text-sm'
						/>

						{validator.type === 'expression' && (
							<input
								type='text'
								value={(validator as ExpressionValidator).expression}
								onChange={(e) => onUpdate(index, { expression: e.target.value })}
								placeholder='Expression (e.g. {q1} > 0)'
								className='w-full px-2 py-1 border rounded text-sm'
							/>
						)}

						{validator.type === 'regex' && (
							<input
								type='text'
								value={(validator as RegexValidator).regex}
								onChange={(e) => onUpdate(index, { regex: e.target.value })}
								placeholder='Regular Expression'
								className='w-full px-2 py-1 border rounded text-sm'
							/>
						)}

						{validator.type === 'numeric' && (
							<div className='flex flex-col sm:flex-row gap-2'>
								<input
									type='number'
									value={(validator as NumericValidator).minValue ?? ''}
									onChange={(e) => onUpdate(index, { minValue: e.target.value ? Number(e.target.value) : null })}
									placeholder='Min'
									className='w-full sm:flex-1 min-w-0 px-2 py-1 border rounded text-sm'
								/>
								<input
									type='number'
									value={(validator as NumericValidator).maxValue ?? ''}
									onChange={(e) => onUpdate(index, { maxValue: e.target.value ? Number(e.target.value) : null })}
									placeholder='Max'
									className='w-full sm:flex-1 min-w-0 px-2 py-1 border rounded text-sm'
								/>
							</div>
						)}

						{validator.type === 'text' && (
							<div className='flex flex-col sm:flex-row gap-2'>
								<input
									type='number'
									value={(validator as TextValidator).minLength}
									onChange={(e) => onUpdate(index, { minLength: Number(e.target.value) })}
									placeholder='Min Length'
									className='w-full sm:flex-1 min-w-0 px-2 py-1 border rounded text-sm'
								/>
								<input
									type='number'
									value={(validator as TextValidator).maxLength}
									onChange={(e) => onUpdate(index, { maxLength: Number(e.target.value) })}
									placeholder='Max Length'
									className='w-full sm:flex-1 min-w-0 px-2 py-1 border rounded text-sm'
								/>
							</div>
						)}
					</div>
				))}

				<div>
					<select
						defaultValue=''
						onChange={(e) => {
							const v = e.target.value as ValidatorType;
							if (v) onAdd(v);
							e.currentTarget.value = '';
						}}
						className='px-2 py-1 border rounded text-sm'>
						<option value=''>+ Add Validator</option>
						{availableTypes.map((t) => (
							<option key={t.value} value={t.value}>{t.label}</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
};
