/**
 * Entity Templates — structured schemas for each module type.
 *
 * Each template defines:
 *  - fields: the structured form fields shown when creating/editing
 *  - frontmatter: the YAML frontmatter keys injected into the body
 *  - icon / color: visual identity on the hub
 *
 * Frontmatter syntax follows remark/marp conventions:
 *   ---
 *   key: value
 *   ---
 *   body content here
 */

export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "select"
  | "number"
  | "url"
  | "email"
  | "phone"
  | "tags"
  | "checkbox";

export interface TemplateField {
  key: string;
  label: string;
  labelHe: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface EntityTemplate {
  moduleType: string;
  label: string;
  labelHe: string;
  icon: string;
  color: string;         // Tailwind bg color class
  accentColor: string;   // hex for canvas card border
  description: string;
  descriptionHe: string;
  fields: TemplateField[];
  /** Keys that go into YAML frontmatter */
  frontmatterKeys: string[];
}

export const ENTITY_TEMPLATES: EntityTemplate[] = [
  {
    moduleType: "task",
    label: "Tasks",
    labelHe: "משימות",
    icon: "✅",
    color: "bg-blue-50",
    accentColor: "#3b82f6",
    description: "To-dos, actions, and GTD items",
    descriptionHe: "מטלות, פעולות ופריטי GTD",
    frontmatterKeys: ["status", "priority", "due", "project", "context", "effort"],
    fields: [
      { key: "title",    label: "Title",    labelHe: "כותרת",     type: "text",   required: true, placeholder: "What needs to be done?" },
      { key: "status",   label: "Status",   labelHe: "סטטוס",     type: "select", options: ["inbox","next","in_progress","waiting","someday","done","cancelled"] },
      { key: "priority", label: "Priority", labelHe: "עדיפות",    type: "select", options: ["low","medium","high","urgent"] },
      { key: "due",      label: "Due date", labelHe: "תאריך יעד", type: "date" },
      { key: "project",  label: "Project",  labelHe: "פרויקט",    type: "text",   placeholder: "Project name" },
      { key: "context",  label: "Context",  labelHe: "הקשר",      type: "text",   placeholder: "@home, @work, @phone" },
      { key: "effort",   label: "Effort",   labelHe: "מאמץ",      type: "select", options: ["5m","15m","30m","1h","2h","4h","full-day"] },
      { key: "body",     label: "Notes",    labelHe: "הערות",     type: "textarea" },
    ],
  },
  {
    moduleType: "project",
    label: "Projects",
    labelHe: "פרויקטים",
    icon: "📊",
    color: "bg-purple-50",
    accentColor: "#a855f7",
    description: "Multi-step goals and initiatives",
    descriptionHe: "יעדים ויוזמות רב-שלביות",
    frontmatterKeys: ["status", "priority", "start", "deadline", "area", "outcome"],
    fields: [
      { key: "title",    label: "Project name", labelHe: "שם פרויקט",  type: "text",   required: true },
      { key: "status",   label: "Status",       labelHe: "סטטוס",      type: "select", options: ["planning","active","on_hold","completed","cancelled"] },
      { key: "priority", label: "Priority",     labelHe: "עדיפות",     type: "select", options: ["low","medium","high"] },
      { key: "start",    label: "Start date",   labelHe: "תאריך התחלה",type: "date" },
      { key: "deadline", label: "Deadline",     labelHe: "דדליין",     type: "date" },
      { key: "area",     label: "Life area",    labelHe: "תחום חיים",  type: "text",   placeholder: "Work, Personal, Health..." },
      { key: "outcome",  label: "Desired outcome", labelHe: "תוצאה רצויה", type: "textarea" },
      { key: "body",     label: "Description",  labelHe: "תיאור",      type: "textarea" },
    ],
  },
  {
    moduleType: "contact",
    label: "Contacts",
    labelHe: "אנשי קשר",
    icon: "👤",
    color: "bg-orange-50",
    accentColor: "#f97316",
    description: "People, relationships, and connections",
    descriptionHe: "אנשים, קשרים ומערכות יחסים",
    frontmatterKeys: ["email", "phone", "company", "role", "birthday", "relationship"],
    fields: [
      { key: "title",        label: "Full name",    labelHe: "שם מלא",    type: "text",  required: true },
      { key: "email",        label: "Email",        labelHe: "אימייל",    type: "email" },
      { key: "phone",        label: "Phone",        labelHe: "טלפון",     type: "phone" },
      { key: "company",      label: "Company",      labelHe: "חברה",      type: "text" },
      { key: "role",         label: "Role / Title", labelHe: "תפקיד",     type: "text" },
      { key: "birthday",     label: "Birthday",     labelHe: "יום הולדת", type: "date" },
      { key: "relationship", label: "Relationship", labelHe: "סוג קשר",   type: "select", options: ["friend","family","colleague","mentor","client","other"] },
      { key: "body",         label: "Notes",        labelHe: "הערות",     type: "textarea" },
    ],
  },
  {
    moduleType: "finance",
    label: "Finances",
    labelHe: "כספים",
    icon: "💰",
    color: "bg-green-50",
    accentColor: "#22c55e",
    description: "Expenses, income, and budgets",
    descriptionHe: "הוצאות, הכנסות ותקציבים",
    frontmatterKeys: ["amount", "currency", "category", "date", "direction", "account"],
    fields: [
      { key: "title",     label: "Description",  labelHe: "תיאור",      type: "text",   required: true },
      { key: "amount",    label: "Amount",        labelHe: "סכום",       type: "number" },
      { key: "currency",  label: "Currency",      labelHe: "מטבע",       type: "select", options: ["ILS","USD","EUR","GBP"] },
      { key: "direction", label: "Type",          labelHe: "סוג",        type: "select", options: ["expense","income","transfer"] },
      { key: "category",  label: "Category",      labelHe: "קטגוריה",   type: "text",   placeholder: "Food, Rent, Salary..." },
      { key: "date",      label: "Date",          labelHe: "תאריך",      type: "date" },
      { key: "account",   label: "Account",       labelHe: "חשבון",      type: "text" },
      { key: "body",      label: "Notes",         labelHe: "הערות",      type: "textarea" },
    ],
  },
  {
    moduleType: "file",
    label: "Files",
    labelHe: "קבצים",
    icon: "📁",
    color: "bg-slate-50",
    accentColor: "#64748b",
    description: "Documents, images, and attachments",
    descriptionHe: "מסמכים, תמונות וקבצים מצורפים",
    frontmatterKeys: ["fileType", "source", "tags"],
    fields: [
      { key: "title",    label: "File name",  labelHe: "שם קובץ",  type: "text",     required: true },
      { key: "fileType", label: "File type",  labelHe: "סוג קובץ", type: "select",   options: ["image","pdf","doc","spreadsheet","presentation","audio","video","other"] },
      { key: "source",   label: "Source URL", labelHe: "מקור",     type: "url" },
      { key: "tags",     label: "Tags",       labelHe: "תגיות",    type: "tags" },
      { key: "body",     label: "Description",labelHe: "תיאור",    type: "textarea" },
    ],
  },
  {
    moduleType: "bookmark",
    label: "Bookmarks",
    labelHe: "סימניות",
    icon: "🔖",
    color: "bg-cyan-50",
    accentColor: "#06b6d4",
    description: "Saved links, articles, and references",
    descriptionHe: "קישורים שמורים, מאמרים ומקורות",
    frontmatterKeys: ["url", "source", "readStatus", "tags"],
    fields: [
      { key: "title",      label: "Title",       labelHe: "כותרת",       type: "text", required: true },
      { key: "url",        label: "URL",         labelHe: "קישור",        type: "url",  required: true },
      { key: "source",     label: "Source",      labelHe: "מקור",         type: "text", placeholder: "YouTube, Medium, Twitter..." },
      { key: "readStatus", label: "Read status", labelHe: "סטטוס קריאה", type: "select", options: ["unread","reading","read","archived"] },
      { key: "tags",       label: "Tags",        labelHe: "תגיות",        type: "tags" },
      { key: "body",       label: "Notes",       labelHe: "הערות",        type: "textarea" },
    ],
  },
  {
    moduleType: "note",
    label: "Notes",
    labelHe: "פתקים",
    icon: "📝",
    color: "bg-yellow-50",
    accentColor: "#eab308",
    description: "Free-form notes, ideas, and thoughts",
    descriptionHe: "פתקים חופשיים, רעיונות ומחשבות",
    frontmatterKeys: ["type", "tags", "area"],
    fields: [
      { key: "title", label: "Title",   labelHe: "כותרת",    type: "text" },
      { key: "type",  label: "Note type", labelHe: "סוג פתק", type: "select", options: ["note","idea","journal","reference","meeting","brainstorm"] },
      { key: "area",  label: "Area",    labelHe: "תחום",     type: "text" },
      { key: "tags",  label: "Tags",    labelHe: "תגיות",    type: "tags" },
      { key: "body",  label: "Content", labelHe: "תוכן",     type: "textarea", required: true },
    ],
  },
  {
    moduleType: "list",
    label: "Lists",
    labelHe: "רשימות",
    icon: "📋",
    color: "bg-rose-50",
    accentColor: "#f43f5e",
    description: "Shopping lists, checklists, and collections",
    descriptionHe: "רשימות קניות, צ'קליסטים ואוספים",
    frontmatterKeys: ["listType", "tags"],
    fields: [
      { key: "title",    label: "List name", labelHe: "שם רשימה",  type: "text", required: true },
      { key: "listType", label: "List type", labelHe: "סוג רשימה", type: "select", options: ["shopping","checklist","reading","watching","collection","other"] },
      { key: "tags",     label: "Tags",      labelHe: "תגיות",     type: "tags" },
      { key: "body",     label: "Items",     labelHe: "פריטים",    type: "textarea", placeholder: "- Item 1\n- Item 2\n- Item 3" },
    ],
  },
];

export const TEMPLATE_MAP = Object.fromEntries(
  ENTITY_TEMPLATES.map(t => [t.moduleType, t])
) as Record<string, EntityTemplate>;

/**
 * Build YAML frontmatter string from a field values map.
 * Follows remark/marp convention: --- key: value ---
 */
export function buildFrontmatter(template: EntityTemplate, values: Record<string, string>): string {
  const lines: string[] = ["---"];
  for (const key of template.frontmatterKeys) {
    const val = values[key];
    if (val && val.trim()) {
      // Quote values that contain special characters
      const needsQuote = /[:#\[\]{},|>&*!'"]/g.test(val);
      lines.push(`${key}: ${needsQuote ? `"${val.replace(/"/g, '\\"')}"` : val}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

/**
 * Parse YAML frontmatter from a body string.
 * Returns { frontmatter: Record<string,string>, body: string }
 */
export function parseFrontmatter(raw: string): { frontmatter: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
  }
  return { frontmatter: fm, body: match[2].trim() };
}
