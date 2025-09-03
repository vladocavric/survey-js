import type { SurveyElement } from "../types";

export const reorder = (list: SurveyElement[], from: number, to: number) => {
  const newList = [...list];
  const [moved] = newList.splice(from, 1);
  newList.splice(to, 0, moved);
  return newList;
};
