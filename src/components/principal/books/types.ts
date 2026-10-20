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
  type?: "text" | "textarea" | "select" | "number" | "file" | "subjects";
  maxLength?: number;
  preview?: (value: string) => Promise<string[]>;
  required?: boolean;
  value?: string;
  options?: { value: string; label: string }[];
}
export interface Command {
  label: string;
  title?: string;
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
  description?: string;
  stats?: { label: string; value: string | number }[];
  sections?: { title: string; rows: PageRow[]; empty?: string }[];
  actions?: Command[];
  links?: { label: string; pageId: string }[];
  tabs?: { id: string; label: string }[];
  content?: ReactNode;
  image?: string;
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
export const nameOf = (item: RecordItem) => [item.title, item.firstName, item.surname].filter(Boolean).join(" ");
export const classLabel = (item: RecordItem) => /^grade\s/i.test(String(item.name)) ? String(item.name) : `Grade ${item.name}`;
export const optionsOf = (items: RecordItem[], label = "name") => items.map(item => ({ value: String(item.id), label: String(item[label] ?? nameOf(item)) }));
