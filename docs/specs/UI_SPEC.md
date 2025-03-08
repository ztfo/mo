# Mo Plugin UI Specification (Linear-Centric Approach)

## Overview

This document provides technical specifications for the Mo plugin's UI components within Cursor IDE, focusing on a Linear-centric approach with flexible context sharing.

## UI Architecture

### Integration with Cursor

The Mo plugin UI will be implemented using standard VS Code extension APIs, which Cursor supports. We'll use a combination of:

1. **Webview Panels**: For rich, interactive planning and export interfaces
2. **Tree Views**: For sidebar task management
3. **Status Bar Items**: For quick access to common actions
4. **Command Palette**: For executing commands

### UI Components Hierarchy

```
Mo Plugin UI
├── Planning Interface (Webview)
│   ├── Project Description
│   ├── AI Generation Controls
│   ├── Task List
│   ├── Task Detail Editor
│   └── Push Controls
├── Task Sidebar (TreeView)
│   ├── Task Hierarchy
│   ├── Status Filters
│   ├── Task Detail View
│   └── Action Buttons
├── Export Dialog (Webview)
│   ├── Location Selector
│   ├── Task Selection
│   ├── Organization Options
│   └── Format Options
└── Status Bar
    ├── Task Count
    └── Sync Status
```

## Component Specifications

### Planning Interface (Webview)

**Purpose**: Provide a rich interface for planning projects and generating tasks with detailed context.

**Implementation Details**:
- Implemented as a VS Code Webview panel
- Provides rich text editing for project descriptions
- Integrates with AI for task generation
- Allows task customization and organization
- Pushes tasks to Linear

**UI Elements**:
- Project description input (rich text)
- AI generation controls (trigger, customize)
- Task list (view, edit, organize)
- Task detail editor (rich text with formatting)
- Push controls (configure Linear properties, push)

**Data Flow**:
1. User enters project description and requirements
2. AI generates tasks with detailed context
3. User reviews and customizes tasks
4. User pushes tasks to Linear
5. Tasks are stored in Linear with complete context

### Task Sidebar (TreeView)

**Purpose**: Provide quick access to Linear tasks and their context.

**Implementation Details**:
- Implemented using VS Code TreeView API
- Pulls task data from Linear
- Shows hierarchical view of tasks
- Provides task detail view
- Offers context sharing and export options

**UI Elements**:
- Task hierarchy (organized by status, priority, etc.)
- Status filters (filter by various criteria)
- Task detail view (shows when task is selected)
- Action buttons:
  - Copy to Clipboard
  - Export Selected
  - Export All
  - Update Status

**Data Flow**:
1. Sidebar pulls task data from Linear
2. User navigates and selects tasks
3. User can copy task context or export to files
4. User can update task status
5. Changes sync back to Linear

### Export Dialog (Webview)

**Purpose**: Configure and execute task exports to files.

**Implementation Details**:
- Implemented as a VS Code Webview panel
- Provides options for export configuration
- Generates markdown files based on configuration
- Creates directory structure as specified

**UI Elements**:
- Location selector (choose export directory)
- Task selection (select which tasks to export)
- Organization options (how to organize files)
- Format options (customize export format)
- Export button (execute export)

**Data Flow**:
1. User configures export options
2. User selects tasks to export
3. User executes export
4. Files are generated in specified location
5. Confirmation is shown to user

### Status Bar Items

**Purpose**: Provide quick access to common actions and status information.

**Implementation Details**:
- Implemented using VS Code StatusBarItem API
- Shows task count and sync status
- Provides quick access to task view

**UI Elements**:
- Task count indicator
- Sync status indicator
- Quick access buttons

**Data Flow**:
1. Status bar items update based on Linear data
2. User clicks on status bar items to trigger actions
3. Actions open relevant panels or execute commands

## UI States and Transitions

### Planning Interface States
1. **Initial**: Empty project description
2. **Describing**: User entering project description
3. **Generating**: AI generating tasks
4. **Reviewing**: User reviewing and customizing tasks
5. **Pushing**: Tasks being pushed to Linear
6. **Complete**: Tasks successfully pushed
7. **Error**: Error occurred during operation

### Task Sidebar States
1. **Loading**: Loading tasks from Linear
2. **Loaded**: Tasks loaded and displayed
3. **Filtering**: User filtering tasks
4. **Selecting**: User selecting tasks
5. **Exporting**: Exporting tasks to files
6. **Updating**: Updating task status
7. **Error**: Error occurred during operation

### Export Dialog States
1. **Configuring**: User configuring export options
2. **Selecting**: User selecting tasks to export
3. **Exporting**: Generating files
4. **Complete**: Export successfully completed
5. **Error**: Error occurred during export

