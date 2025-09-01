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
} from 'lucide-react';

// =====================
// Type definitions
// =====================

type QuestionType =
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

type ValidatorType = 'expression' | 'regex' | 'email' | 'numeric' | 'text';

interface QuestionTypeConfig {
  label: string;
  icon: ReactNode;
}

type ValidatorTypeConfig = {
  [key: string]: string;
};

interface BaseValidator {
  type: ValidatorType;
  text: string;
}

interface ExpressionValidator extends BaseValidator {
  type: 'expression';
  expression: string;
}

interface RegexValidator extends BaseValidator {
  type: 'regex';
  regex: string;
}

interface NumericValidator extends BaseValidator {
  type: 'numeric';
  minValue: number | null;
  maxValue: number | null;
}

interface TextValidator extends BaseValidator {
  type: 'text';
  minLength: number;
  maxLength: number;
}

interface EmailValidator extends BaseValidator {
  type: 'email';
}

type Validator =
  | ExpressionValidator
  | RegexValidator
  | NumericValidator
  | TextValidator
  | EmailValidator;

interface BaseQuestion {
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
}

interface ChoiceQuestion extends BaseQuestion {
  type: 'dropdown' | 'multiselect' | 'checkbox' | 'radiogroup';
  choices: string[];
}

interface NumberQuestion extends BaseQuestion {
  type: 'number';
  min: number | null;
  max: number | null;
}

type PanelQuestion = BaseQuestion & {
  type: 'panel';
  elements: Question[];
}

type DynamicPanelQuestion = BaseQuestion & {
  type: 'dynamicpanel';
  templateElements: Question[];
  minPanelCount: number;
  maxPanelCount: number;
  panelCount: number;
  panelAddText?: string;
  panelRemoveText?: string;
}

type Question = BaseQuestion | ChoiceQuestion | NumberQuestion;

type Panel = {
  id: string;
  title: string;
  description: string;
  elements: SurveyElement[];
  isRequired?: boolean;
  visible: boolean;
  visibleIf: string;
}

type DynamicPanel = Panel & {
  templateElements: SurveyElement[];
  minPanelCount: number;
  maxPanelCount: number;
  panelCount: number;
  panelAddText?: string;
  panelRemoveText?: string;
}

type SurveyElement = {
  type: 'question' | 'panel' | 'dynamicpanel';
  element: Question | Panel | DynamicPanel;
}

type FormData = {
  title: string;
  description: string;
  elements: SurveyElement[];
}

interface FormBuilderProps {
  initialData?: FormData;
  onChange?: (data: FormData) => void;
}

const defaultFormData: FormData = {
  title: 'Untitled Survey',
  description: '',
  elements: []
};

// =====================
// Configs
// =====================

const QUESTION_TYPES: Record<QuestionType, QuestionTypeConfig> = {
  text: { label: "Text", icon: <FileText size={18} /> },
  dropdown: { label: "Dropdown", icon: <List size={18} /> },
  multiselect: { label: "Multi-Select", icon: <ListChecks size={18} /> },
  boolean: { label: "Yes/No", icon: <CheckCircle size={18} /> },
  checkbox: { label: "Checkboxes", icon: <CheckSquare size={18} /> },
  radiogroup: { label: "Radio Group", icon: <CheckCircle size={18} /> },
  date: { label: "Date", icon: <Calendar size={18} /> },
  url: { label: "URL", icon: <LinkIcon size={18} /> },
  email: { label: "Email", icon: <Mail size={18} /> },
  number: { label: "Number", icon: <Hash size={18} /> },
  phone: { label: "Phone Number", icon: <Phone size={18} /> },
  comment: { label: "Long Text", icon: <MessageSquare size={18} /> },
};

const CONTAINER_TYPES = {
  panel: { label: "Panel", icon: <Layers size={18} /> },
  dynamicpanel: { label: "Dynamic Panel", icon: <Copy size={18} /> },
} as const;


const VALIDATOR_TYPES: ValidatorTypeConfig = {
  expression: 'Expression',
  regex: 'Regular Expression',
  email: 'Email',
  numeric: 'Numeric',
  text: 'Text Length',
};

// =====================
// Helpers
// =====================

// Type guards
const isQuestion = (element: SurveyElement): element is { type: 'question'; element: Question } =>
  element.type === 'question';

