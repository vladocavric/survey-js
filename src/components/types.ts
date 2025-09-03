import type { ReactNode } from 'react';

export type QuestionType =
	| 'text'
	| 'dropdown'
	| 'multiselect'
	| 'boolean'
	| 'checkbox'
	| 'radiogroup'
	| 'date'
	| 'url'
	| 'email'
	| 'number'
	| 'phone'
	| 'comment';

export type ValidatorType = 'expression' | 'regex' | 'email' | 'numeric' | 'text';

export type QuestionTypeConfig = {
	label: string;
	icon: ReactNode;
};

export type ValidatorTypeConfig = {
	[key: string]: string;
};

export type BaseValidator = {
	type: ValidatorType;
	text: string;
};

export type ExpressionValidator = BaseValidator & {
	type: 'expression';
	expression: string;
};

export type RegexValidator = BaseValidator & {
	type: 'regex';
	regex: string;
};

export type NumericValidator = BaseValidator & {
	type: 'numeric';
	minValue: number | null;
	maxValue: number | null;
};

export type TextValidator = BaseValidator & {
	type: 'text';
	minLength: number;
	maxLength: number;
};

export type EmailValidator = BaseValidator & {
	type: 'email';
};

export type Validator =
	| ExpressionValidator
	| RegexValidator
	| NumericValidator
	| TextValidator
	| EmailValidator;

export type BaseQuestion = {
	name: string;
	type: QuestionType;
	title: string;
	description: string;
	isRequired: boolean;
	readOnly: boolean;
	visible: boolean;
	showTitleAndDescription: boolean;
	validators: Validator[];
	visibleIf: string;
};

export type ChoiceQuestion = BaseQuestion & {
	type: 'dropdown' | 'multiselect' | 'checkbox' | 'radiogroup';
	choices: string[];
};

export type NumberQuestion = BaseQuestion & {
	type: 'number';
	min: number | null;
	max: number | null;
};

export type Question = BaseQuestion | ChoiceQuestion | NumberQuestion;

export type Panel = {
	id: string;
	title: string;
	description: string;
	elements: SurveyElement[];
	visible: boolean;
	visibleIf: string;
};

export type DynamicPanel = {
	id: string;
	title: string;
	description: string;
	elements: SurveyElement[];
	templateElements: SurveyElement[];
	minPanelCount: number;
	maxPanelCount: number;
	panelCount: number;
	panelAddText: string;
	panelRemoveText: string;
	visible: boolean;
	visibleIf: string;
};

export type SurveyElement =
	| { type: 'question'; element: Question }
	| { type: 'panel'; element: Panel }
	| { type: 'dynamicpanel'; element: DynamicPanel };

export type FormData = {
	title: string;
	description: string;
	elements: SurveyElement[];
};

export type FormBuilderProps = {
	initialData?: FormData;
	onChange?: (data: FormData) => void;
};
