import React, { useState, type ReactNode } from 'react';
import {
	Trash2,
	GripVertical,
	EyeOff,
	Settings,
	FileText,
	List,
	ListChecks,
	CheckSquare,
	CheckCircle,
	Calendar,
	Link as LinkIcon,
	Mail,
	Hash,
	Phone,
	MessageSquare,
	Layers,
	Copy,
	CircleChevronDown,
	CirclePlus,
} from 'lucide-react';
import { FormHeader } from './FormHeader';
import { ValidatorEditor } from './ValidatorEditor';
import { DeleteButton } from './DeleteButton';
import { DropZone } from './DropZone';
import { QuestionItem } from './QuestionItem';
import type {
	QuestionType,
	ValidatorType,
	QuestionTypeConfig,
	ValidatorTypeConfig,
	BaseValidator,
	ExpressionValidator,
	RegexValidator,
	NumericValidator,
	TextValidator,
	EmailValidator,
	Validator,
	BaseQuestion,
	ChoiceQuestion,
	NumberQuestion,
	Question,
	Panel,
	DynamicPanel,
	SurveyElement,
	FormData,
	FormBuilderProps,
} from './types';
import {
	isQuestion,
	isPanel,
	isDynamicPanel,
	isChoiceQuestion,
	isNumberQuestion,
	getElementById,
} from './utils/elements';
import { createValidator } from './utils/elements';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { PanelItem } from './PanelItem';
import { ChildrenList } from './ChildrenList';
import { FormCanvas } from './FormCanvas';

const defaultFormData: FormData = {
	title: 'Untitled Form',
	description: '',
	elements: [],
};

// Question type metadata (label + icon)
const QUESTION_TYPES: Record<QuestionType, QuestionTypeConfig> = {
	text: { label: 'Text', icon: <FileText /> },
	dropdown: { label: 'Dropdown', icon: <List /> },
	multiselect: { label: 'Multi Select', icon: <ListChecks /> },
	boolean: { label: 'Boolean', icon: <CheckSquare /> },
	checkbox: { label: 'Checkbox', icon: <CheckSquare /> },
	radiogroup: { label: 'Radio Group', icon: <CheckCircle /> },
	date: { label: 'Date', icon: <Calendar /> },
	url: { label: 'URL', icon: <LinkIcon /> },
	email: { label: 'Email', icon: <Mail /> },
	number: { label: 'Numeric', icon: <Hash /> },
	phone: { label: 'Phone', icon: <Phone /> },
	comment: { label: 'Comment', icon: <MessageSquare /> },
};

// Container types (panels, dynamic panels)
const CONTAINER_TYPES = {
	panel: { label: 'Panel', icon: <Layers /> },
	dynamicpanel: { label: 'Dynamic Panel', icon: <Copy /> },
};

const VALIDATOR_TYPES: Record<ValidatorType, string> = {
	expression: 'Expression',
	regex: 'Regex',
	numeric: 'Numeric',
	text: 'Text Length',
	email: 'Email',
};

// =====================
// FormBuilder
// =====================

