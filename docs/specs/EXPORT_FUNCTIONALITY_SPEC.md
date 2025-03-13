# Task Export Functionality Technical Specification

## Overview

The Task Export Functionality allows users to export task details from Linear to local markdown files, creating a structured repository of task context that can be easily referenced during development. This specification details the technical requirements and implementation plan for the export system.

## Current Implementation Status

The current export functionality has the following components implemented:
- Basic export function in the extension.ts file
- Simple file generation with minimal formatting
- Export to a predefined directory

## Enhancement Requirements

### 1. Export Dialog Webview

- **Description**: Create a dedicated webview for configuring and initiating exports.
- **Components**:
  - Export location selector
  - Task selection interface
  - Organization options
  - Format customization
  - Export preview

### 2. File Generation System

- **Description**: Enhance the file generation system with better formatting, templating, and customization options.
- **Components**:
  - Markdown template engine
  - Rich formatting with sections and headers
  - Code block formatting
  - Link generation
  - Metadata inclusion

### 3. Directory Structure Creation

- **Description**: Implement intelligent directory structure creation based on task properties and user preferences.
- **Components**:
  - Directory structure templates
  - Organization by status, priority, or category
  - Automatic directory creation
  - Structure preview and validation

### 4. Export Configuration Options

- **Description**: Provide extensive configuration options for customizing exports.
- **Components**:
  - Template selection
  - Section inclusion/exclusion
  - File naming conventions
  - Organization rules
  - Metadata options

## Technical Architecture

### 1. Component Structure

```
ExportSystem
├── ExportDialog
│   ├── LocationSelector
│   ├── TaskSelector
│   ├── OrganizationOptions
│   ├── FormatOptions
│   └── PreviewPane
├── TemplateEngine
│   ├── TemplateLoader
│   ├── VariableResolver
│   └── MarkdownRenderer
├── FileGenerator
│   ├── ContentFormatter
│   ├── FileWriter
│   └── LinkManager
└── DirectoryManager
    ├── StructureGenerator
    ├── PathResolver
    └── DirectoryCreator
```

### 2. Data Flow

1. User opens export dialog via command
2. User selects tasks to export
3. User configures export options
4. User previews export results
5. User initiates export
6. System creates directory structure
7. System generates files based on templates
8. System writes files to disk
9. System provides success/error feedback

### 3. State Management

The Export System will maintain the following state:
- Selected tasks (array)
- Export configuration (object)
- Export location (string)
- Template selection (string)
- Organization rules (object)
- UI state (loading, error, success)

### 4. API Integration

#### File System API

```typescript
// Function to create directory structure
async function createDirectoryStructure(
  baseDir: string,
  structure: {
    [key: string]: string | object
  }
): Promise<void> {
  // Create base directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Create subdirectories
  for (const [name, content] of Object.entries(structure)) {
    const dirPath = path.join(baseDir, name);
    
    if (typeof content === 'string') {
      // Create file
      fs.writeFileSync(dirPath, content);
    } else {
      // Create directory and recurse
      fs.mkdirSync(dirPath, { recursive: true });
      await createDirectoryStructure(dirPath, content as object);
    }
  }
}
```

#### Template Engine

```typescript
// Function to render template with variables
function renderTemplate(
  template: string,
  variables: Record<string, any>
): string {
  // Replace variables in template
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }
  
  return result;
}
```

## UI Design

### 1. Export Dialog

- Modal dialog with tabs for different configuration sections
- Task list with selection checkboxes
- Directory structure visualization
- Preview pane showing sample output
- Export button with loading indicator
- Cancel button
- Success/error messages

### 2. Location Selector

- File system path input with browse button
- Recent locations dropdown
- Default location option
- Path validation indicator

### 3. Task Selector

- List of available tasks with selection checkboxes
- Filter by status, priority, assignee
- Select all/none buttons
- Selection count indicator

### 4. Organization Options

- Directory structure templates dropdown
- Organization rule options:
  - By status
  - By priority
  - By label
  - By assignee
  - By project
  - Flat structure
- Custom organization option with rule editor

### 5. Format Options

- Template selection dropdown
- Section toggles for:
  - Overview
  - Technical Requirements
  - Implementation Details
  - References
  - Metadata
- File naming pattern editor

## Implementation Plan

### Phase 1: Basic Export Dialog

1. Create the export dialog webview
2. Implement task selection interface
3. Add basic export options
4. Connect to existing export functionality

### Phase 2: Enhanced File Generation

1. Implement template engine
2. Create default templates
3. Enhance markdown formatting
4. Add metadata inclusion options

### Phase 3: Directory Structure Creation

1. Implement directory structure generator
2. Add organization rules
3. Create structure preview
4. Implement path validation

### Phase 4: Advanced Configuration

1. Add template selection
2. Implement section customization
3. Create file naming convention editor
4. Add export presets

## Testing Strategy

1. **Unit Tests**:
   - Test template rendering
   - Test file system operations
   - Test organization rule application

2. **Integration Tests**:
   - Test end-to-end export process
   - Test UI interactions and state management

3. **User Testing**:
   - Validate usability of export dialog
   - Test with various export scenarios
   - Verify file and directory structure correctness

## Templates

### Default Task Template

```markdown
# {{title}}

## Overview
{{description}}

## Technical Requirements
- Priority: {{priority}}
- Estimate: {{estimate}}
- Status: {{status}}
{{#if labels}}
- Labels: {{labels}}
{{/if}}

## Implementation Details
{{#if implementationDetails}}
{{implementationDetails}}
{{else}}
*No implementation details provided.*
{{/if}}

## References
{{#if references}}
{{references}}
{{else}}
*No references provided.*
{{/if}}

---

*Task ID: {{identifier}}*
*Linear URL: {{url}}*
*Exported on: {{exportDate}}*
```

### Directory Structure Templates

#### By Status

```
tasks/
├── Backlog/
│   ├── task-1.md
│   └── task-2.md
├── In Progress/
│   └── task-3.md
└── Done/
    └── task-4.md
```

#### By Priority

```
tasks/
├── Priority 1 (Urgent)/
│   └── task-1.md
├── Priority 2 (High)/
│   └── task-2.md
├── Priority 3 (Medium)/
│   └── task-3.md
└── Priority 4 (Low)/
    └── task-4.md
```

#### By Project

```
tasks/
├── Project A/
│   ├── task-1.md
│   └── task-2.md
└── Project B/
    ├── task-3.md
    └── task-4.md
```

## Dependencies

1. **External Libraries**:
   - Template rendering library
   - File system utilities
   - Path manipulation utilities

2. **API Dependencies**:
   - Linear API for fetching task details
   - VS Code/Cursor filesystem API

## Constraints

1. **File System Limitations**:
   - Path length limitations
   - Character restrictions in filenames
   - Write permissions

2. **Performance Considerations**:
   - Large exports may be slow
   - File system operations are synchronous

## Success Criteria

1. Users can easily export tasks with rich context
2. Exports are well-organized and follow user preferences
3. Exported files contain comprehensive and well-formatted information
4. The export process provides clear feedback and error handling
5. The directory structure is logical and navigable

---

*Last updated: 2025-03-08* 