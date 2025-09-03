import React from 'react';
import { GripVertical, EyeOff } from 'lucide-react';
import type { QuestionType, SurveyElement } from './types';
import { DeleteButton } from './DeleteButton';

export type ChildrenListProps = {
  containerId: string;
  elements: SurveyElement[];
  destType: 'panel' | 'dynamicpanel';
  QUESTION_TYPES: Record<QuestionType, { label: string; icon: React.ReactNode }>;
  selectedQuestion: string | null;
  childDragOver: string | null;
  setSelectedQuestion: (id: string) => void;
  setChildDragOver: (id: string | null) => void;
  isQuestion: (el: SurveyElement) => el is { type: 'question'; element: any };
  handleChildDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    srcType: 'panel' | 'dynamicpanel',
    containerId: string,
    srcIndex: number
  ) => void;
  handleChildDropTo: (
    e: React.DragEvent<HTMLDivElement>,
    destType: 'panel' | 'dynamicpanel',
    destContainerId: string,
    destIndex: number
  ) => void;
  onDeleteChild: (containerId: string, questionName: string) => void;
};

export const ChildrenList: React.FC<ChildrenListProps> = ({
  containerId,
  elements,
  destType,
  QUESTION_TYPES,
  selectedQuestion,
  childDragOver,
  setSelectedQuestion,
  setChildDragOver,
  isQuestion,
  handleChildDragStart,
  handleChildDropTo,
  onDeleteChild,
}) => {
  return (
    <div className="mt-2 pl-6 flex flex-col gap-3">
      {elements.map((childEl, childIndex) => {
        if (!isQuestion(childEl)) return null;
        return (
          <div key={`${childEl.element.name}-wrap`}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setChildDragOver(`${containerId}:${childIndex}`);
              }}
              onDragLeave={() => setChildDragOver(null)}
              onDrop={(e) => handleChildDropTo(e, destType, containerId, childIndex)}
              className="h-3"
            />

            <div
              draggable
              onDragStart={(e) => handleChildDragStart(e, destType, containerId, childIndex)}
              onDragEnd={() => setChildDragOver(null)}
              onDragOver={(e) => {
                e.preventDefault();
                setChildDragOver(`${containerId}:${childIndex}`);
              }}
              onDragLeave={() => setChildDragOver(null)}
              onDrop={(e) => handleChildDropTo(e, destType, containerId, childIndex)}
              className="flex items-center justify-between"
            >
              <div
                className={`w-full border rounded-lg p-4 cursor-move transition-all ${
                  selectedQuestion === childEl.element.name
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  childDragOver === `${containerId}:${childIndex}`
                    ? 'border-2 border-blue-400 -mt-1'
                    : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuestion(childEl.element.name);
                }}
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {QUESTION_TYPES[childEl.element.type as QuestionType]?.icon}
                      </span>
                      <h4 className="font-medium">
                        {childEl.element.title || 'Untitled'}
                      </h4>
                      {(childEl.element as any).isRequired && (
                        <span className="text-red-500 text-sm">*</span>
                      )}
                      {(childEl.element as any).visible === false && (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    {(childEl.element as any).description && (
                      <p className="text-sm text-gray-600">
                        {(childEl.element as any).description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {QUESTION_TYPES[childEl.element.type as QuestionType]?.label}
                      </span>
                      {Array.isArray((childEl.element as any).validators) &&
                        (childEl.element as any).validators.length > 0 && (
                          <span className="text-xs px-2 py-1 bg-yellow-100 rounded">
                            {(childEl.element as any).validators.length} validator(s)
                          </span>
                        )}
                    </div>
                  </div>
                  <DeleteButton
                    onClick={() => onDeleteChild(containerId, childEl.element.name)}
                    title="Delete question"
                    ariaLabel={`Delete ${childEl.element.title}`}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Drop zone at the end */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setChildDragOver(`${containerId}:end`);
        }}
        onDragLeave={() => setChildDragOver(null)}
        onDrop={(e) => handleChildDropTo(e, destType, containerId, elements.length)}
        className={`h-8 rounded mt-2 flex items-center justify-center text-sm text-gray-400 ${
          childDragOver === `${containerId}:end` ? 'border-2 border-blue-400' : ''
        }`}
      >
        Drop here to add at end
      </div>
    </div>
  );
};
