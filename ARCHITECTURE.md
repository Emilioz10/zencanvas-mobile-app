# ZenCanvas Mobile App - Architecture Overview

## System Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        UI["UI Components<br/>(React/TypeScript)"]
        Canvas["Visual Canvas<br/>Board Engine"]
        Notes["Object-Based<br/>Notes System"]
        Tasks["Task Management<br/>Interface"]
    end

    subgraph Features["Feature Layer"]
        GTD["GTD Task<br/>Management"]
        AIBreak["AI Task Breakdown<br/>Goblin Tools Style"]
        TimeBlock["Time-Blocking<br/>Schedules"]
        SmartEst["Smart Task<br/>Estimation"]
        Backlinks["Backlinks<br/>System"]
        MindMap["Mind Maps"]
        StickyNotes["Sticky Notes"]
    end

    subgraph DataLayer["Data Layer"]
        LocalDB["Local Storage<br/>SQLite/Async Storage"]
        Network["Networked Notes<br/>Sync"]
        Cache["Cache Layer"]
    end

    subgraph Services["Services Layer"]
        AIService["AI Services<br/>Task Breakdown Engine"]
        SyncService["Synchronization<br/>Service"]
        NotificationService["Notification<br/>Service"]
    end

    subgraph External["External Services"]
        AIEngine["AI Engine<br/>Integration"]
        CloudSync["Cloud Sync<br/>Backend"]
    end

    subgraph Build["Build & Runtime"]
        Manus["Manus<br/>Build Framework"]
        TypeScript["TypeScript<br/>Compiler"]
    end

    UI -->|manages| Canvas
    UI -->|manages| Notes
    UI -->|manages| Tasks
    
    Canvas --> Features
    Notes --> Features
    Tasks --> Features
    
    GTD --> DataLayer
    AIBreak --> DataLayer
    TimeBlock --> DataLayer
    SmartEst --> DataLayer
    Backlinks --> DataLayer
    MindMap --> DataLayer
    StickyNotes --> DataLayer
    
    DataLayer --> Services
    
    AIBreak -->|calls| AIService
    Network -->|uses| SyncService
    Services -->|integrates| External
    
    AIService --> AIEngine
    SyncService --> CloudSync
    
    TypeScript -->|compiles| Manus
    Manus -->|builds| Client
```

## Component Breakdown

### Client Layer
- **UI Components**: React-based user interface built with TypeScript
- **Visual Canvas Board Engine**: Core canvas rendering and interaction system
- **Object-Based Notes System**: Network-structured note management
- **Task Management Interface**: GTD and task-related UI

### Feature Layer
- **GTD Task Management**: Getting Things Done methodology implementation
- **AI Task Breakdown**: Goblin Tools-style AI-powered task decomposition
- **Time-Blocking Schedules**: Schedule visualization and management
- **Smart Task Estimation**: Intelligent task duration prediction
- **Backlinks System**: Bi-directional note references
- **Mind Maps**: Visual hierarchical thinking tool
- **Sticky Notes**: Quick note-taking interface

### Data Layer
- **Local Storage**: SQLite or async storage for persistence
- **Networked Notes Sync**: Object-based note synchronization
- **Cache Layer**: Performance optimization for frequently accessed data

### Services Layer
- **AI Services**: Task breakdown and estimation engine
- **Synchronization Service**: Handle network note syncing
- **Notification Service**: User notifications and reminders

### Build & Runtime
- **Manus**: Custom build framework for TypeScript/JavaScript compilation
- **TypeScript Compiler**: Type-safe compilation pipeline

## Technology Stack

- **Language**: TypeScript (96.7%), JavaScript (2.4%)
- **Build Framework**: Manus
- **Architecture Pattern**: Feature-based modular architecture with service layer abstraction
