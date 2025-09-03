import type { SurveyElement, Question, ChoiceQuestion, NumberQuestion, ValidatorType, Validator } from '../types';

export const isQuestion = (
	element: SurveyElement
): element is { type: 'question'; element: Question } => element.type === 'question';

export const isPanel = (
	element: SurveyElement
): element is { type: 'panel'; element: any } => element.type === 'panel';

export const isDynamicPanel = (
	element: SurveyElement
): element is { type: 'dynamicpanel'; element: any } => element.type === 'dynamicpanel';

export const isChoiceQuestion = (question: Question): question is ChoiceQuestion =>
	question.type === 'dropdown' ||
	question.type === 'multiselect' ||
	question.type === 'checkbox' ||
	question.type === 'radiogroup';

export const isNumberQuestion = (question: Question): question is NumberQuestion =>
	question.type === 'number';

export const getElementById = (
	elements: SurveyElement[],
	id: string
): SurveyElement | undefined => {
	for (const element of elements) {
		if (isQuestion(element) && element.element.name === id) return element;
		if (isPanel(element)) {
			if (element.element.id === id) return element;
			const found = getElementById(element.element.elements, id);
			if (found) return found;
		}
		if (isDynamicPanel(element)) {
			if (element.element.id === id) return element;
			const found = getElementById(element.element.templateElements, id);
			if (found) return found;
			if (element.element.elements && element.element.elements.length) {
				const found2 = getElementById(element.element.elements, id);
				if (found2) return found2;
			}
		}
	}
	return undefined;
};

export const createValidator = (type: ValidatorType): Validator => {
	switch (type) {
		case 'expression':
			return { type: 'expression', text: '', expression: '' } as Validator;
		case 'regex':
			return { type: 'regex', text: '', regex: '' } as Validator;
		case 'numeric':
			return { type: 'numeric', text: '', minValue: null, maxValue: null } as Validator;
		case 'text':
			return { type: 'text', text: '', minLength: 0, maxLength: 100 } as Validator;
		case 'email':
			return { type: 'email', text: 'Invalid email' } as Validator;
	}
};