export const FormBuilder: React.FC<FormBuilderProps> = ({
	initialData = defaultFormData,
	onChange,
}: FormBuilderProps) => {
	const [formData, setFormData] = useState<FormData>(() => ({
		title: initialData?.title || defaultFormData.title,
		description: initialData?.description || defaultFormData.description,
		elements: initialData?.elements || [],
	}));
	const [selectedQuestion, setSelectedQuestion] = useState<string | null>(
		null
	);
	const [draggedItem, setDraggedItem] = useState<number | null>(null);
	const [dragOverItem, setDragOverItem] = useState<number | null>(null);
	// track child-level drag over as `${containerId}:${index}` or `${containerId}:end`
	const [childDragOver, setChildDragOver] = useState<string | null>(null);
	const [showJSON, setShowJSON] = useState<boolean>(false);

	// Generate unique name from title
	const generateUniqueName = (
		title: string,
		elements: SurveyElement[]
	): string => {
		const baseName = `FORM_STYLE_DATA.${title
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '_')}`;
		let uniqueName = baseName;
		let counter = 1;

		const isNameUsed = (name: string, elems: SurveyElement[]): boolean => {
			return elems.some((element) => {
				if (isQuestion(element)) {
					return element.element.name === name;
				} else if (isPanel(element)) {
					if (element.element.id === name) return true;
					return isNameUsed(name, element.element.elements);
				} else if (isDynamicPanel(element)) {
					if (element.element.id === name) return true;
					// check both templateElements and instance elements
					if (isNameUsed(name, element.element.templateElements))
						return true;
					return isNameUsed(name, element.element.elements);
				}
				return false;
			});
		};

		while (isNameUsed(uniqueName, elements)) {
			uniqueName = `${baseName}_${counter}`;
			counter++;
		}
		return uniqueName;
	};

	// Add new element
	const addElement = (
		type: QuestionType | keyof typeof CONTAINER_TYPES
	): void => {
		const isContainer = type in CONTAINER_TYPES;
		const title = `New ${
			isContainer
				? CONTAINER_TYPES[type as keyof typeof CONTAINER_TYPES].label
				: QUESTION_TYPES[type as QuestionType].label
		}`;
		const generatedName = generateUniqueName(title, formData.elements);

		if (isContainer) {
			let newElement: SurveyElement;
			if (type === 'panel') {
				newElement = {
					type: 'panel',
					element: {
						id: generatedName,
						title,
						description: '',
						elements: [],
						visible: true,
						visibleIf: '',
					},
				};
			} else {
				// Dynamic Panel
				newElement = {
					type: 'dynamicpanel',
					element: {
						id: generatedName,
						title,
						description: '',
						elements: [],
						templateElements: [],
						minPanelCount: 0,
						maxPanelCount: 10,
						panelCount: 1,
						panelAddText: 'Add New',
						panelRemoveText: 'Remove',
						visible: true,
						visibleIf: '',
					},
				};
			}
			const updatedData: FormData = {
				...formData,
				elements: [...formData.elements, newElement],
			};
			setFormData(updatedData);
			setSelectedQuestion(generatedName);
			onChange?.(updatedData);
		} else {
			// Question
			const base: BaseQuestion = {
				name: generatedName,
				type: type as QuestionType,
				title,
				description: '',
				isRequired: false,
				readOnly: false,
				visible: true,
				showTitleAndDescription: true,
				validators: [],
				visibleIf: '',
			};

			let question: Question;
			if (type === 'number') {
				question = { ...base, type: 'number', min: null, max: null };
			} else if (
				type === 'dropdown' ||
				type === 'multiselect' ||
				type === 'checkbox' ||
				type === 'radiogroup'
			) {
				question = {
					...base,
					type,
					choices: ['Option 1', 'Option 2', 'Option 3'],
				} as ChoiceQuestion;
			} else {
				question = base;
			}

			const newElement: SurveyElement = {
				type: 'question',
				element: question,
			};

			const updatedData: FormData = {
				...formData,
				elements: [...formData.elements, newElement],
			};

			setFormData(updatedData);
			setSelectedQuestion(generatedName);
			onChange?.(updatedData);
		}
	};

	// Update element
	const updateElement = (
		elementId: string,
		updates: Partial<Question | Panel | DynamicPanel>
	): void => {
		const updateRec = (elements: SurveyElement[]): SurveyElement[] => {
			return elements.map((element): SurveyElement => {
				// Update matching question
				if (isQuestion(element) && element.element.name === elementId) {
					return {
						...element,
						element: {
							...element.element,
							...(updates as Partial<Question>),
						},
					};
				}

				// Update matching panel
				if (isPanel(element) && element.element.id === elementId) {
					return {
						...element,
						element: {
							...element.element,
							...(updates as Partial<Panel>),
						},
					};
				}

				// Update matching dynamic panel
				if (
					isDynamicPanel(element) &&
					element.element.id === elementId
				) {
					return {
						...element,
						element: {
							...element.element,
							...(updates as Partial<DynamicPanel>),
						},
					};
				}

				// Recurse into panel children
				if (isPanel(element)) {
					const updatedChildren = updateRec(element.element.elements);
					if (updatedChildren !== element.element.elements) {
						return {
							...element,
							element: {
								...element.element,
								elements: updatedChildren,
							},
						};
					}
					return element;
				}

				// Recurse into dynamic panel children/template
				if (isDynamicPanel(element)) {
					const updatedTemplate = updateRec(
						element.element.templateElements
					);
					let updatedInstances = element.element.elements
						? updateRec(element.element.elements)
						: element.element.elements;
					if (
						updatedTemplate !== element.element.templateElements ||
						updatedInstances !== element.element.elements
					) {
						return {
							...element,
							element: {
								...element.element,
								templateElements: updatedTemplate,
								elements: updatedInstances,
							},
						};
					}
					return element;
				}

				return element;
			});
		};

		const updatedElements = updateRec(formData.elements);

		const updatedData: FormData = {
			...formData,
			elements: updatedElements,
		};

		setFormData(updatedData);
		if ('name' in updates && updates.name && updates.name !== elementId) {
			setSelectedQuestion(updates.name ?? null);
		} else if ('id' in updates && updates.id && updates.id !== elementId) {
			setSelectedQuestion(updates.id ?? null);
		}
		onChange?.(updatedData);
	};

	// Delete element
	const deleteElement = (elementId: string): void => {
		const deleteRec = (elements: SurveyElement[]): SurveyElement[] => {
			return elements.reduce<SurveyElement[]>((acc, element) => {
				if (isQuestion(element)) {
					if (element.element.name === elementId) return acc;
					return [...acc, element];
				}
				if (isPanel(element)) {
					if (element.element.id === elementId) return acc;
					const updatedChildren = deleteRec(element.element.elements);
					return [
						...acc,
						{
							...element,
							element: {
								...element.element,
								elements: updatedChildren,
							},
						},
					];
				}
				if (isDynamicPanel(element)) {
					if (element.element.id === elementId) return acc;
					const updatedTemplate = deleteRec(
						element.element.templateElements
					);
					const updatedInstances = element.element.elements
						? deleteRec(element.element.elements)
						: element.element.elements;
					return [
						...acc,
						{
							...element,
							element: {
								...element.element,
								templateElements: updatedTemplate,
								elements: updatedInstances,
							},
						},
					];
				}
				return [...acc, element];
			}, []);
		};

		const updatedElements = deleteRec(formData.elements);
		const updatedData: FormData = {
			...formData,
			elements: updatedElements,
		};

		setFormData(updatedData);
		if (selectedQuestion === elementId) setSelectedQuestion(null);
		onChange?.(updatedData);
	};

	// Drag and drop handlers
	const handleDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		index: number
	): void => {
		setDraggedItem(index);
		e.dataTransfer.effectAllowed = 'move';
		e.currentTarget.classList.add('dragging');
	};

	const handleDragEnd = (e: React.DragEvent<HTMLDivElement>): void => {
		e.currentTarget.classList.remove('dragging');
		setDragOverItem(null);
		setDraggedItem(null);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const handleDragEnter = (index: number): void => setDragOverItem(index);
	const handleDragLeave = (): void => setDragOverItem(null);

	// Child drag helpers: encode source info in dataTransfer
	const handleChildDragStart = (
		e: React.DragEvent<HTMLDivElement>,
		srcType: 'root' | 'panel' | 'dynamicpanel',
		containerId: string | null,
		srcIndex: number
	) => {
		// Ensure this drag event does not bubble and get treated as a root drag
		// which would cause the parent drop handler to move elements to root.
		e.stopPropagation();
		e.dataTransfer.setData(
			'application/json',
			JSON.stringify({ srcType, containerId, srcIndex })
		);
		e.dataTransfer.effectAllowed = 'move';
	};

	const handleChildDropTo = (
		e: React.DragEvent<HTMLDivElement>,
		destType: 'root' | 'panel' | 'dynamicpanel',
		destContainerId: string | null,
		destIndex: number
	) => {
		e.preventDefault();
		// Prevent parent drop handlers (which handle root-level drops) from
		// also running and moving the item out of the container.
		e.stopPropagation();
		setChildDragOver(null);
		const raw = e.dataTransfer.getData('application/json');
		// If payload exists, it's a child-origin drag. Otherwise it may be a
		// root-origin drag where we track the dragged index in state.
		if (raw) {
			try {
				const { srcType, containerId, srcIndex } = JSON.parse(raw) as {
					srcType: 'root' | 'panel' | 'dynamicpanel';
					containerId: string | null;
					srcIndex: number;
				};
				moveElementBetweenContainers(
					srcType,
					containerId,
					srcIndex,
					destType,
					destContainerId,
					destIndex
				);
			} catch (err) {
				// ignore
			}
		} else if (draggedItem !== null) {
			// Root-origin drag: use the draggedItem index to move into the container.
			console.debug('childDrop (root-origin):', {
				draggedItem,
				destType,
				destContainerId,
				destIndex,
			});
			moveElementBetweenContainers(
				'root',
				null,
				draggedItem,
				destType,
				destContainerId,
				destIndex
			);
			setDraggedItem(null);
		}
	};

	const moveElementBetweenContainers = (
		srcType: 'root' | 'panel' | 'dynamicpanel',
		srcContainerId: string | null,
		srcIndex: number,
		destType: 'root' | 'panel' | 'dynamicpanel',
		destContainerId: string | null,
		destIndex: number
	) => {
		let movedEl: SurveyElement | null = null;

		if (srcType === 'root') {
			movedEl = formData.elements[srcIndex] ?? null;
		} else if (srcType === 'panel') {
			const p = formData.elements.find(
				(e) => isPanel(e) && e.element.id === srcContainerId
			);
			if (p && isPanel(p)) movedEl = p.element.elements[srcIndex] ?? null;
		} else if (srcType === 'dynamicpanel') {
			const d = formData.elements.find(
				(e) => isDynamicPanel(e) && e.element.id === srcContainerId
			);
			if (d && isDynamicPanel(d))
				movedEl = d.element.templateElements[srcIndex] ?? null;
		}
		if (!movedEl) return;

		// Determine whether the source and destination are the same container
		const sameContainer =
			srcType === destType &&
			(srcContainerId ?? null) === (destContainerId ?? null);

		let intermediate = formData.elements.map((el) => {
			if (
				isPanel(el) &&
				srcType === 'panel' &&
				el.element.id === srcContainerId
			) {
				return {
					...el,
					element: {
						...el.element,
						elements: el.element.elements.filter(
							(_, i) => i !== srcIndex
						),
					},
				};
			}
			if (
				isDynamicPanel(el) &&
				srcType === 'dynamicpanel' &&
				el.element.id === srcContainerId
			) {
				return {
					...el,
					element: {
						...el.element,
						templateElements: el.element.templateElements.filter(
							(_, i) => i !== srcIndex
						),
					},
				};
			}
			return el;
		});

		if (srcType === 'root') {
			intermediate = intermediate.filter((_, i) => i !== srcIndex);
		}

		// If we removed an item from the same container and the source index was before
		// the destination, the destIndex should be decremented to account for the removal.
		let adjustedDestIndex = destIndex;
		// When moving within the same container, if the source index is before the
		// destination index (dragging down), keep the destination index so the
		// item appears at the expected position after removal.
		// This prevents an off-by-one where dropping above a later item places the
		// moved item one slot too early.
		if (sameContainer && srcIndex < destIndex) {
			adjustedDestIndex = destIndex; // no decrement
		}

		console.debug('moveElementBetweenContainers', {
			srcType,
			srcContainerId,
			srcIndex,
			destType,
			destContainerId,
			destIndex,
			sameContainer,
			adjustedDestIndex,
		});

		const final = intermediate.map((el) => {
			if (
				isPanel(el) &&
				destType === 'panel' &&
				el.element.id === destContainerId
			) {
				const children = [...el.element.elements];
				const insertIndex = adjustedDestIndex;
				children.splice(insertIndex, 0, movedEl as SurveyElement);
				return {
					...el,
					element: { ...el.element, elements: children },
				};
			}
			if (
				isDynamicPanel(el) &&
				destType === 'dynamicpanel' &&
				el.element.id === destContainerId
			) {
				const children = [...el.element.templateElements];
				const insertIndex = adjustedDestIndex;
				children.splice(insertIndex, 0, movedEl as SurveyElement);
				return {
					...el,
					element: { ...el.element, templateElements: children },
				};
			}
			return el;
		});

		let finalElements: SurveyElement[] = final;
		if (destType === 'root') {
			finalElements = [...final];
			let insertIndex = adjustedDestIndex;
			finalElements.splice(insertIndex, 0, movedEl as SurveyElement);
		}

		const updatedData: FormData = { ...formData, elements: finalElements };
		setFormData(updatedData);
		onChange?.(updatedData);
	};

	const handleDrop = (
		e: React.DragEvent<HTMLDivElement>,
		dropIndex: number
	): void => {
		e.preventDefault();
		setDragOverItem(null);

		// If a child drag encoded source exists, move accordingly into root
		const raw = e.dataTransfer.getData('application/json');
		if (raw) {
			// If we're currently dragging over a child slot, prefer the child
			// drop handler; ignore the raw payload here to avoid moving the
			// element to root when the user intended to drop inside a panel.
			if (childDragOver !== null) {
				setChildDragOver(null);
				return;
			}
			try {
				const { srcType, containerId, srcIndex } = JSON.parse(raw) as {
					srcType: 'root' | 'panel' | 'dynamicpanel';
					containerId: string | null;
					srcIndex: number;
				};
				moveElementBetweenContainers(
					srcType,
					containerId,
					srcIndex,
					'root',
					null,
					dropIndex
				);
				return;
			} catch (err) {
				// ignore
			}
		}

		if (draggedItem === null) return;

		const draggedElement = formData.elements[draggedItem];
		const newElements = [...formData.elements];
		newElements.splice(draggedItem, 1);
		newElements.splice(dropIndex, 0, draggedElement);

		const updatedData: FormData = { ...formData, elements: newElements };
		setFormData(updatedData);
		onChange?.(updatedData);
		setDraggedItem(null);
	};

	// Validators
	const addValidator = (questionName: string, type: ValidatorType): void => {
		const element = formData.elements.find(
			(e) => isQuestion(e) && e.element.name === questionName
		);
		if (!element || !isQuestion(element)) return;

		const newValidator = createValidator(type);
		const question = element.element;
		const updates: Partial<Question> = {
			validators: [...question.validators, newValidator],
		};
		updateElement(questionName, updates);
	};

	const updateValidator = (
		questionName: string,
		validatorIndex: number,
		updates: Partial<Validator>
	): void => {
		const element = formData.elements.find(
			(e) => isQuestion(e) && e.element.name === questionName
		);
		if (!element || !isQuestion(element)) return;

		const question = element.element;
		const newValidators = [...question.validators];
		newValidators[validatorIndex] = {
			...newValidators[validatorIndex],
			...updates,
		} as Validator;

		const questionUpdates: Partial<Question> = {
			validators: newValidators,
		};
		updateElement(questionName, questionUpdates);
	};

	const deleteValidator = (
		questionName: string,
		validatorIndex: number
	): void => {
		const element = formData.elements.find(
			(e) => isQuestion(e) && e.element.name === questionName
		);
		if (!element || !isQuestion(element)) return;

		const question = element.element;
		const newValidators = question.validators.filter(
			(_, i: number) => i !== validatorIndex
		);

		const questionUpdates: Partial<Question> = {
			validators: newValidators,
		};
		updateElement(questionName, questionUpdates);
	};

	// Choices
	const updateChoice = (
		questionName: string,
		choiceIndex: number,
		value: string
	): void => {
		const element = formData.elements.find(
			(e) => isQuestion(e) && e.element.name === questionName
		);
		if (
			!element ||
			!isQuestion(element) ||
			!isChoiceQuestion(element.element)
		)
			return;
		const question = element.element;
		const newChoices = [...question.choices];
		newChoices[choiceIndex] = value;
		updateElement(questionName, {
			choices: newChoices,
		} as Partial<ChoiceQuestion>);
	};

	const addChoice = (questionName: string): void => {
		const el = getElementById(formData.elements, questionName);
		if (!el || !isQuestion(el) || !isChoiceQuestion(el.element)) return;
		const question = el.element;
		updateElement(questionName, {
			choices: [
				...question.choices,
				`Option ${question.choices.length + 1}`,
			],
		} as Partial<ChoiceQuestion>);
	};

	const removeChoice = (questionName: string, choiceIndex: number): void => {
		const el = getElementById(formData.elements, questionName);
		if (!el || !isQuestion(el) || !isChoiceQuestion(el.element)) return;
		const question = el.element;
		const newChoices = question.choices.filter((_, i) => i !== choiceIndex);
		updateElement(questionName, {
			choices: newChoices,
		} as Partial<ChoiceQuestion>);
	};

	// Panel management

	// Alias for backward compatibility with code using updateQuestion
	const updateQuestion = updateElement;
	// Aliases for convenience
	const addQuestion = (type: QuestionType) => addElement(type);
	const deleteQuestion = (id: string) => deleteElement(id);
	const addQuestionToPanel = (panelId: string, type: QuestionType): void => {
		const panelEl = formData.elements.find(
			(e) => isPanel(e) && e.element.id === panelId
		);
		if (!panelEl || !isPanel(panelEl)) return;
		const title = `New ${QUESTION_TYPES[type].label} Question`;
		const generatedName = generateUniqueName(title, [
			...formData.elements,
			...panelEl.element.elements,
		]);
		// You may want to use addElement logic here for nested panels
		// For now, just add a question
		const base: BaseQuestion = {
			name: generatedName,
			type,
			title,
			description: '',
			isRequired: false,
			readOnly: false,
			visible: true,
			showTitleAndDescription: true,
			validators: [],
			visibleIf: '',
		};
		let question: Question;
		if (type === 'number') {
			question = { ...base, type: 'number', min: null, max: null };
		} else if (
			type === 'dropdown' ||
			type === 'multiselect' ||
			type === 'checkbox' ||
			type === 'radiogroup'
		) {
			question = {
				...base,
				type,
				choices: ['Option 1', 'Option 2', 'Option 3'],
			} as ChoiceQuestion;
		} else {
			question = base;
		}
		const newElement: SurveyElement = {
			type: 'question',
			element: question,
		};
		const updatedElements = [...panelEl.element.elements, newElement];
		updateElement(panelId, { elements: updatedElements } as Partial<Panel>);
		// Expand and select newly added question
		setExpandedPanels((prev) => ({ ...prev, [panelId]: true }));
		setSelectedQuestion(generatedName);
	};

	const addQuestionToDynamicPanel = (
		panelId: string,
		type: QuestionType
	): void => {
		const panelEl = formData.elements.find(
			(e) => isDynamicPanel(e) && e.element.id === panelId
		);
		if (!panelEl || !isDynamicPanel(panelEl)) return;
		const title = `New ${QUESTION_TYPES[type].label} Question`;
		const generatedName = generateUniqueName(title, [
			...formData.elements,
			...panelEl.element.templateElements,
		]);
		const base: BaseQuestion = {
			name: generatedName,
			type,
			title,
			description: '',
			isRequired: false,
			readOnly: false,
			visible: true,
			showTitleAndDescription: true,
			validators: [],
			visibleIf: '',
		};
		let question: Question;
		if (type === 'number') {
			question = { ...base, type: 'number', min: null, max: null };
		} else if (
			type === 'dropdown' ||
			type === 'multiselect' ||
			type === 'checkbox' ||
			type === 'radiogroup'
		) {
			question = {
				...base,
				type,
				choices: ['Option 1', 'Option 2', 'Option 3'],
			} as ChoiceQuestion;
		} else {
			question = base;
		}
		const newElement: SurveyElement = {
			type: 'question',
			element: question,
		};
		const updatedTemplate = [
			...panelEl.element.templateElements,
			newElement,
		];
		updateElement(panelId, {
			templateElements: updatedTemplate,
		} as Partial<DynamicPanel>);
		// Expand and select newly added template question
		setExpandedPanels((prev) => ({ ...prev, [panelId]: true }));
		setSelectedQuestion(generatedName);
	};

	const updatePanelQuestion = (
		panelId: string,
		questionName: string,
		updates: Partial<Question>
	): void => {
		const panel = formData.elements.find(
			(e) => isPanel(e) && e.element.id === panelId
		);
		if (!panel || !isPanel(panel)) return;
		const updatedElements = panel.element.elements.map((el) => {
			if (isQuestion(el) && el.element.name === questionName) {
				return { ...el, element: { ...el.element, ...updates } };
			}
			return el;
		});
		updateElement(panelId, { elements: updatedElements } as Partial<Panel>);
	};

	const removePanelQuestion = (
		panelId: string,
		questionName: string
	): void => {
		const panel = formData.elements.find(
			(e) => isPanel(e) && e.element.id === panelId
		);
		if (!panel || !isPanel(panel)) return;
		const updatedElements = panel.element.elements.filter((el) =>
			isQuestion(el) ? el.element.name !== questionName : true
		);
		updateElement(panelId, { elements: updatedElements } as Partial<Panel>);
		if (selectedQuestion === questionName) setSelectedQuestion(null);
	};

	// Remove a template question from a dynamic panel
	const removeTemplateQuestion = (
		panelId: string,
		questionName: string
	): void => {
		const panel = formData.elements.find(
			(e) => isDynamicPanel(e) && e.element.id === panelId
		);
		if (!panel || !isDynamicPanel(panel)) return;
		const updatedTemplate = panel.element.templateElements.filter((el) =>
			isQuestion(el) ? el.element.name !== questionName : true
		);
		updateElement(panelId, {
			templateElements: updatedTemplate,
		} as Partial<DynamicPanel>);
		if (selectedQuestion === questionName) setSelectedQuestion(null);
	};

	// Dynamic Panel management
	const updateDynamicPanelTemplate = (
		panelId: string,
		elements: SurveyElement[]
	): void => {
		const panel = formData.elements.find(
			(e) => isDynamicPanel(e) && e.element.id === panelId
		);
		if (!panel || !isDynamicPanel(panel)) return;
		updateQuestion(panelId, {
			templateElements: elements,
		} as Partial<DynamicPanel>);
	};

	const updateDynamicPanelSettings = (
		panelId: string,
		updates: Partial<
			Pick<
				DynamicPanel,
				| 'minPanelCount'
				| 'maxPanelCount'
				| 'panelCount'
				| 'panelAddText'
				| 'panelRemoveText'
			>
		>
	): void => {
		const panel = formData.elements.find(
			(e) => isDynamicPanel(e) && e.element.id === panelId
		);
		if (!panel || !isDynamicPanel(panel)) return;
		updateQuestion(panelId, updates as Partial<DynamicPanel>);
	};

	const selectedEl = selectedQuestion
		? getElementById(formData.elements, selectedQuestion) || null
		: null;
	const currentQuestion: Question | null =
		selectedEl && isQuestion(selectedEl) ? selectedEl.element : null;
	const currentPanel: Panel | DynamicPanel | null =
		selectedEl && (isPanel(selectedEl) || isDynamicPanel(selectedEl))
			? (selectedEl.element as Panel | DynamicPanel)
			: null;

	// UI state for expanded panels
	const [expandedPanels, setExpandedPanels] = useState<
		Record<string, boolean>
	>({});

	const togglePanel = (id: string) => {
		setExpandedPanels((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	return (
		<div className='flex h-screen bg-gray-50'>
			<LeftPanel
				QUESTION_TYPES={QUESTION_TYPES}
				CONTAINER_TYPES={CONTAINER_TYPES as any}
				onAddQuestion={(t) => addQuestion(t)}
				onAddContainer={(t) => addElement(t)}
			/>

			{/* Middle Panel - Questions List */}
			<FormCanvas
				formData={formData}
				showJSON={showJSON}
				setShowJSON={setShowJSON}
				selectedQuestion={selectedQuestion}
				setSelectedQuestion={setSelectedQuestion}
				draggedItem={draggedItem}
				dragOverItem={dragOverItem}
				childDragOver={childDragOver}
				setDragOverItem={setDragOverItem}
				setChildDragOver={setChildDragOver}
				handleDragStart={handleDragStart}
				handleDragEnd={handleDragEnd}
				handleDragOver={handleDragOver}
				handleDragEnter={handleDragEnter}
				handleDragLeave={handleDragLeave}
				handleDrop={handleDrop}
				handleChildDragStart={handleChildDragStart}
				handleChildDropTo={handleChildDropTo}
				deleteQuestion={deleteQuestion}
				removePanelQuestion={removePanelQuestion}
				removeTemplateQuestion={removeTemplateQuestion}
				addQuestionToPanel={addQuestionToPanel}
				addQuestionToDynamicPanel={addQuestionToDynamicPanel}
				QUESTION_TYPES={QUESTION_TYPES}
				expandedPanels={expandedPanels}
				togglePanel={togglePanel}
				onMetaChange={({ title, description }) => {
					const updated: FormData = {
						...formData,
						title,
						description,
					};
					setFormData(updated);
					onChange?.(updated);
				}}
			/>

			<RightPanel
				currentQuestion={currentQuestion}
				currentPanel={currentPanel}
				formData={formData}
				QUESTION_TYPES={QUESTION_TYPES}
				isChoiceQuestion={isChoiceQuestion}
				isNumberQuestion={isNumberQuestion}
				updateQuestion={updateQuestion as any}
				updateChoice={updateChoice}
				addChoice={addChoice}
				removeChoice={removeChoice}
				addValidator={addValidator}
				updateValidator={updateValidator as any}
				deleteValidator={deleteValidator}
				generateUniqueName={generateUniqueName}
			/>
		</div>
	);
};
