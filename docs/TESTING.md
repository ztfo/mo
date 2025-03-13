# Mo Plugin - Testing Guide

This guide provides instructions for testing the Mo Plugin's features to verify functionality.

## Prerequisites

- Cursor IDE installed
- Linear API key configured in settings
- Linear Team ID configured in settings

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mo.git
   cd mo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your Linear API key:
   - Create a `.env` file in the root directory
   - Add your Linear API key and team ID:
     ```
     LINEAR_API_KEY=your_api_key
     LINEAR_TEAM_ID=your_team_id
     ```

4. Build the extension:
   ```bash
   npm run build
   ```

5. Run the extension in Cursor:
   - Open the project in Cursor
   - Press F5 or select "Start Debugging" from the debug menu

## Feature Testing

### 1. AI-Powered Task Generation

Test the Planning Interface with AI integration to verify task generation:

1. Open the Planning Interface:
   - Run the command `Mo: Plan Project` from the command palette (Ctrl+Shift+P or Cmd+Shift+P)

2. Enter a test project description:
   ```
   Create a responsive e-commerce website with user authentication, product catalog, shopping cart, and checkout functionality. The project should use React for the frontend and Node.js with Express for the backend. Include MongoDB for data storage.
   ```

3. Configure generation options:
   - Set Detail Level to "High"
   - Select focus areas: Backend, Frontend, Database
   - Set Tech Stack to "React, Node.js, Express, MongoDB"

4. Click "Generate Tasks"

5. Verify:
   - Tasks are generated with detailed descriptions
   - Each task has a priority and estimate
   - The descriptions include technical details
   - Tasks cover all selected focus areas

### 2. Export Dialog Functionality

Test the Export Dialog to verify task export capabilities:

1. Open the Export Dialog:
   - Run the command `Mo: Show Export Dialog` from the command palette

2. Test task selection:
   - Click "Select All" to select all tasks
   - Click "Select None" to deselect all tasks
   - Select a few individual tasks

3. Test organization options:
   - Switch between organization types: Flat, By Status, By Priority, By Project
   - Verify the directory structure preview updates accordingly

4. Test format options:
   - Switch between templates: Default, Minimal, Detailed
   - Toggle section checkboxes on and off
   - Test different file naming patterns

5. Preview functionality:
   - Switch to the Preview tab
   - Verify the preview content changes when template and sections change

6. Export tasks:
   - Set an export location
   - Click "Export Tasks"

7. Verify:
   - Files are created in the specified location
   - Directory structure matches the selected organization
   - File content matches the selected template and sections

### 3. Linear Integration

Test the Linear integration to verify task creation and syncing:

1. Create tasks in the Planning Interface:
   - Generate tasks as in test #1
   - Click "Push to Linear"

2. Verify in Linear:
   - Login to Linear
   - Check that tasks were created with correct details
   - Verify priorities and estimates are set correctly

3. Test sidebar refresh:
   - Run the command `Mo: Sync with Linear` from the command palette
   - Verify that the task sidebar displays updated tasks from Linear

## Troubleshooting

### Common Issues

1. **Cursor AI API Not Available**:
   - Symptom: Tasks are generated with mock data instead of AI-generated content
   - Solution: Ensure you're using a version of Cursor that supports the AI API

2. **Linear API Authentication Errors**:
   - Symptom: "Failed to push tasks to Linear" error
   - Solution: Verify your LINEAR_API_KEY and LINEAR_TEAM_ID in the .env file

3. **Export Permissions Error**:
   - Symptom: "Failed to export tasks" error when exporting
   - Solution: Ensure the export location is writable by the application

## Reporting Bugs

When reporting bugs, please include:

1. Steps to reproduce the issue
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Console logs (View > Output > Mo Plugin)

---

*Last updated: 2025-03-08* 