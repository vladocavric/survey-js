import { useState, useEffect } from "react";
import type { ICreatorOptions } from "survey-creator-core";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";

const defaultCreatorOptions: ICreatorOptions = {
  showLogicTab: true,
  showTranslationTab: true,
  haveCommercialLicense: true,
  autoSaveEnabled: true,
  showThemeTab: true,
  isAutoSave: true
};

export default function SurveyCreatorWidget(props: { json?: Object, options?: ICreatorOptions, onSave?: (json: any) => void }) {
  const [creator, setCreator] = useState<SurveyCreator>();

  useEffect(() => {
    const surveyCreator = new SurveyCreator(props.options || defaultCreatorOptions);

    if (props.json) {
      surveyCreator.text = JSON.stringify(props.json);
    }

    // Save survey
    surveyCreator.saveSurveyFunc = (saveNo: number, callback: Function) => {
      if (props.onSave) {
        props.onSave(surveyCreator.text);
      }
      callback(saveNo, true);
    };

    setCreator(surveyCreator);

    return () => {
      surveyCreator.dispose();
    };
  }, [props.json, props.options, props.onSave]);

  if (!creator) return null;

  return <SurveyCreatorComponent creator={creator} />
}
