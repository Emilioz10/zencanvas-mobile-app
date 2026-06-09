# ZenCanvas - Development TODO

## Core Data Model & Schema
- [x] Design universal node schema (nodes table with type, body, properties)
- [x] Design relationships/edges schema (bi-directional typed links)
- [x] Design time blocks schema (linked to nodes)
- [x] Design tags and properties schema
- [x] Create Drizzle migrations for all tables
- [x] Write database query helpers in server/db.ts

## Foundation & Navigation
- [x] Define design system: color palette, typography, spacing (calm, accessible)
- [x] Build home dashboard layout with sidebar navigation
- [x] Implement theme system (light/dark with accessible contrast)
- [x] Create main navigation: Canvas, Inbox, Tasks, Timeline, Dashboard
- [x] Set up routing structure in App.tsx
- [x] Create tRPC routers for nodes, relationships, and suggestions
- [x] Build landing page with feature overview
- [x] Build dashboard home page with stats and recent nodes

## Universal Node Editor
- [x] Build rich-text editor component (body field)
- [x] Build node properties panel (type, status, tags, dates)
- [x] Build backlinks panel showing all references to current node
- [x] Implement node creation/edit/delete mutations
- [x] Build node type selector (task, note, project, person, event, etc.)
- [ ] Add node inline editing from graph/list views

## Interactive Visual Graph Canvas
- [x] Choose graph visualization library (D3.js or similar)
- [x] Build canvas component with pan/zoom controls
- [x] Render nodes as draggable, interactive elements
- [ ] Render edges with visible, readable link labels (relationship types)
- [x] Implement node click-to-open-editor interaction
- [ ] Add edge creation UI (drag from node to create link)
- [ ] Implement edge deletion and relationship type editing
- [ ] Add graph filtering (show/hide node types)
- [ ] Build mini-graph preview component for dashboard
- [x] Create Canvas page placeholder with zoom controls
- [x] Integrate D3.js force-directed graph visualization
- [x] Color nodes by type, opacity by status

## Daily Capture Inbox
- [x] Build quick-add modal/drawer (keyboard shortcut accessible)
- [x] Create inbox list view showing unprocessed captures
- [ ] Implement inbox-to-node linking workflow
- [ ] Add quick-add templates for common node types

## Time-Blocking Planner
- [x] Build visual daily timeline component
- [ ] Implement time block creation/edit/delete
- [ ] Add time block linking to tasks/projects/people
- [ ] Build weekly/monthly view toggle
- [ ] Implement time block drag-to-reschedule

## GTD Task Views
- [x] Build Inbox view (unprocessed tasks)
- [x] Build Next Actions view (ready-to-do tasks)
- [x] Build Projects view (grouped tasks)
- [x] Build Someday/Maybe view (deferred tasks)
- [x] Implement task status transitions (inbox → next → done)
- [ ] Add graph view toggle for all task lists
- [ ] Build task filtering and sorting

## AI Features
- [x] Integrate AI relationship suggester (analyzes nodes, suggests links)
- [x] Build relationship suggestion UI with accept/reject
- [x] Integrate AI task decomposer (breaks down complex tasks)
- [x] Build task decomposition UI with subtask preview
- [ ] Add "generate subtasks" button to task editor

## Polish & Accessibility
- [x] Ensure WCAG AA contrast ratios across all text
- [ ] Add keyboard navigation for all major flows
- [ ] Implement focus indicators and keyboard shortcuts
- [x] Add loading states and error handling
- [x] Optimize animations (respect prefers-reduced-motion)
- [x] Test cross-domain navigation flows
- [x] Add empty states and onboarding hints
- [x] Refine typography and spacing for readability

## Testing & Delivery
- [x] Write vitest tests for core mutations and queries
- [x] Test graph navigation and node linking
- [ ] Test AI features with sample data
- [x] Create checkpoint and prepare for delivery
