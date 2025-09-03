// FormCanvas.tsx
import React from 'react';
import { FormHeader } from './FormHeader';
import { DropZone } from './DropZone';
import { QuestionItem } from './QuestionItem';
import { PanelItem } from './PanelItem';
import { ChildrenList } from './ChildrenList';

import type {
  FormData,
  SurveyElement,
  Question,
  Panel,
  DynamicPanel,
  QuestionType,
  QuestionTypeConfig,
} from './types';

import {
  isQuestion,
  isPanel,
  isDynamicPanel,
} from './utils/elements';
import { DeleteButton } from './DeleteButton';

type FormCanvasProps = {
  formData: FormData;
  showJSON: boolean;
  setShowJSON: (v: boolean) => void;

  selectedQuestion: string | null;
  setSelectedQuestion: (id: string | null) => void;

  draggedItem: number | null;
  dragOverItem: number | null;
  childDragOver: string | null;

  setDragOverItem: (i: number | null) => void;
  setChildDragOver: (id: string | null) => void;

  handleDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragEnter: (index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;

  handleChildDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    srcType: 'root' | 'panel' | 'dynamicpanel',
    containerId: string | null,
    srcIndex: number
  ) => void;

  handleChildDropTo: (
    e: React.DragEvent<HTMLDivElement>,
    destType: 'root' | 'panel' | 'dynamicpanel',
    destContainerId: string | null,
    destIndex: number
  ) => void;

  deleteQuestion: (id: string) => void;
  removePanelQuestion: (panelId: string, questionName: string) => void;
  removeTemplateQuestion: (panelId: string, questionName: string) => void;

  addQuestionToPanel: (panelId: string, type: QuestionType) => void;
  addQuestionToDynamicPanel: (panelId: string, type: QuestionType) => void;

  QUESTION_TYPES: Record<QuestionType, QuestionTypeConfig>;

  expandedPanels: Record<string, boolean>;
  togglePanel: (id: string) => void;

  onMetaChange: (payload: { title: string; description: string }) => void;
};