const isPanel = (element: SurveyElement): element is { type: 'panel'; element: Panel } =>
  element.type === 'panel';

const isDynamicPanel = (element: SurveyElement): element is { type: 'dynamicpanel'; element: DynamicPanel } =>
  element.type === 'dynamicpanel';

const isChoiceQuestion = (question: Question): question is ChoiceQuestion =>
  question.type === 'dropdown' ||
  question.type === 'multiselect' ||
  question.type === 'checkbox' ||
  question.type === 'radiogroup';

const isNumberQuestion = (question: Question): question is NumberQuestion =>
  question.type === 'number';

const getElementById = (elements: SurveyElement[], id: string): SurveyElement | undefined => {
  for (const element of elements) {
    // If the element itself is a panel/dynamicpanel and its id matches, return it
    if (isPanel(element)) {
      if (element.element.id === id) return element;
      const found = getElementById(element.element.elements, id);
      if (found) return found;
    } else if (isDynamicPanel(element)) {
      if (element.element.id === id) return element;
      const found = getElementById(element.element.templateElements, id);
      if (found) return found;
      // also search in instance elements (panels may contain instance elements array)
      if (element.element.elements && element.element.elements.length) {
        const found2 = getElementById(element.element.elements, id);
        if (found2) return found2;
      }
    } else if (isQuestion(element) && element.element.name === id) {
      return element;
    }
  }
  return undefined;
};

// Safe factory for validators to keep strong typing
const createValidator = (type: ValidatorType): Validator => {
  switch (type) {
    case 'expression':
      return { type: 'expression', text: 'Validation error', expression: '' };
    case 'regex':
      return { type: 'regex', text: 'Validation error', regex: '' };
    case 'numeric':
      return { type: 'numeric', text: 'Validation error', minValue: null, maxValue: null };
    case 'text':
      return { type: 'text', text: 'Validation error', minLength: 0, maxLength: 100 };
    case 'email':
      return { type: 'email', text: 'Invalid email' };
  }
};

// =====================
// FormBuilder
// =====================

