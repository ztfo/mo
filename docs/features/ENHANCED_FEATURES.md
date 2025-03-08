# Mo Plugin - Enhanced Features Plan (Revised)

## Overview
This document outlines the revised scope and enhanced features for the Mo plugin, focusing on creating a Linear-centric project management experience with flexible context sharing for Cursor IDE.

## Extension API Constraints

After investigation, we've identified the following constraints with Cursor's extension API:
- Custom chat commands are not supported in Cursor
- We need to rely primarily on standard VS Code extension APIs
- UI integration must use standard VS Code UI components

## Core Functionality

### 1. Linear-Centric Project Planning

- **Web-Based Planning Interface**: Rich webview panel for project planning
  - Project description and requirements input
  - AI-generated tasks with detailed context
  - Task customization and organization
  - Linear integration for pushing tasks

- **Rich Context Generation**: For each task, generate comprehensive context:
  - Technical specifications and requirements
  - Technology stack and framework details
  - Integration points and API requirements
  - Data models and structures
  - UX patterns and design guidelines
  - Implementation considerations
  - References to documentation and resources

- **Linear as Source of Truth**: All task information stored in Linear
  - Complete technical context in issue descriptions
  - Proper categorization with labels, priorities, and estimates
  - Relationships between tasks maintained in Linear

### 2. Sidebar Task Management

- **Linear Task Integration**: Pull tasks and details from Linear
  - View all project tasks in a hierarchical tree view
  - Filter and search tasks by various criteria
  - See task status, priority, and assignee

- **Task Interaction Options**:
  - Copy task context to clipboard for pasting into Cursor AI chat
  - Export selected tasks as markdown files to `/tasks` directory
  - Export all tasks as markdown files
  - Update task status directly from sidebar

- **Flexible Export Functionality**:
  - Choose export location (default to `/tasks`)
  - Select specific tasks or export all
  - Organize exported files by status, priority, or category

### 3. VS Code Integration

- **Command Palette Integration**: Access all functionality through command palette
  - "Mo: Plan Project" - Open planning interface
  - "Mo: Show Tasks" - Open sidebar task view
  - "Mo: Export Tasks" - Export tasks to files
  - "Mo: Sync with Linear" - Sync latest changes from Linear

- **Status Bar Integration**: Quick access to common actions
  - Task count indicator
  - Sync status indicator
  - Quick access to task view

## Implementation Approaches

### Approach 1: Linear-Centric with Web Planning

- Focus on rich web-based planning experience
- Store all task information in Linear
- Provide flexible ways to access and use task context
- Maintain manual control over task exports and updates

### Approach 2: Hybrid Storage with Automatic Export

- Store task information in both Linear and local files
- Automatically export tasks to files when created or updated
- Provide options to customize export behavior
- Maintain sync between Linear and local files

### Approach 3: Context-Enhanced Linear Integration

- Focus on enhancing Linear issues with rich context
- Provide specialized views for different aspects of tasks
- Create custom Linear issue templates for different task types
- Integrate deeply with Linear's API for advanced functionality

## UI Components Specification

### Planning Interface (Webview)

- **Project Description**: Input for overall project description
- **AI Generation Controls**: Trigger and customize AI task generation
- **Task List**: View, edit, and organize generated tasks
- **Task Detail Editor**: Rich editor for task context and details
- **Push Controls**: Configure and push tasks to Linear

### Task Sidebar (TreeView)

- **Task Hierarchy**: Organized view of all tasks
- **Status Filters**: Filter tasks by status, priority, etc.
- **Task Detail View**: Show complete task details when selected
- **Action Buttons**: Copy, export, and update tasks
- **Sync Controls**: Manual sync with Linear

### Export Dialog (Webview)

- **Location Selector**: Choose where to export files
- **Task Selection**: Select which tasks to export
- **Organization Options**: How to organize exported files
- **Format Options**: Choose export format and style

## Technical Considerations

### Linear API Usage

- Use GraphQL API for efficient data fetching
- Implement proper caching to reduce API calls
- Handle rate limiting and authentication
- Create rich issue descriptions with markdown formatting

### Context Generation

- Generate consistent context across tasks
- Include project-wide technology and framework information
- Maintain consistency in terminology and approach
- Provide sufficient detail for both AI and human developers

### Data Management

- Linear as primary data store
- Local caching for performance
- Export functionality for file generation
- Conflict resolution for concurrent updates

## Implementation Plan

### Phase 1: Core Planning Experience

- Implement web-based planning interface
- Create AI task generation with rich context
- Build Linear integration for pushing tasks
- Develop basic sidebar for viewing tasks

### Phase 2: Enhanced Task Management

- Implement full task detail view in sidebar
- Create copy to clipboard functionality
- Build export functionality for task files
- Add task status update capabilities

### Phase 3: Refinement and Polish

- Enhance context generation for better consistency
- Improve Linear integration with advanced features
- Add customization options for exports
- Create comprehensive documentation

## Next Steps

1. Create detailed technical specifications for each component
2. Develop proof-of-concept for the planning interface
3. Implement Linear API integration
4. Build sidebar task view with basic functionality
5. Test with real project planning scenarios 