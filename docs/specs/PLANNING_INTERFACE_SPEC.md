# Planning Interface Technical Specification

## Overview

The Planning Interface is a core component of the Mo Plugin, providing a rich web-based environment for project planning and task generation. This specification details the technical requirements and implementation plan for enhancing the Planning Interface with AI-powered task generation and context creation.

## Current Implementation Status

The current Planning Interface has the following components implemented:
- Basic webview structure
- Project description input
- Simple (mock) task generation
- Task editing UI
- Push to Linear functionality
- Add to Queue functionality

## Enhancement Requirements

### 1. Rich Text Editor for Project Descriptions

- **Description**: Enhance the project description input to support markdown formatting and provide a better writing experience.
- **Components**:
  - Markdown editor with preview capability
  - Syntax highlighting
  - Formatting toolbar
  - Responsive design for different window sizes

### 2. AI Integration for Task Generation

- **Description**: Integrate with Cursor AI to generate detailed tasks with rich context from project descriptions.
- **Components**:
  - AI prompt engineering for effective task generation
  - Context-aware task generation that understands code context
  - Structured output parsing and validation
  - Error handling for invalid AI responses
  - Progress indicators during generation

### 3. Task Context Generation

- **Description**: Generate comprehensive technical context for each task, including specifications, requirements, and implementation details.
- **Components**:
  - Technical specification template
  - Technology stack and framework details
  - Integration points and API requirements
  - Data models and structures
  - Implementation considerations
  - References to documentation and resources

### 4. Enhanced Task Organization

- **Description**: Provide better tools for organizing, editing, and customizing generated tasks.
- **Components**:
  - Drag-and-drop reordering
  - Batch editing capabilities
  - Task grouping and categorization
  - Priority and estimate adjustment
  - Task dependency visualization

### 5. Linear Integration Improvements

- **Description**: Enhance the Linear integration for pushing tasks with better context and organization.
- **Components**:
  - Team and project selection
  - Label assignment
  - State selection
  - Assignee selection
  - Cycle assignment

## Technical Architecture

### 1. Component Structure

```
PlanningInterface
├── ProjectDescriptionEditor
│   ├── MarkdownEditor
│   └── PreviewPane
├── AIGenerationControls
│   ├── GenerateButton
│   ├── OptionsPanel
│   └── ProgressIndicator
├── TaskList
│   ├── TaskItem
│   │   ├── TaskHeader
│   │   ├── TaskDetails
│   │   └── TaskControls
│   └── BatchControls
└── PushControls
    ├── LinearOptions
    └── PushButtons
```

### 2. Data Flow

1. User enters project description using rich text editor
2. User configures generation options (detail level, focus areas)
3. User clicks "Generate Tasks" button
4. Extension sends prompt to Cursor AI via the chat API
5. AI generates task list with detailed context
6. Extension parses and validates the response
7. Tasks are displayed in the task list
8. User can edit, reorder, and customize tasks
9. User configures Linear push options
10. User pushes tasks to Linear or adds to queue

### 3. State Management

The PlanningInterface will maintain the following state:
- Project description (string, markdown)
- Generation options (object)
- Generated tasks (array)
- UI state (loading, error, success)
- Linear push options (object)

### 4. API Integration

#### Cursor AI API

```typescript
// Function to generate tasks using Cursor AI
async function generateTasksWithAI(
  description: string,
  options: {
    detailLevel: 'low' | 'medium' | 'high';
    focusAreas: string[];
    techStack: string[];
  }
): Promise<Task[]> {
  // Create AI prompt
  const prompt = createTaskGenerationPrompt(description, options);
  
  // Call Cursor AI API
  const response = await cursorContext.chat.askAI(prompt);
  
  // Parse and validate response
  return parseAIResponse(response);
}
```

#### Linear API

```typescript
// Function to push tasks to Linear
async function pushTasksToLinear(
  tasks: Task[],
  options: {
    teamId: string;
    projectId?: string;
    stateId?: string;
    labelIds?: string[];
    cycleId?: string;
  }
): Promise<void> {
  // Push each task to Linear
  for (const task of tasks) {
    await createEnhancedLinearIssue(
      task.title,
      formatTaskDescription(task),
      {
        priority: task.priority,
        estimate: task.estimate,
        projectId: options.projectId,
        stateId: options.stateId,
        labelIds: options.labelIds,
        cycleId: options.cycleId
      }
    );
  }
}
```

## UI Design

### 1. Project Description Editor

- Full-width textarea with markdown support
- Toolbar with formatting options
- Toggle between edit and preview modes
- Responsive height adjustment
- Syntax highlighting

### 2. AI Generation Controls

- Generation options panel with:
  - Detail level selector (low, medium, high)
  - Focus areas checkboxes (backend, frontend, testing, etc.)
  - Tech stack selector
- Generate button with loading indicator
- Cancel button during generation
- Error and success messages

### 3. Task List

- Card-based layout for tasks
- Drag handles for reordering
- Expand/collapse details
- Edit buttons for title, description, priority, estimate
- Selection checkboxes for batch operations
- Batch operation toolbar (set priority, set estimate, delete)

### 4. Push Controls

- Team selector (dropdown)
- Project selector (dropdown)
- State selector (dropdown)
- Label selector (multi-select)
- Cycle selector (dropdown)
- Push to Linear button
- Add to Queue button

## Implementation Plan

### Phase 1: Basic AI Integration

1. Implement AI prompt engineering for task generation
2. Create response parsing and validation
3. Add error handling for invalid responses
4. Implement progress indicators during generation

### Phase 2: Rich Text Editor

1. Implement markdown editor with preview
2. Add syntax highlighting
3. Create formatting toolbar
4. Implement responsive design

### Phase 3: Enhanced Task Organization

1. Implement drag-and-drop reordering
2. Add batch editing capabilities
3. Create task grouping and categorization
4. Implement priority and estimate adjustment

### Phase 4: Linear Integration Improvements

1. Add team and project selection
2. Implement label assignment
3. Add state selection
4. Create assignee selection
5. Implement cycle assignment

## Testing Strategy

1. **Unit Tests**:
   - Test AI prompt generation
   - Test response parsing
   - Test Linear API integration

2. **Integration Tests**:
   - Test end-to-end task generation and pushing
   - Test UI interactions and state management

3. **User Testing**:
   - Gather feedback on usability
   - Validate task generation quality
   - Test with real project planning scenarios

## Dependencies

1. **External Libraries**:
   - Markdown editor component
   - Drag-and-drop library
   - UI component framework

2. **API Dependencies**:
   - Cursor AI API
   - Linear API

## Constraints

1. **API Limitations**:
   - Cursor API may have rate limits for AI requests
   - Linear API has rate limits for issue creation

2. **Performance Considerations**:
   - AI generation may be slow for complex projects
   - Large numbers of tasks may impact UI performance

## Success Criteria

1. Users can generate high-quality tasks with detailed context
2. Task generation is responsive and provides clear feedback
3. Users can easily customize and organize tasks
4. Tasks can be pushed to Linear with proper organization
5. The interface is intuitive and easy to use

---

*Last updated: 2025-03-08* 