export const FormBuilder: React.FC<FormBuilderProps> = ({ 
  initialData = defaultFormData, 
  onChange 
}: FormBuilderProps) => {
  const [formData, setFormData] = useState<FormData>(() => ({
    title: initialData?.title || defaultFormData.title,
    description: initialData?.description || defaultFormData.description,
    elements: initialData?.elements || []
  }));
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const [showJSON, setShowJSON] = useState<boolean>(false);

  // Generate unique name from title
  const generateUniqueName = (title: string, elements: SurveyElement[]): string => {
    const baseName = `FORM_STYLE_DATA.${title.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    let uniqueName = baseName;
    let counter = 1;
    
    const isNameUsed = (name: string, elems: SurveyElement[]): boolean => {
      return elems.some(element => {
        if (isQuestion(element)) {
          return element.element.name === name;
        } else if (isPanel(element)) {
          if (element.element.id === name) return true;
          return isNameUsed(name, element.element.elements);
        } else if (isDynamicPanel(element)) {
          if (element.element.id === name) return true;
          // check both templateElements and instance elements
          if (isNameUsed(name, element.element.templateElements)) return true;
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
  const addElement = (type: QuestionType | keyof typeof CONTAINER_TYPES): void => {
    const isContainer = type in CONTAINER_TYPES;
    const title = `New ${isContainer ? CONTAINER_TYPES[type as keyof typeof CONTAINER_TYPES].label : QUESTION_TYPES[type as QuestionType].label}`;
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
            visibleIf: ''
          }
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
            visibleIf: ''
          }
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
      } else if (type === 'dropdown' || type === 'multiselect' || type === 'checkbox' || type === 'radiogroup') {
        question = { ...base, type, choices: ['Option 1', 'Option 2', 'Option 3'] } as ChoiceQuestion;
      } else {
        question = base;
      }

      const newElement: SurveyElement = {
        type: 'question',
        element: question
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
  const updateElement = (elementId: string, updates: Partial<Question | Panel | DynamicPanel>): void => {
    const updateRec = (elements: SurveyElement[]): SurveyElement[] => {
      return elements.map((element) => {
        // Update matching question
        if (isQuestion(element) && element.element.name === elementId) {
          return { ...element, element: { ...element.element, ...updates } };
        }

        // Update matching panel/dynamicpanel
        if ((isPanel(element) || isDynamicPanel(element)) && element.element.id === elementId) {
          return { ...element, element: { ...element.element, ...updates } };
        }

        // Recurse into panel children
        if (isPanel(element)) {
          const updatedChildren = updateRec(element.element.elements);
          if (updatedChildren !== element.element.elements) {
            return { ...element, element: { ...element.element, elements: updatedChildren } };
          }
          return element;
        }

        // Recurse into dynamic panel children/template
        if (isDynamicPanel(element)) {
          const updatedTemplate = updateRec(element.element.templateElements);
          let updatedInstances = element.element.elements ? updateRec(element.element.elements) : element.element.elements;
          if (updatedTemplate !== element.element.templateElements || updatedInstances !== element.element.elements) {
            return { ...element, element: { ...element.element, templateElements: updatedTemplate, elements: updatedInstances } };
          }
          return element;
        }

        return element;
      });
    };

    const updatedElements = updateRec(formData.elements);

    const updatedData: FormData = { ...formData, elements: updatedElements };

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
          return [...acc, { ...element, element: { ...element.element, elements: updatedChildren } }];
        }
        if (isDynamicPanel(element)) {
          if (element.element.id === elementId) return acc;
          const updatedTemplate = deleteRec(element.element.templateElements);
          const updatedInstances = element.element.elements ? deleteRec(element.element.elements) : element.element.elements;
          return [...acc, { ...element, element: { ...element.element, templateElements: updatedTemplate, elements: updatedInstances } }];
        }
        return [...acc, element];
      }, []);
    };

    const updatedElements = deleteRec(formData.elements);
    const updatedData: FormData = { ...formData, elements: updatedElements };

    setFormData(updatedData);
    if (selectedQuestion === elementId) setSelectedQuestion(null);
    onChange?.(updatedData);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number): void => {
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number): void => {
    e.preventDefault();
    if (draggedItem === null) return;
    setDragOverItem(null);

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
    const element = formData.elements.find(e => isQuestion(e) && e.element.name === questionName);
    if (!element || !isQuestion(element)) return;
    
    const newValidator = createValidator(type);
    const question = element.element;
    const updates: Partial<Question> = {
      validators: [...question.validators, newValidator]
    };
    updateElement(questionName, updates);
  };

  const updateValidator = (questionName: string, validatorIndex: number, updates: Partial<Validator>): void => {
    const element = formData.elements.find(e => isQuestion(e) && e.element.name === questionName);
    if (!element || !isQuestion(element)) return;
    
    const question = element.element;
    const newValidators = [...question.validators];
    newValidators[validatorIndex] = { ...newValidators[validatorIndex], ...updates } as Validator;
    
    const questionUpdates: Partial<Question> = {
      validators: newValidators
    };
    updateElement(questionName, questionUpdates);
  };

  const deleteValidator = (questionName: string, validatorIndex: number): void => {
    const element = formData.elements.find(e => isQuestion(e) && e.element.name === questionName);
    if (!element || !isQuestion(element)) return;
    
    const question = element.element;
    const newValidators = question.validators.filter((_, i: number) => i !== validatorIndex);
    
    const questionUpdates: Partial<Question> = {
      validators: newValidators
    };
    updateElement(questionName, questionUpdates);
  };

  // Choices
  const updateChoice = (questionName: string, choiceIndex: number, value: string): void => {
    const element = formData.elements.find(e => isQuestion(e) && e.element.name === questionName);
    if (!element || !isQuestion(element) || !isChoiceQuestion(element.element)) return;
    const question = element.element;
    const newChoices = [...question.choices];
    newChoices[choiceIndex] = value;
    updateElement(questionName, { choices: newChoices } as Partial<ChoiceQuestion>);
  };

  const addChoice = (questionName: string): void => {
  const el = getElementById(formData.elements, questionName);
  if (!el || !isQuestion(el) || !isChoiceQuestion(el.element)) return;
  const question = el.element;
    updateElement(questionName, {
      choices: [...question.choices, `Option ${question.choices.length + 1}`],
    } as Partial<ChoiceQuestion>);
  };

  const removeChoice = (questionName: string, choiceIndex: number): void => {
  const el = getElementById(formData.elements, questionName);
  if (!el || !isQuestion(el) || !isChoiceQuestion(el.element)) return;
  const question = el.element;
    const newChoices = question.choices.filter((_, i) => i !== choiceIndex);
    updateElement(questionName, { choices: newChoices } as Partial<ChoiceQuestion>);
  };

  // Panel management

  // Alias for backward compatibility with code using updateQuestion
  const updateQuestion = updateElement;
  // Aliases for convenience
  const addQuestion = (type: QuestionType) => addElement(type);
  const deleteQuestion = (id: string) => deleteElement(id);
  const addQuestionToPanel = (panelId: string, type: QuestionType): void => {
  const panelEl = formData.elements.find(e => isPanel(e) && e.element.id === panelId);
  if (!panelEl || !isPanel(panelEl)) return;
    const title = `New ${QUESTION_TYPES[type].label} Question`;
  const generatedName = generateUniqueName(title, [...formData.elements, ...panelEl.element.elements]);
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
    } else if (type === 'dropdown' || type === 'multiselect' || type === 'checkbox' || type === 'radiogroup') {
      question = { ...base, type, choices: ['Option 1', 'Option 2', 'Option 3'] } as ChoiceQuestion;
    } else {
      question = base;
    }
    const newElement: SurveyElement = { type: 'question', element: question };
    const updatedElements = [...panelEl.element.elements, newElement];
  updateElement(panelId, { elements: updatedElements } as Partial<Panel>);
  // Expand and select newly added question
  setExpandedPanels(prev => ({ ...prev, [panelId]: true }));
  setSelectedQuestion(generatedName);
  };

  const addQuestionToDynamicPanel = (panelId: string, type: QuestionType): void => {
    const panelEl = formData.elements.find(e => isDynamicPanel(e) && e.element.id === panelId);
    if (!panelEl || !isDynamicPanel(panelEl)) return;
    const title = `New ${QUESTION_TYPES[type].label} Question`;
    const generatedName = generateUniqueName(title, [...formData.elements, ...panelEl.element.templateElements]);
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
    } else if (type === 'dropdown' || type === 'multiselect' || type === 'checkbox' || type === 'radiogroup') {
      question = { ...base, type, choices: ['Option 1', 'Option 2', 'Option 3'] } as ChoiceQuestion;
    } else {
      question = base;
    }
    const newElement: SurveyElement = { type: 'question', element: question };
    const updatedTemplate = [...panelEl.element.templateElements, newElement];
  updateElement(panelId, { templateElements: updatedTemplate } as Partial<DynamicPanel>);
  // Expand and select newly added template question
  setExpandedPanels(prev => ({ ...prev, [panelId]: true }));
  setSelectedQuestion(generatedName);
  };

  const updatePanelQuestion = (panelId: string, questionName: string, updates: Partial<Question>): void => {
    const panel = formData.elements.find(e => isPanel(e) && e.element.id === panelId);
    if (!panel || !isPanel(panel)) return;
    const updatedElements = panel.element.elements.map(el => {
      if (isQuestion(el) && el.element.name === questionName) {
        return { ...el, element: { ...el.element, ...updates } };
      }
      return el;
    });
    updateElement(panelId, { elements: updatedElements } as Partial<Panel>);
  };

  const removePanelQuestion = (panelId: string, questionName: string): void => {
    const panel = formData.elements.find(e => isPanel(e) && e.element.id === panelId);
    if (!panel || !isPanel(panel)) return;
    const updatedElements = panel.element.elements.filter(el => isQuestion(el) ? el.element.name !== questionName : true);
    updateElement(panelId, { elements: updatedElements } as Partial<Panel>);
  };

  // Dynamic Panel management
  const updateDynamicPanelTemplate = (panelId: string, elements: SurveyElement[]): void => {
    const panel = formData.elements.find((e) => isDynamicPanel(e) && e.element.id === panelId);
    if (!panel || !isDynamicPanel(panel)) return;
    updateQuestion(panelId, { templateElements: elements } as Partial<DynamicPanel>);
  };

  const updateDynamicPanelSettings = (
    panelId: string,
    updates: Partial<Pick<DynamicPanel, 'minPanelCount' | 'maxPanelCount' | 'panelCount' | 'panelAddText' | 'panelRemoveText'>>
  ): void => {
    const panel = formData.elements.find((e) => isDynamicPanel(e) && e.element.id === panelId);
    if (!panel || !isDynamicPanel(panel)) return;
    updateQuestion(panelId, updates as Partial<DynamicPanel>);
  };

  const selectedEl = selectedQuestion ? getElementById(formData.elements, selectedQuestion) || null : null;
  const currentQuestion: Question | null = selectedEl && isQuestion(selectedEl) ? selectedEl.element : null;
  const currentPanel: Panel | DynamicPanel | null = selectedEl && (isPanel(selectedEl) || isDynamicPanel(selectedEl)) ? selectedEl.element as Panel | DynamicPanel : null;

  // UI state for expanded panels
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({});

  const togglePanel = (id: string) => {
    setExpandedPanels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Question Types */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Question Types</h3>
        <div className="space-y-2">
          {Object.entries(QUESTION_TYPES).map(([type, config]) => (
            <button
              key={type}
              onClick={() => addQuestion(type as QuestionType)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
            >
              <span className="text-xl">{config.icon}</span>
              <span className="text-sm font-medium">{config.label}</span>
            </button>
          ))}
          {/* Container types (panels, dynamic panels) */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-sm font-semibold mb-2">Containers</h4>
            <div className="space-y-2">
              {Object.entries(CONTAINER_TYPES).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => addElement(type as keyof typeof CONTAINER_TYPES)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                >
                  <span className="text-xl">{config.icon}</span>
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Panel - Questions List */}
      <div className="flex-1 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Questions</h3>
          <button
            onClick={() => setShowJSON(!showJSON)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            {showJSON ? 'Hide' : 'Show'} JSON
          </button>
        </div>

        {showJSON ? (
          <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">{JSON.stringify(formData, null, 2)}</pre>
        ) : (
          <div className="space-y-2">
            {formData.elements.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No questions yet</p>
                <p className="text-sm mt-2">Click a question type to add</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.elements.map((el, index) => {
                  if (isQuestion(el)) {
                    const question = el.element;
                    return (
                      <div
                        key={question.name}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`border rounded-lg p-4 cursor-move transition-all ${
                          selectedQuestion === question.name ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                        } ${draggedItem === index ? 'opacity-50' : ''} ${dragOverItem === index ? 'border-2 border-blue-400 -mt-1' : ''}`}
                        onClick={() => setSelectedQuestion(question.name)}
                      >
                        <div className="flex items-start gap-3">
                          <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{QUESTION_TYPES[question.type]?.icon}</span>
                              <h4 className="font-medium">{question.title || 'Untitled'}</h4>
                              {question.isRequired && <span className="text-red-500 text-sm">*</span>}
                              {!question.visible && <EyeOff className="w-4 h-4 text-gray-400" />}
                            </div>
                            {question.description && <p className="text-sm text-gray-600">{question.description}</p>}
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded">{QUESTION_TYPES[question.type]?.label}</span>
                              {question.validators?.length > 0 && (
                                <span className="text-xs px-2 py-1 bg-yellow-100 rounded">{question.validators.length} validator(s)</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuestion(question.name);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (isPanel(el)) {
                    const panel = el.element;
                    return (
                      <div
                        key={panel.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`border rounded-lg p-3 bg-gray-50 cursor-move transition-all ${selectedQuestion === panel.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'} ${draggedItem === index ? 'opacity-50' : ''} ${dragOverItem === index ? 'border-2 border-blue-400 -mt-1' : ''}`}
                        onClick={() => setSelectedQuestion(panel.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => togglePanel(panel.id)} className="p-1">
                              {expandedPanels[panel.id] ? '▾' : '▸'}
                            </button>
                            <strong>{panel.title}</strong>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">Panel</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Inline type selector for adding nested questions */}
                            <div className="flex items-center gap-1">
                              <select onClick={(e) => e.stopPropagation()} defaultValue="" onChange={(e) => { const val = e.target.value as QuestionType; if (val) addQuestionToPanel(panel.id, val); e.currentTarget.value = ''; }} className="text-sm px-2 py-1 border rounded bg-white">
                                <option value="">+ Add</option>
                                {Object.entries(QUESTION_TYPES).map(([t, cfg]) => (
                                  <option key={t} value={t}>{cfg.label}</option>
                                ))}
                              </select>
                              <button onClick={(e) => { e.stopPropagation(); deleteQuestion(panel.id); }} className="p-1 text-red-500"> <Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        </div>
                        {expandedPanels[panel.id] && (
                          <div className="mt-2 space-y-2 pl-6">
                            {panel.elements.map((childEl) => isQuestion(childEl) ? (
                              <div key={childEl.element.name} className={`border rounded p-2 bg-white cursor-pointer ${selectedQuestion === childEl.element.name ? 'border-purple-500 bg-purple-50' : ''}`} onClick={(e) => { e.stopPropagation(); setSelectedQuestion(childEl.element.name); }}>
                                {childEl.element.title}
                              </div>
                            ) : null)}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isDynamicPanel(el)) {
                    const dp = el.element;
                    return (
                      <div
                        key={dp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`border rounded-lg p-3 bg-gray-50 cursor-move transition-all ${selectedQuestion === dp.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'} ${draggedItem === index ? 'opacity-50' : ''} ${dragOverItem === index ? 'border-2 border-blue-400 -mt-1' : ''}`}
                        onClick={() => setSelectedQuestion(dp.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => togglePanel(dp.id)} className="p-1">
                              {expandedPanels[dp.id] ? '▾' : '▸'}
                            </button>
                            <strong>{dp.title}</strong>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">Dynamic Panel</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <select onClick={(e) => e.stopPropagation()} defaultValue="" onChange={(e) => { const val = e.target.value as QuestionType; if (val) addQuestionToDynamicPanel(dp.id, val); e.currentTarget.value = ''; }} className="text-sm px-2 py-1 border rounded bg-white">
                                <option value="">+ Add Template Q</option>
                                {Object.entries(QUESTION_TYPES).map(([t, cfg]) => (
                                  <option key={t} value={t}>{cfg.label}</option>
                                ))}
                              </select>
                              <button onClick={(e) => { e.stopPropagation(); deleteQuestion(dp.id); }} className="p-1 text-red-500"> <Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        </div>
                        {expandedPanels[dp.id] && (
                          <div className="mt-2 space-y-2 pl-6">
                            {dp.templateElements.map((childEl) => isQuestion(childEl) ? (
                              <div key={childEl.element.name} className={`border rounded p-2 bg-white cursor-pointer ${selectedQuestion === childEl.element.name ? 'border-purple-500 bg-purple-50' : ''}`} onClick={(e) => { e.stopPropagation(); setSelectedQuestion(childEl.element.name); }}>
                                {childEl.element.title}
                              </div>
                            ) : null)}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Question Properties */}
      <div className="w-96 bg-white p-4 overflow-y-auto">
        {currentQuestion ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Question Properties</h3>

            {/* Basic Properties */}
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={currentQuestion.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                    if (currentQuestion.name.startsWith('FORM_STYLE_DATA.')) {
                      const newName = generateUniqueName(
                        newTitle,
                        formData.elements.filter((q) => !(isQuestion(q) && q.element.name === currentQuestion.name))
                      );
                      updateQuestion(currentQuestion.name, { title: newTitle, name: newName });
                    } else {
                      updateQuestion(currentQuestion.name, { title: newTitle });
                    }
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={currentQuestion.description}
                onChange={(e) => updateQuestion(currentQuestion.name, { description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Name (ID)</label>
              <input
                type="text"
                value={currentQuestion.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  const isUnique = !formData.elements.some((q) => isQuestion(q) && q.element.name === newName && q.element.name !== currentQuestion.name);
                  if (isUnique) updateQuestion(currentQuestion.name, { name: newName });
                }}
                onBlur={(e) => {
                  const newName = e.target.value;
                  const isDuplicate = formData.elements.some((q) => isQuestion(q) && q.element.name === newName && q.element.name !== currentQuestion.name);
                  if (isDuplicate) {
                    alert('Field name must be unique. This name already exists.');
                    e.currentTarget.value = currentQuestion.name;
                  }
                }}
                className="w-full px-3 py-2 border rounded-md bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {currentQuestion.name.startsWith('FORM_STYLE_DATA.')
                  ? 'Auto-generated from title. Edit to customize.'
                  : 'Custom field name'}
              </p>
            </div>

            {/* Choices for select types */}
            {isChoiceQuestion(currentQuestion) && (
              <div>
                <label className="block text-sm font-medium mb-1">Choices</label>
                <div className="space-y-2">
                  {currentQuestion.choices.map((choice, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => updateChoice(currentQuestion.name, index, e.target.value)}
                        className="flex-1 px-3 py-1 border rounded-md text-sm"
                      />
                      <button onClick={() => removeChoice(currentQuestion.name, index)} className="p-1 hover:bg-red-100 rounded text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addChoice(currentQuestion.name)} className="w-full py-1 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400">
                    + Add Choice
                  </button>
                </div>
              </div>
            )}

            {/* Number specific properties */}
            {isNumberQuestion(currentQuestion) && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Value</label>
                  <input
                    type="number"
                    value={currentQuestion.min ?? ''}
                    onChange={(e) => updateQuestion(currentQuestion.name, { min: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Value</label>
                  <input
                    type="number"
                    value={currentQuestion.max ?? ''}
                    onChange={(e) => updateQuestion(currentQuestion.name, { max: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </>
            )}

            {/* Boolean Properties */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentQuestion.isRequired}
                  onChange={(e) => updateQuestion(currentQuestion.name, { isRequired: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Required</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentQuestion.readOnly}
                  onChange={(e) => updateQuestion(currentQuestion.name, { readOnly: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Read Only</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentQuestion.visible}
                  onChange={(e) => updateQuestion(currentQuestion.name, { visible: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Visible</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentQuestion.showTitleAndDescription}
                  onChange={(e) => updateQuestion(currentQuestion.name, { showTitleAndDescription: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Show Title & Description</span>
              </label>
            </div>

            {/* Conditional Visibility */}
            <div>
              <label className="block text-sm font-medium mb-1">Make Visible If (Expression)</label>
              <input
                type="text"
                value={currentQuestion.visibleIf || ''}
                onChange={(e) => updateQuestion(currentQuestion.name, { visibleIf: e.target.value })}
                placeholder="{question1} = 'yes'"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {/* Validators */}
            <div>
              <label className="block text-sm font-medium mb-2">Validators</label>
              <div className="space-y-3">
                {currentQuestion.validators.map((validator, index) => (
                  <div key={index} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{validator.type}</span>
                      <button onClick={() => deleteValidator(currentQuestion.name, index)} className="p-1 hover:bg-red-100 rounded text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={validator.text}
                        onChange={(e) => updateValidator(currentQuestion.name, index, { text: e.target.value })}
                        placeholder="Error message"
                        className="w-full px-2 py-1 border rounded text-sm"
                      />

                      {validator.type === 'expression' && (
                        <input
                          type="text"
                          value={(validator as ExpressionValidator).expression ?? ''}
                          onChange={(e) => updateValidator(currentQuestion.name, index, { expression: e.target.value })}
                          placeholder="Expression"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      )}

                      {validator.type === 'regex' && (
                        <input
                          type="text"
                          value={(validator as RegexValidator).regex ?? ''}
                          onChange={(e) => updateValidator(currentQuestion.name, index, { regex: e.target.value })}
                          placeholder="Regular Expression"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      )}

                      {validator.type === 'numeric' && (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={(validator as NumericValidator).minValue ?? ''}
                            onChange={(e) =>
                              updateValidator(currentQuestion.name, index, {
                                minValue: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                            placeholder="Min"
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                          <input
                            type="number"
                            value={(validator as NumericValidator).maxValue ?? ''}
                            onChange={(e) =>
                              updateValidator(currentQuestion.name, index, {
                                maxValue: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                            placeholder="Max"
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      )}

                      {validator.type === 'text' && (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={(validator as TextValidator).minLength ?? ''}
                            onChange={(e) => updateValidator(currentQuestion.name, index, { minLength: Number(e.target.value) })}
                            placeholder="Min Length"
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                          <input
                            type="number"
                            value={(validator as TextValidator).maxLength ?? ''}
                            onChange={(e) => updateValidator(currentQuestion.name, index, { maxLength: Number(e.target.value) })}
                            placeholder="Max Length"
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <select
                  onChange={(e) => {
                    const val = e.target.value as ValidatorType | '';
                    if (val) {
                      addValidator(currentQuestion.name, val);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  defaultValue=""
                >
                  <option value="">+ Add Validator</option>
                  {Object.entries(VALIDATOR_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : currentPanel ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Panel Properties</h3>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={currentPanel.title}
                onChange={(e) => updateQuestion(currentPanel.id, { title: e.target.value } as Partial<Panel>)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={currentPanel.description}
                onChange={(e) => updateQuestion(currentPanel.id, { description: e.target.value } as Partial<Panel>)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ID</label>
              <input
                type="text"
                value={currentPanel.id}
                onChange={(e) => {
                  const newId = e.target.value;
                  const isUnique = !formData.elements.some((q) => (isPanel(q) || isDynamicPanel(q)) && q.element.id === newId && q.element.id !== currentPanel.id);
                  if (isUnique) updateQuestion(currentPanel.id, { id: newId } as Partial<Panel>);
                }}
                className="w-full px-3 py-2 border rounded-md bg-gray-50"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentPanel.visible}
                  onChange={(e) => updateQuestion(currentPanel.id, { visible: e.target.checked } as Partial<Panel>)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">Visible</span>
              </label>
            </div>

            {/* Dynamic panel specific settings */}
            {('templateElements' in currentPanel) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Dynamic Panel Settings</h4>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Panels</label>
                  <input type="number" value={(currentPanel as DynamicPanel).minPanelCount} onChange={(e) => updateQuestion(currentPanel.id, { minPanelCount: Number(e.target.value) } as Partial<DynamicPanel>)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Panels</label>
                  <input type="number" value={(currentPanel as DynamicPanel).maxPanelCount} onChange={(e) => updateQuestion(currentPanel.id, { maxPanelCount: Number(e.target.value) } as Partial<DynamicPanel>)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Panel Count</label>
                  <input type="number" value={(currentPanel as DynamicPanel).panelCount} onChange={(e) => updateQuestion(currentPanel.id, { panelCount: Number(e.target.value) } as Partial<DynamicPanel>)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Add Button Text</label>
                  <input type="text" value={(currentPanel as DynamicPanel).panelAddText || ''} onChange={(e) => updateQuestion(currentPanel.id, { panelAddText: e.target.value } as Partial<DynamicPanel>)} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remove Button Text</label>
                  <input type="text" value={(currentPanel as DynamicPanel).panelRemoveText || ''} onChange={(e) => updateQuestion(currentPanel.id, { panelRemoveText: e.target.value } as Partial<DynamicPanel>)} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Select a question or panel to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================
// Example usage component
// =====================

const App: React.FC = () => {
  const [surveyData, setSurveyData] = useState<FormData>({
    title: 'Example Survey',
    description: '',
    elements: [
      {
        type: 'question',
        element: {
          name: 'name',
          type: 'text',
          title: 'What is your name?',
          description: 'Please enter your full name',
          isRequired: true,
          readOnly: false,
          visible: true,
          showTitleAndDescription: true,
          validators: [
            {
              type: 'text',
              text: 'Name should be between 2 and 50 characters',
              minLength: 2,
              maxLength: 50,
            },
          ],
          visibleIf: '',
        }
      },
      {
        type: 'question',
        element: {
          name: 'age',
          type: 'number',
          title: 'What is your age?',
          description: '',
          isRequired: true,
          readOnly: false,
          visible: true,
          showTitleAndDescription: true,
          min: 18,
          max: 100,
          validators: [
            {
              type: 'numeric',
              text: 'Age must be between 18 and 100',
              minValue: 18,
              maxValue: 100,
            },
          ],
          visibleIf: '',
        }
      },
      {
        type: 'question',
        element: {
          name: 'country',
          type: 'dropdown',
          title: 'Select your country',
          description: '',
          isRequired: true,
          readOnly: false,
          visible: true,
          showTitleAndDescription: true,
          choices: ['USA', 'Canada', 'UK', 'Australia', 'Other'],
          validators: [],
          visibleIf: '',
        }
      },
    ],
  });

  return (
    <div className="h-screen">
      <FormBuilder
        initialData={surveyData}
        onChange={(data: FormData) => {
          setSurveyData(data);
          console.log('Survey JSON:', data);
        }}
      />
    </div>
  );
};

export default App;
