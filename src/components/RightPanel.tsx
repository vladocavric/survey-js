import React from 'react';
import { Settings } from 'lucide-react';
import { ValidatorEditor } from './ValidatorEditor';
import type { Question, Panel, DynamicPanel, QuestionType, FormData, ValidatorType, ChoiceQuestion, NumberQuestion } from './types';

export type RightPanelProps = {
	currentQuestion: Question | null;
	currentPanel: Panel | DynamicPanel | null;
	formData: FormData;
	QUESTION_TYPES: Record<QuestionType, { label: string; icon: React.ReactNode }>;
	isChoiceQuestion: (q: Question) => q is ChoiceQuestion;
	isNumberQuestion: (q: Question) => q is NumberQuestion;
	updateQuestion: (id: string, updates: Partial<any>) => void;
	updateChoice: (questionName: string, choiceIndex: number, value: string) => void;
	addChoice: (questionName: string) => void;
	removeChoice: (questionName: string, choiceIndex: number) => void;
	addValidator: (questionName: string, type: ValidatorType) => void;
	updateValidator: (questionName: string, index: number, updates: Partial<any>) => void;
	deleteValidator: (questionName: string, index: number) => void;
	generateUniqueName: (title: string, elements: FormData['elements']) => string;
};

export const RightPanel: React.FC<RightPanelProps> = ({
	currentQuestion,
	currentPanel,
	formData,
	QUESTION_TYPES,
	isChoiceQuestion,
	isNumberQuestion,
	updateQuestion,
	updateChoice,
	addChoice,
	removeChoice,
	addValidator,
	updateValidator,
	deleteValidator,
	generateUniqueName,
}) => {
	return (
		<div className='w-96 bg-white p-4 overflow-y-auto'>
			{currentQuestion ? (
				<div className='space-y-4'>
					<h3 className='text-lg font-semibold mb-4'>Question Properties</h3>

					<div>
						<label className='block text-sm font-medium mb-1'>Title</label>
						<input
							type='text'
							value={currentQuestion.title}
							onChange={(e) => {
								const newTitle = e.target.value;
								if (currentQuestion.name.startsWith('FORM_STYLE_DATA.')) {
									const newName = generateUniqueName(
										newTitle,
										formData.elements.filter(
											(q) => !('element' in q && q.type === 'question' && q.element.name === currentQuestion.name)
										)
									);
									updateQuestion(currentQuestion.name, { title: newTitle, name: newName });
								} else {
									updateQuestion(currentQuestion.name, { title: newTitle });
								}
							}}
							className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>Description</label>
						<textarea
							value={currentQuestion.description}
							onChange={(e) => updateQuestion(currentQuestion.name, { description: e.target.value })}
							className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							rows={2}
						/>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>Name (ID)</label>
						<input
							type='text'
							value={currentQuestion.name}
							onChange={(e) => {
								const newName = e.target.value;
								const isUnique = !formData.elements.some(
									(q) => q.type === 'question' && q.element.name === newName && q.element.name !== currentQuestion.name
								);
								if (isUnique) updateQuestion(currentQuestion.name, { name: newName });
							}}
							onBlur={(e) => {
								const newName = e.target.value;
								const isDuplicate = formData.elements.some(
									(q) => q.type === 'question' && q.element.name === newName && q.element.name !== currentQuestion.name
								);
								if (isDuplicate) {
									alert('Field name must be unique. This name already exists.');
									e.currentTarget.value = currentQuestion.name;
								}
							}}
							className='w-full px-3 py-2 border rounded-md bg-gray-50'
						/>
						<p className='text-xs text-gray-500 mt-1'>
							{currentQuestion.name.startsWith('FORM_STYLE_DATA.')
								? 'Auto-generated from title. Edit to customize.'
								: 'Custom field name'}
						</p>
					</div>

					{isChoiceQuestion(currentQuestion) && (
						<div>
							<label className='block text-sm font-medium mb-1'>Choices</label>
							<div className='space-y-2'>
								{currentQuestion.choices.map((choice: string, index: number) => (
									<div key={index} className='flex gap-2'>
										<input
											type='text'
											value={choice}
											onChange={(e) => updateChoice(currentQuestion.name, index, e.target.value)}
											className='flex-1 px-3 py-1 border rounded-md text-sm'
										/>
										<button
											onClick={() => removeChoice(currentQuestion.name, index)}
											className='p-2 bg-white hover:bg-red-50 rounded-full text-red-600 border border-transparent hover:border-red-100 shadow-sm'>
											Remove
										</button>
									</div>
								))}
								<button
									onClick={() => addChoice(currentQuestion.name)}
									className='w-full py-1 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400'>
									+ Add Choice
								</button>
							</div>
						</div>
					)}

					{isNumberQuestion(currentQuestion) && (
						<>
							<div>
								<label className='block text-sm font-medium mb-1'>Min Value</label>
								<input
									type='number'
									value={(currentQuestion as NumberQuestion).min ?? ''}
									onChange={(e) => updateQuestion(currentQuestion.name, { min: e.target.value ? Number(e.target.value) : null })}
									className='w-full px-3 py-2 border rounded-md'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium mb-1'>Max Value</label>
								<input
									type='number'
									value={(currentQuestion as NumberQuestion).max ?? ''}
									onChange={(e) => updateQuestion(currentQuestion.name, { max: e.target.value ? Number(e.target.value) : null })}
									className='w-full px-3 py-2 border rounded-md'
								/>
							</div>
						</>
					)}

					<div className='space-y-3'>
						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								checked={currentQuestion.isRequired}
								onChange={(e) => updateQuestion(currentQuestion.name, { isRequired: e.target.checked })}
								className='w-4 h-4 text-blue-600 rounded'
							/>
							<span className='text-sm font-medium'>Required</span>
						</label>

						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								checked={currentQuestion.readOnly}
								onChange={(e) => updateQuestion(currentQuestion.name, { readOnly: e.target.checked })}
								className='w-4 h-4 text-blue-600 rounded'
							/>
							<span className='text-sm font-medium'>Read Only</span>
						</label>

						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								checked={currentQuestion.visible}
								onChange={(e) => updateQuestion(currentQuestion.name, { visible: e.target.checked })}
								className='w-4 h-4 text-blue-600 rounded'
							/>
							<span className='text-sm font-medium'>Visible</span>
						</label>

						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								checked={currentQuestion.showTitleAndDescription}
								onChange={(e) => updateQuestion(currentQuestion.name, { showTitleAndDescription: e.target.checked })}
								className='w-4 h-4 text-blue-600 rounded'
							/>
							<span className='text-sm font-medium'>Show Title & Description</span>
						</label>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>Make Visible If (Expression)</label>
						<input
							type='text'
							value={currentQuestion.visibleIf || ''}
							onChange={(e) => updateQuestion(currentQuestion.name, { visibleIf: e.target.value })}
							placeholder="{question1} = 'yes'"
							className='w-full px-3 py-2 border rounded-md text-sm'
						/>
					</div>

					<ValidatorEditor
						validators={currentQuestion.validators as any}
						availableTypes={Object.entries({ expression: 'Expression', regex: 'Regex', numeric: 'Numeric', text: 'Text Length', email: 'Email' }).map(([value, label]) => ({ value: value as ValidatorType, label }))}
						onAdd={(type) => addValidator(currentQuestion.name, type)}
						onUpdate={(index, updates) => updateValidator(currentQuestion.name, index, updates as any)}
						onRemove={(index) => deleteValidator(currentQuestion.name, index)}
					/>
				</div>
			) : currentPanel ? (
				<div className='space-y-4'>
					<h3 className='text-lg font-semibold mb-4'>Panel Properties</h3>

					<div>
						<label className='block text-sm font-medium mb-1'>Title</label>
						<input
							type='text'
							value={currentPanel.title}
							onChange={(e) => updateQuestion(currentPanel.id, { title: e.target.value } as Partial<Panel>)}
							className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>Description</label>
						<textarea
							value={currentPanel.description}
							onChange={(e) => updateQuestion(currentPanel.id, { description: e.target.value } as Partial<Panel>)}
							className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							rows={2}
						/>
					</div>

					<div>
						<label className='block text-sm font-medium mb-1'>ID</label>
						<input
							type='text'
							value={(currentPanel as any).id}
							onChange={(e) => updateQuestion(currentPanel.id, { id: e.target.value } as Partial<Panel>)}
							className='w-full px-3 py-2 border rounded-md bg-gray-50'
						/>
					</div>

					{'templateElements' in currentPanel && (
						<div className='space-y-3'>
							<h4 className='text-sm font-medium'>Dynamic Panel Settings</h4>
							<div>
								<label className='block text-sm font-medium mb-1'>Min Panels</label>
								<input
									type='number'
									value={(currentPanel as DynamicPanel).minPanelCount}
									onChange={(e) => updateQuestion(currentPanel.id, { minPanelCount: Number(e.target.value) } as Partial<DynamicPanel>)}
									className='w-full px-3 py-2 border rounded-md'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium mb-1'>Max Panels</label>
								<input
									type='number'
									value={(currentPanel as DynamicPanel).maxPanelCount}
									onChange={(e) => updateQuestion(currentPanel.id, { maxPanelCount: Number(e.target.value) } as Partial<DynamicPanel>)}
									className='w-full px-3 py-2 border rounded-md'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium mb-1'>Panel Count</label>
								<input
									type='number'
									value={(currentPanel as DynamicPanel).panelCount}
									onChange={(e) => updateQuestion(currentPanel.id, { panelCount: Number(e.target.value) } as Partial<DynamicPanel>)}
									className='w-full px-3 py-2 border rounded-md'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium mb-1'>Add Button Text</label>
								<input
									type='text'
									value={(currentPanel as DynamicPanel).panelAddText || ''}
									onChange={(e) => updateQuestion(currentPanel.id, { panelAddText: e.target.value } as Partial<DynamicPanel>)}
									className='w-full px-3 py-2 border rounded-md'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium mb-1'>Remove Button Text</label>
								<input
									type='text'
									value={(currentPanel as DynamicPanel).panelRemoveText || ''}
									onChange={(e) => updateQuestion(currentPanel.id, { panelRemoveText: e.target.value } as Partial<DynamicPanel>)}
									className='w-full px-3 py-2 border rounded-md'
								/>
							</div>
						</div>
					)}
				</div>
			) : (
				<div className='text-center py-12 text-gray-400'>
					<Settings className='w-12 h-12 mx-auto mb-3 text-gray-300' />
					<p>Select a question or panel to edit its properties</p>
				</div>
			)}
		</div>
	);
};
