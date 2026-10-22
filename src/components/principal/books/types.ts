import type { ReactNode } from "react";

export type RecordItem = { id: number; [key: string]: unknown };
export type BookData = Record<string, RecordItem[]>;
export interface BookPage {
  id: string;
  title: string;
  number: string;
  kind: string;
  entity?: RecordItem;
  children?: BookPage[];
}
export interface Field {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "subjects";
  maxLength?: number;
  preview?: (value: string) => Promise<string[]>;
  required?: boolean;
  value?: string;
  options?: { value: string; label: string }[];
}
export interface Command {
  label: string;
  variant?: "filled" | "outline";
  pageId?: string;
  title?: string;
  alternative?: { label: string; pageId: string };
  fields?: Field[];
  confirm?: string;
  content?: ReactNode;
  run?: (values: Record<string, string>, formData: FormData) => Promise<string | void>;
}
export interface PageRow {
  id: string;
  title: string;
  detail?: string;
  badge?: string;
  pageId?: string;
  actions?: Command[];
}
export interface PageView {
  eyebrow?: string;
  description?: ReactNode;
  guidance?: { text: string; action?: Command; after?: string };
  sections?: { title: string; rows: PageRow[]; empty?: string; actions?: Command[] }[];
  titleActions?: Command[];
  tabs?: { id: string; label: string }[];
  filterDisplay?: "buttons" | "dropdown";
  searchable?: boolean;
  content?: ReactNode;
  import?: { kind: "staff" | "learners"; classId?: string };
}
export interface BookContext {
  schoolId: number;
  data: BookData;
  page: BookPage;
  tab: string;
}
export interface BookDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  mark: string;
  load: (schoolId: number) => Promise<BookData>;
  pages: (data: BookData) => BookPage[];
  view: (context: BookContext) => Promise<PageView>;
}

export function flattenPages(pages: BookPage[]): BookPage[] {
  return pages.flatMap(page => [page, ...flattenPages(page.children ?? [])]);
}
export function findPagePath(pages: BookPage[], pageId: string): BookPage[] {
  for (const page of pages) {
    if (page.id === pageId) return [page];
    const children = findPagePath(page.children ?? [], pageId);
    if (children.length) return [page, ...children];
  }
  return [];
}
export const nameOf = (item: RecordItem) => [item.title, item.firstName, item.surname].filter(Boolean).join(" ");
export const learnerName = (item: RecordItem) => [item.firstName, item.surname].filter(Boolean).join(" ");
export const classLabel = (item: RecordItem) => /^grade\s/i.test(String(item.name)) ? String(item.name) : `Grade ${item.name}`;
/** Display formatting only; preserve the principal's stored stream name. */
export function streamLabel(name: string): string {
  const label = name.trim().replace(/\s+/g, " ").toUpperCase();
  return /\bSTREAM\b/.test(label) ? label : `${label ? `${label} ` : ""}STREAM`;
}
export const optionsOf = (items: RecordItem[], label = "name") => items.map(item => ({ value: String(item.id), label: String(item[label] ?? nameOf(item)) }));
