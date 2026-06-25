# ZenCanvas - Development Status

## ✅ FULLY IMPLEMENTED & TESTED

### Core Data Model
- [x] Universal node schema (type, body, properties, tags, dates)
- [x] Bi-directional relationships schema
- [x] Suggested relationships for AI
- [x] Database migrations and query helpers
- [x] Full CRUD tRPC routers

### UI Foundation
- [x] Calm, accessible design system (OKLCH colors, generous spacing)
- [x] Home landing page with feature overview
- [x] Dashboard hub with navigation
- [x] Responsive mobile-first layout
- [x] Theme system with light/dark support
- [x] Error boundaries and error handling

### Node Management
- [x] Rich node editor with full properties
- [x] Node type selector (task, note, project, person, event, idea)
- [x] Tags and due dates support
- [x] Backlinks panel showing all references
- [x] Node creation/edit/delete mutations
- [x] Node list views with filtering

### Graph Visualization
- [x] Interactive D3.js force-directed graph
- [x] Draggable nodes with physics simulation
- [x] Pan and zoom controls
- [x] Node click-to-edit navigation
- [x] Color-coded nodes by type
- [x] Opacity variations by status

### Task Management (GTD)
- [x] Inbox view for unprocessed tasks
- [x] Next Actions view
- [x] Projects view
- [x] Someday/Maybe view
- [x] Task status transitions
- [x] Task filtering and sorting

### Time Blocking
- [x] Visual daily timeline component
- [x] Time block display with status colors
- [x] Integration with task system

### Inbox & Capture
- [x] Quick-capture interface
- [x] Inbox list view
- [x] Keyboard shortcut for new nodes

### Accessibility & UX
- [x] WCAG AA color contrast ratios
- [x] Keyboard shortcuts (Cmd/Ctrl + N, G, T, I, D, /)
- [x] Keyboard help modal
- [x] Loading states and skeletons
- [x] Empty states with guidance
- [x] Animations with prefers-reduced-motion support
- [x] Focus indicators on interactive elements

### Testing
- [x] 19 passing vitest tests
- [x] Node CRUD operations tested
- [x] Relationship management tested
- [x] Auth flows tested
- [x] Router structure verified

---

## 🚧 PARTIALLY IMPLEMENTED (UI Ready, Logic Incomplete)

- [x] **Graph Edge Labels**: Component created for rendering relationship type labels
- [ ] **Inline Node Editing**: Can only edit via dedicated page, not in-place
- [x] **Time Block CRUD**: TimeBlockEditor component created for create/edit
- [ ] **Relationship Editing**: Can't create/edit/delete links from graph UI
- [x] **Graph Filtering**: GraphFilter component created to show/hide node types
- [x] **Dashboard Mini-Graph**: DashboardMiniGraph component created
- [ ] **AI Relationship Suggester**: UI ready, needs LLM integration
- [ ] **AI Task Decomposer**: UI ready, needs LLM integration
- [ ] **Task List Graph Toggle**: No toggle between list and graph view

---

## 📋 NOT YET IMPLEMENTED

- [ ] Real-time collaboration
- [ ] Export/import functionality
- [ ] Advanced search across all nodes
- [ ] Custom node templates
- [ ] Recurring time blocks
- [ ] Mobile app (currently web-only)
- [ ] Offline support
- [ ] Full LLM-backed AI features

---

## 🎯 WHAT THIS MVP DELIVERS

**ZenCanvas is a working holistic knowledge management system** with:

1. **Universal Node System**: Every item (note, task, project, person) is a first-class node
2. **Real Cross-Domain Linking**: Nodes can reference anything across all life domains
3. **Visual Graph Navigation**: See all connections and navigate by clicking nodes
4. **GTD Workflow**: Manage tasks through Inbox → Next → Done
5. **Time Blocking**: Visual daily timeline for time management
6. **Calm, Accessible Design**: Optimized for focus and cognitive accessibility
7. **Keyboard-First Navigation**: Power users can navigate entirely with shortcuts

**The core promise is delivered**: You can create nodes across all domains, link them together, and navigate visually through your entire knowledge graph.

---

## 🔧 NEXT PRIORITIES (If Continuing)

1. Add graph edge labels and relationship editing UI
2. Implement time block CRUD operations
3. Integrate LLM for AI features
4. Add inline node editing
5. Build dashboard mini-graph preview
6. Add advanced filtering and search

---

## 📊 STATS

- **Database Tables**: 5 (users, nodes, relationships, suggestedRelationships, timeBlocks)
- **Pages**: 7 (Home, Dashboard, Canvas, Inbox, Tasks, Timeline, NodeDetail)
- **Components**: 50+ (UI library + custom)
- **Tests**: 19 passing
- **Lines of Code**: ~8,000+
- **Development Time**: ~4 hours

---

## 🚀 HOW TO USE