export const FormCanvas: React.FC<FormCanvasProps> = ({
  formData,
  showJSON,
  setShowJSON,
  selectedQuestion,
  setSelectedQuestion,

  draggedItem,
  dragOverItem,
  childDragOver,

  setDragOverItem,
  setChildDragOver,

  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,

  handleChildDragStart,
  handleChildDropTo,

  deleteQuestion,
  removePanelQuestion,
  removeTemplateQuestion,

  addQuestionToPanel,
  addQuestionToDynamicPanel,

  QUESTION_TYPES,
  expandedPanels,
  togglePanel,

  onMetaChange,
}) => {
  return (
    <div className='flex-1 bg-white border-r border-gray-200 p-4 overflow-y-auto'>
      <div className='flex items-start justify-end gap-4 mb-4'>
        <button
          onClick={() => setShowJSON(!showJSON)}
          className='px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md'
        >
          {showJSON ? 'Hide' : 'Show'} JSON
        </button>
      </div>

      {showJSON ? (
        <pre className='bg-gray-100 p-4 rounded-lg text-xs overflow-auto'>
          {JSON.stringify(formData, null, 2)}
        </pre>
      ) : (
        <div className='flex flex-col gap-3 py-3 pb-10'>
          {formData.elements.length === 0 ? (
            <div className='text-center py-12 text-gray-400'>
              <p>No questions yet</p>
              <p className='text-sm mt-2'>Click a question type to add</p>
            </div>
          ) : (
            <>
              <h3 className='text-lg font-semibold'>Elements</h3>

              <div className='flex items-start justify-between gap-4 mb-4'>
                <FormHeader
                  title={formData.title}
                  description={formData.description}
                  onChange={onMetaChange}
                />
              </div>

              {/* Top drop zone */}
              <DropZone
                onDragOver={() => setDragOverItem(-1)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 0)}
                active={dragOverItem === -1}
                label='Drag here to add at top'
                className='mb-1'
              />

              {/* Root elements list */}
              {formData.elements.map((el, index) => {
                if (isQuestion(el)) {
                  const question = el.element;
                  return (
                    <QuestionItem
                      key={question.name}
                      question={question}
                      isSelected={selectedQuestion === question.name}
                      isDragged={draggedItem === index}
                      isDragOver={dragOverItem === index}
                      onClick={() => setSelectedQuestion(question.name)}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      icon={QUESTION_TYPES[question.type]?.icon}
                      typeLabel={QUESTION_TYPES[question.type]?.label ?? ''}
                      trailing={
                        <DeleteButton
                          onClick={() => deleteQuestion(question.name)}
                          title='Delete question'
                          ariaLabel={`Delete question ${question.title}`}
                        />
                      }
                    />
                  );
                }

                if (isPanel(el)) {
                  const panel = el.element as Panel;
                  return (
                    <PanelItem
                      key={panel.id}
                      id={panel.id}
                      title={panel.title}
                      isSelected={selectedQuestion === panel.id}
                      isDragged={draggedItem === index}
                      isDragOver={dragOverItem === index}
                      onClick={() => setSelectedQuestion(panel.id)}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      expanded={!!expandedPanels[panel.id]}
                      onToggle={() => togglePanel(panel.id)}
                      onDelete={() => deleteQuestion(panel.id)}
                      QUESTION_TYPES={QUESTION_TYPES}
                      onInlineAdd={(t) => addQuestionToPanel(panel.id, t)}
                      label='Panel'
                    >
                      {expandedPanels[panel.id] && (
                        <ChildrenList
                          containerId={panel.id}
                          elements={panel.elements}
                          destType='panel'
                          QUESTION_TYPES={QUESTION_TYPES}
                          selectedQuestion={selectedQuestion}
                          childDragOver={childDragOver}
                          setSelectedQuestion={(id) => setSelectedQuestion(id)}
                          setChildDragOver={setChildDragOver}
                          isQuestion={isQuestion as any}
                          handleChildDragStart={handleChildDragStart as any}
                          handleChildDropTo={handleChildDropTo as any}
                          onDeleteChild={removePanelQuestion}
                        />
                      )}
                    </PanelItem>
                  );
                }

                if (isDynamicPanel(el)) {
                  const dp = el.element as DynamicPanel;
                  return (
                    <PanelItem
                      key={dp.id}
                      id={dp.id}
                      title={dp.title}
                      isSelected={selectedQuestion === dp.id}
                      isDragged={draggedItem === index}
                      isDragOver={dragOverItem === index}
                      onClick={() => setSelectedQuestion(dp.id)}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      expanded={!!expandedPanels[dp.id]}
                      onToggle={() => togglePanel(dp.id)}
                      onDelete={() => deleteQuestion(dp.id)}
                      QUESTION_TYPES={QUESTION_TYPES}
                      onInlineAdd={(t) => addQuestionToDynamicPanel(dp.id, t)}
                      label='Dynamic Panel'
                    >
                      {expandedPanels[dp.id] && (
                        <ChildrenList
                          containerId={dp.id}
                          elements={dp.templateElements}
                          destType='dynamicpanel'
                          QUESTION_TYPES={QUESTION_TYPES}
                          selectedQuestion={selectedQuestion}
                          childDragOver={childDragOver}
                          setSelectedQuestion={(id) => setSelectedQuestion(id)}
                          setChildDragOver={setChildDragOver}
                          isQuestion={isQuestion as any}
                          handleChildDragStart={handleChildDragStart as any}
                          handleChildDropTo={handleChildDropTo as any}
                          onDeleteChild={removeTemplateQuestion}
                        />
                      )}
                    </PanelItem>
                  );
                }

                return null;
              })}

              {/* Bottom drop zone */}
              <DropZone
                onDragOver={() => setDragOverItem(-1)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, formData.elements.length)}
                active={dragOverItem === -1}
                label='Drag here to add at bottom'
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
