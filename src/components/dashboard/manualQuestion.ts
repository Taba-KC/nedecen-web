export type ManualQuestion = { conceptId: number; body: string; memo: string };

export function readManualQuestion(values: { conceptId: number; body: string; memo: string }, concepts: { id: number }[]): ManualQuestion | null {
  const body = values.body.trim();
  if (!body || body.length > 12000 || values.memo.length > 24000 || !concepts.some(concept => concept.id === values.conceptId)) return null;
  return { conceptId: values.conceptId, body, memo: values.memo.trim() };
}
