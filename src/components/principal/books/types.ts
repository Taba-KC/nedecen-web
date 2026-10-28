/**
 * The contract between book definitions and the shared principal renderer. A BookPage is a
 * data object in a tree, not a separate Next.js page file. Stable IDs identify pages;
 * displayed numbers are recalculated from their order.
 */
import type { ReactNode } from "react";

/**
 * A deliberately flexible record shape shared by different principal books. Prefer a
 * specific response type inside feature-specific forms.
 */
export type RecordItem = { id: number; [key: string]: unknown };
export type BookData = Record<string, RecordItem[]>;
/**
 * A sidebar/page-tree node. children creates subpages; entity carries the record used by its
 * content/actions.
 */
export interface BookPage {
  id: string;
  title: string;
  number: string;
  kind: string;
  entity?: RecordItem;
  children?: BookPage[];
}
/**
 * A description of one dialog control. name becomes its submitted key; options supplies
 * select choices.
 */
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
/**
 * A button's behaviour: pageId navigates, fields/confirm describe a dialog, and run performs
 * work on Save. Returning a page ID opens that destination after refresh.
 */
export interface Command {
  label: string;
  variant?: "filled" | "outline";
  pageId?: string;
  title?: string;
  alternative?: { label: string; pageId: string };
  fields?: Field[];
  confirm?: string;
  content?: ReactNode;
  renderContent?: (controls: { onSaved: () => Promise<void>; onClose: () => void; setBusy: (busy: boolean) => void }) => ReactNode;
  run?: (values: Record<string, string>, formData: FormData) => Promise<string | void>;
}
/**
 * One displayed list item. pageId opens a subpage; actions are buttons belonging to this
 * particular row.
 */
export interface PageRow {
  id: string;
  title: string;
  detail?: string;
  badge?: string;
  pageId?: string;
  actions?: Command[];
}
/**
 * Content/layout slots understood by WorkspacePage. Defining a new property here also
 * requires teaching the renderer how to display it.
 */
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
/**
 * Inputs passed to a book's view function: current school, loaded records, selected node and
 * active filter.
 */
export interface BookContext {
  isPrincipal?: boolean;
  schoolId: number;
  data: BookData;
  page: BookPage;
  tab: string;
}
/**
 * A complete principal book: load gets records, pages builds navigation, view describes one
 * selected page.
 */
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

/**
 * Visit each page before its children to build the Previous/Next reading order. The tree
 * remains the source of parent relationships.
 */
export function flattenPages(pages: BookPage[]): BookPage[] {
  return pages.flatMap(page => [page, ...flattenPages(page.children ?? [])]);
}
/**
 * Find the current node and all its ancestors for breadcrumbs. An empty array means the page
 * ID was not found.
 */
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
/**
 * Format only the displayed stream name. Do not uppercase or rename the saved database
 * record here.
 */
/** Display formatting only; preserve the principal's stored stream name. */
export function streamLabel(name: string): string {
  const label = name.trim().replace(/\s+/g, " ").toUpperCase();
  return /\bSTREAM\b/.test(label) ? label : `${label ? `${label} ` : ""}STREAM`;
}
export const optionsOf = (items: RecordItem[], label = "name") => items.map(item => ({ value: String(item.id), label: String(item[label] ?? nameOf(item)) }));
