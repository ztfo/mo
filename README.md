<p align="center">
  <img src="src/assets/mo-headshot.png" alt="Mo" width="200">
</p>

# Mo: AI-Powered Project Management Cursor Plugin

An intelligent project planning and management tool that seamlessly integrates with Cursor IDE and Linear to automate development workflows.

## Vision

Mo aims to be your AI-powered project management assistant that lives within your development environment. By bringing project management directly into your IDE and leveraging AI to automate routine tasks, Mo helps developers focus on coding while maintaining excellent project organization.

## Features

### Current Features
- **AI-Powered Task Generation**: Break down features into actionable tasks with the help of AI
- **Linear Integration**: Automatically create and track tickets in Linear
- **Automated Documentation**: Maintains an up-to-date log of all features and tasks
- **Seamless Cursor IDE Integration**: Run everything directly within your IDE

### Planned Features
- **In-Cursor UI Interface**: Task queue dashboard, Linear sync panel, and quick actions bar
- **Enhanced Linear Integration**: Full API utilization including projects, cycles, labels, and more
- **AI-Enhanced Project Management**: Smarter task generation, effort estimation, and dependency detection
- **Developer Experience Improvements**: Context-aware suggestions, progress tracking, and code-to-task linking

See [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md) for a detailed roadmap of upcoming features.

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update Linear API credentials in `src/linear-api.ts` and `.env`
4. Build the extension:
   ```bash
   npm run build
   ```

## Usage

### Planning a Project Feature

Use the `plan-project` command to generate tasks for a new feature:

```
/plan-project Build user authentication module with OAuth support
```

This will:
- Generate specific, actionable tasks using AI
- Create Linear tickets for each task
- Update the `FEATURE_PLANS.md` file with the new feature and tasks

### Syncing with Linear

Use the `sync-linear` command to retrieve the latest issues from Linear:

```
/sync-linear
```

## Project Structure

- `src/extension.ts`: Core extension functionality
- `src/linear-api.ts`: Integration with Linear API
- `STACK.md`: Technology stack documentation
- `SETTINGS.md`: Configuration settings
- `FEATURE_PLANS.md`: Log of features and tasks
- `ENHANCED_FEATURES.md`: Roadmap for upcoming features

## Development

For development, you can use the watch mode:

```bash
npm run watch
```

## Contributing

Contributions are welcome! See [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md) for areas where help is needed.

## License

ISC 