## Interaction Patterns

### Project Planning Flow
1. User opens command palette and runs "Mo: Plan Project"
2. Planning interface opens
3. User enters project description and requirements
4. User triggers AI task generation
5. AI generates tasks with detailed context
6. User reviews and customizes tasks
7. User pushes tasks to Linear

### Task Context Sharing Flow
1. User opens sidebar task view
2. User navigates to desired task
3. User selects task to view details
4. User copies task context to clipboard
5. User pastes context into Cursor AI chat
6. Cursor AI uses context to assist with implementation

### Task Export Flow
1. User selects tasks in sidebar
2. User clicks "Export Selected" or "Export All"
3. Export dialog opens
4. User configures export options
5. User executes export
6. Files are generated in specified location
7. Confirmation is shown to user

## Task Context Structure

### Technical Context Components
- **Overview**: Brief description of the task
- **Technical Requirements**: Detailed technical specifications
- **Technology Stack**: Frameworks, libraries, and tools to use
- **Integration Points**: How this component interacts with others
- **Data Models**: Relevant data structures and schemas
- **UX Patterns**: Design patterns and user experience guidelines
- **Implementation Considerations**: Important notes for implementation
- **References**: Links to documentation and resources

### Example Task Context
```
# User Authentication System

## Overview
Implement a secure user authentication system with login, registration, and password reset functionality.

## Technical Requirements
- Secure password storage with bcrypt
- JWT-based authentication
- Email verification for new accounts
- Password reset via email
- Rate limiting for login attempts

## Technology Stack
- Backend: Node.js with Express
- Database: MongoDB with Mongoose
- Authentication: Passport.js with JWT strategy
- Email: Nodemailer with SendGrid

## Integration Points
- User service API endpoints
- Frontend authentication components
- Email notification system
- User profile system

## Data Models
- User model with:
  - Email (unique)
  - Password (hashed)
  - Profile information
  - Account status
  - Verification tokens

## UX Patterns
- Single-page login/register form with tab navigation
- Inline validation with clear error messages
- Password strength indicator
- "Remember me" functionality
- Redirect to previous page after login

## Implementation Considerations
- Follow OWASP security best practices
- Implement proper error handling
- Use environment variables for sensitive configuration
- Create comprehensive test suite

## References
- [Passport.js Documentation](https://www.passportjs.org/)
- [JWT Best Practices](https://auth0.com/blog/jwt-best-practices/)
- [OWASP Authentication Guidelines](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/04-Authentication_Testing/README)
```

## Visual Design Guidelines

### Color Scheme
- Primary: #5E6AD2 (Linear brand color)
- Secondary: #F2C94C
- Success: #27AE60
- Error: #EB5757
- Background: Use VS Code theme colors
- Text: Use VS Code theme colors

### Typography
- Font: Use VS Code default fonts
- Headings: 16px, 14px, 12px
- Body: 12px
- Monospace: 12px (for code elements)

### Layout
- Responsive design that adapts to panel size
- Consistent padding and spacing
- Grid-based alignment
- Collapsible sections for complex forms

## Accessibility Considerations

- Keyboard navigation for all UI elements
- ARIA attributes for screen readers
- Sufficient color contrast
- Focus indicators for interactive elements
- Error messages that are clear and descriptive

## Implementation Plan

### Phase 1: Planning Interface
- Implement basic webview panel
- Create project description input
- Build AI integration for task generation
- Develop task list and detail editor
- Implement Linear push functionality

### Phase 2: Task Sidebar
- Create tree view for tasks
- Implement Linear data fetching
- Build task detail view
- Add copy to clipboard functionality
- Implement status update controls

### Phase 3: Export Functionality
- Create export dialog
- Implement file generation
- Build directory structure creation
- Add export configuration options
- Develop task selection mechanism

### Phase 4: Polish and Integration
- Add status bar items
- Implement keyboard shortcuts
- Create comprehensive error handling
- Add progress indicators
- Improve performance and responsiveness

## Technical Challenges and Solutions

### Challenge: Rich Text Editing in Webviews
**Solution**: Use a lightweight rich text editor library compatible with webviews, with message passing for communication.

### Challenge: Linear API Integration
**Solution**: Implement efficient GraphQL queries with proper caching and pagination.

### Challenge: File System Access
**Solution**: Use VS Code's workspace file system API for file creation and management.

### Challenge: Context Generation
**Solution**: Create structured templates for consistent context generation across tasks.

## Testing Strategy

- Unit tests for UI logic
- Integration tests for Linear API interaction
- Manual testing for UI components
- User testing for workflow validation 