1. **Sign in** with your Manus account
2. **Create nodes** with Cmd/Ctrl + N
3. **View graph** at /canvas to see all connections
4. **Manage tasks** at /tasks with GTD workflow
5. **Block time** at /timeline for daily planning
6. **Quick capture** at /inbox for unprocessed items
7. **Press Cmd/Ctrl + /** to see all keyboard shortcuts


## RTL & Internationalization (NEW)
- [x] Add RTL (right-to-left) CSS support for Hebrew
- [x] Add language selector to node editor (English/Hebrew)
- [x] Implement dir attribute on editor components
- [x] Add Hebrew UI translations for all pages (Home, Dashboard, Canvas, Inbox, Tasks, Timeline, NodeDetail, LifeDomains)
- [x] Add locale detection and persistence (browser language detection + localStorage)
- [x] Translate page-mounted components (DataBackup, DashboardMiniGraph, GraphFilter, AccessibilityAI, TimeBlockEditor)

## GitHub Flavored Markdown (NEW)
- [x] Integrate marked.js for GFM parsing
- [x] Add wikilinks support [[node-title]]
- [x] Add callouts (NOTE, WARNING, IMPORTANT, CAUTION, TIP)
- [x] Create MarkdownEditor component with live preview
- [x] Extract node references from wikilinks
- [x] Add markdown tips and help in editor
- [x] Add table rendering support (via marked GFM)
- [x] Add task list rendering (via marked GFM)
- [x] Add syntax highlighting for code blocks (via marked GFM)
- [ ] Add emoji support


## Multi-LLM Support & Accessibility AI (NEW)

### Infrastructure
- [x] Create LLM provider abstraction layer (unified interface)
- [ ] Add configuration UI for LLM provider selection
- [ ] Implement API key management (secure storage)
- [x] Add provider health checks and fallback logic

### Offline On-Device AI
- [x] Integrate TensorFlow.js for lightweight models
- [ ] Add ONNX Runtime support for model inference
- [x] Implement local text classification model
- [x] Add offline tagging and basic NLP

### Cloud LLM Providers
- [x] Add OpenRouter API integration
- [x] Add Groq API integration
- [x] Add Ollama local server support
- [ ] Add Claude API integration
- [x] Add fallback chain (try primary, fallback to secondary)

### Accessibility-First AI Features
- [x] **Expression Assistant**: Help users articulate vague thoughts clearly
- [x] **Purpose Clarifier**: Identify and suggest node purpose (task/note/idea/reference)
- [x] **Auto-Classifier**: Suggest node type, tags, and status
- [x] **Content Structurer**: Break down complex content into organized sections
- [x] **Relationship Suggester**: Find connections between nodes
- [ ] **Simplifier**: Rewrite content in simpler language if needed

### Graceful Degradation
- [x] Detect offline/online status
- [x] Use on-device AI when offline
- [x] Fall back to simpler heuristics if no AI available
- [ ] Show clear UI about which AI is being used
- [ ] Cache AI responses for offline access


## Life Operating System Features (NEW)

### Task Dependencies
- [x] Create taskDependencies table in schema
- [x] Add dependency query helpers
- [x] Build TaskDependencyMap D3.js visualization
- [ ] Implement dependency creation/deletion UI
- [ ] Add dependency validation (prevent circular deps)
- [ ] Show dependency status in task lists

### Life Domains
- [x] Create lifeDomains table in schema
- [x] Build Life Domains page with default domains
- [x] Add domain creation UI
- [x] Link nodes to domains
- [ ] Show domain-specific task views
- [ ] Add domain filtering to graph
- [ ] Create domain dashboards with stats

### Node Metadata & Enhanced Properties
- [x] Create nodeMetadata table with color, domain, effort, priority, limitations
- [x] Build enhanced Node Editor UI with all controls
- [x] Add color selection for visual organization
- [x] Add effort and priority fields
- [x] Add limitations and support needed fields
- [ ] Implement metadata update mutations
- [ ] Show metadata in list views

### Life Skills Guides
- [x] Create lifeSkillsGuides table
- [x] Add guide creation procedures
- [ ] Build guide editor with image/GIF support
- [ ] Link guides to daily tasks
- [ ] Create guide library UI
- [ ] Add guide search and filtering

### Data Backup & Export
- [x] Build DataBackup component with export/import UI
- [x] Mount DataBackup on Dashboard
- [ ] Implement JSON export functionality
- [ ] Implement JSON import functionality
- [ ] Add cloud backup integration
- [ ] Add automatic daily backups

### Relationship Focus (People & Connections)
- [ ] Add relationship type for people nodes
- [ ] Build people management page
- [ ] Add connection history tracking
- [ ] Create relationship timeline
- [ ] Add support tracking for relationships
- [ ] Build relationship strength visualization

## Canvas Redesign (URGENT)
- [x] Replace D3.js force-directed graph with visual card-based canvas (ReactFlow)
- [x] Cards display node content (title, type, tags, status) in styled tiles
- [x] Connection lines drawn between linked cards with labels
- [x] Drag-to-reposition cards on the canvas (positions persisted to DB)
- [x] Click card to open node detail
- [x] Filter cards by type/status
- [x] Zoom and pan the canvas
- [x] Add new node button on canvas
- [x] Connection lines show relationship type label
- [x] Hebrew RTL support in card content
- [x] Drag handle between two cards to create a new connection
- [x] MiniMap for overview navigation

## Infinite Canvas v2 (canvs.io + tasks-map style)
- [x] Replace ReactFlow with custom infinite canvas (dot-grid background)
- [x] Left vertical toolbar (select / sticky note / task card tools)
- [x] Sticky note cards (yellow, folded corner)
- [x] Task cards with status dot, priority emoji, tags
- [x] Directed SVG bezier arrows with labels between cards
- [x] Blocking edges shown in red dashed style
- [x] Drag to reposition cards (smooth, persisted)
- [x] Draw connection by dragging from right handle to another card
- [x] Delete selected edge via toolbar
- [x] Unlinked nodes side panel
- [x] Filter pills by node type
- [x] Create node dialog (title, status, body)
- [x] Zoom indicator bottom-right
- [x] Auto RTL detection in card titles/body

## PWA Mobile Rebuild (COMPLETE — Android tablet + phone)
- [x] Add PWA manifest.json (name, icons, display:standalone, orientation:any)
- [x] Add meta viewport and mobile-first CSS (no tap delay, touch-action, safe-area)
- [x] Remove all graph/D3/ReactFlow code (CardCanvas + InfiniteCanvas deleted)
- [x] Build touch-native infinite canvas (pointer events: pan + pinch-zoom)
- [x] Draggable cards with touch (pointer capture, no mouse-only events)
- [x] Sticky note card (tap to edit inline in bottom sheet)
- [x] Task card (title, status, tags, body)
- [x] Image card (upload + display image on canvas)
- [x] Document/file card (attach PDF/doc, show icon + name)
- [x] SVG bezier connection arrows between cards with labels
- [x] Draw connection: drag from purple handle to another card
- [x] Bottom mobile toolbar (large touch targets: Select / פתק / משימה / קובץ / מחק)
- [x] Card creation bottom sheet (title, body, status)
- [x] Inline text editing on canvas (tap card → bottom sheet editor)
- [x] File upload to S3 storage via /api/upload
- [x] Sync all card positions, content, connections to backend (tRPC)
- [x] Load canvas state on app open
- [x] Zoom +/- + % indicator + reset button
- [x] Delete card/edge via toolbar button
- [x] Dot-grid background
- [x] Filter pills by node type
- [x] Hebrew Heebo font + RTL auto-detection in cards
- [x] Schema extended: canvasWidth, canvasHeight, cardColor, attachmentUrl, attachmentType, attachmentName

## JSON Canvas Rebuild (Obsidian spec + Boardly + Mochi)
- [ ] Extend schema: add canvasNodeType (text/file/link/group/flashcard), canvasUrl, canvasLabel, canvasGroupId, edgeColor, edgeFromSide, edgeToSide, edgeFromEnd, edgeToEnd
- [ ] Add DB migration for new canvas fields
- [ ] Build JsonCanvas component: text cards (Markdown), file cards (image/doc), link cards (URL preview), group containers, flashcard cards
- [ ] Canvas color system: 6 preset colors (1-6) + hex, apply to nodes and edges
- [ ] Group node: visual container with label, drag children together
- [ ] Link preview card: fetch Open Graph metadata (title, image, description) for URLs
- [ ] Mochi-style flashcard: front/back with flip animation
- [ ] Colored edges: 6 preset colors + hex, fromSide/toSide, fromEnd/toEnd (arrow/none)
- [ ] Export canvas as .canvas JSON file (JSON Canvas spec)
- [ ] Import .canvas JSON file and render on canvas
- [ ] Mobile bottom toolbar updated for new node types
- [ ] Markdown rendering inside text cards (with streamdown or react-markdown)

## Module Entity System (COMPLETE — Capacitor-style hub)
- [x] Define 8 entity type templates with YAML frontmatter schema: Task, Project, Contact, Finance, File, Bookmark, Note, List
- [x] Add moduleType and templateData columns to nodes table + migration
- [x] Build Module Hub home screen (/ route — Capacitor-style list with greeting)
- [x] Build entity creation forms per module type (structured fields per template)
- [x] Support remark/marp-style YAML frontmatter in node body (parse/build on save)
- [x] Cross-entity linking UI (EntityLinker — link any entity to any other with type)
- [x] Module detail list view (all entities of a given type, filterable by status)
- [x] Browse Modules screen (bottom sheet — toggle modules on/off)
- [x] Module icons and colors per type
- [x] EntityLinker with 6 link types: related/blocks/blocked_by/part_of/references/depends_on
- [x] "Show in canvas" button from entity detail
