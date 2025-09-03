import type { SurveyElement, FormData } from '../types';
import { isPanel, isDynamicPanel } from './elements';

export type DragPayload = {
	srcType: 'root' | 'panel' | 'dynamicpanel';
	containerId: string | null;
	srcIndex: number;
};

export const encodeDragPayload = (payload: DragPayload): string =>
	JSON.stringify(payload);

export const decodeDragPayload = (raw: string): DragPayload =>
	JSON.parse(raw) as DragPayload;

export const removeFromSource = (
	data: FormData,
	srcType: DragPayload['srcType'],
	srcContainerId: string | null,
	srcIndex: number
): FormData => {
	let elements = data.elements.map((el) => {
		if (isPanel(el) && srcType === 'panel' && el.element.id === srcContainerId) {
			return { ...el, element: { ...el.element, elements: el.element.elements.filter((_, i) => i !== srcIndex) } } as SurveyElement;
		}
		if (isDynamicPanel(el) && srcType === 'dynamicpanel' && el.element.id === srcContainerId) {
			return { ...el, element: { ...el.element, templateElements: el.element.templateElements.filter((_, i) => i !== srcIndex) } } as SurveyElement;
		}
		return el;
	});
	if (srcType === 'root') {
		elements = elements.filter((_, i) => i !== srcIndex);
	}
	return { ...data, elements };
};
