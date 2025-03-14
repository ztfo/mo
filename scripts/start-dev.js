const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

console.log(
  `${colors.bright}${colors.cyan}Starting Mo Plugin development environment${colors.reset}`
);

// Ensure dist directory exists
const distDir = path.join(__dirname, "../dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`${colors.green}Created dist directory${colors.reset}`);
}

// Attempt to build with TypeScript first
console.log(
  `${colors.yellow}Attempting to build with TypeScript...${colors.reset}`
);
exec("npx tsc -p tsconfig.json", (error, stdout, stderr) => {
  if (error) {
    console.error(`${colors.red}TypeScript compilation failed:${colors.reset}`);
    console.error(stderr || error.message);

    // Fall back to simplified build
    console.log(
      `${colors.yellow}Falling back to simplified build...${colors.reset}`
    );
    try {
      require("./build-simple.js");
      console.log(`${colors.green}Simplified build completed.${colors.reset}`);
    } catch (buildError) {
      console.error(
        `${colors.red}Error during simplified build: ${buildError.message}${colors.reset}`
      );
      process.exit(1);
    }
  } else {
    console.log(
      `${colors.green}TypeScript compilation successful!${colors.reset}`
    );
  }

  // Continue with setup...
  setupDevelopmentEnvironment();
});

function setupDevelopmentEnvironment() {
  // Check if Linear API key is set
  const envPath = path.join(__dirname, "../.env");
  let linearApiKey = process.env.LINEAR_API_KEY;
  let linearTeamId = process.env.LINEAR_TEAM_ID;

  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, "utf8");
      const apiKeyMatch = envContent.match(/LINEAR_API_KEY=(.+)/);
      const teamIdMatch = envContent.match(/LINEAR_TEAM_ID=(.+)/);

      if (apiKeyMatch && apiKeyMatch[1]) {
        linearApiKey = apiKeyMatch[1];
      }

      if (teamIdMatch && teamIdMatch[1]) {
        linearTeamId = teamIdMatch[1];
      }
    } catch (error) {
      console.log(
        `${colors.yellow}Could not read .env file: ${error.message}${colors.reset}`
      );
    }
  }

  // Print development instructions
  console.log(`
${colors.bright}${colors.cyan}Mo Plugin Development Guide${colors.reset}

${colors.bright}Current Status:${colors.reset}
- TypeScript compilation ${
    fs.existsSync(path.join(distDir, "extension.js"))
      ? `${colors.green}Successful${colors.reset}`
      : `${colors.red}Failed${colors.reset}`
  }
- Linear API Key: ${
    linearApiKey
      ? `${colors.green}Set${colors.reset}`
      : `${colors.red}Not set${colors.reset}`
  }
- Linear Team ID: ${
    linearTeamId
      ? `${colors.green}Set${colors.reset}`
      : `${colors.red}Not set${colors.reset}`
  }

${colors.bright}To test the extension in Cursor:${colors.reset}
1. Open Cursor
2. Open the Command Palette (Cmd+Shift+P or Ctrl+Shift+P)
3. Type "Developer: Install Extension from Location..."
4. Select this project directory

${colors.bright}Available commands:${colors.reset}
- Mo: Show Task Queue
- Mo: Plan Project
- Mo: Show Linear Sync
- Mo: Show Settings
- Mo: Push Tasks to Linear
- Mo: Show Export Dialog
- Mo: Sync with Linear

${colors.bright}Development workflow:${colors.reset}
1. Make changes to the source code
2. Run 'npm run build' to rebuild
3. Reload the window in Cursor (Developer: Reload Window)
4. Test your changes
`);

  // Optional: Watch for changes
  if (process.argv.includes("--watch")) {
    console.log(
      `${colors.bright}${colors.cyan}Watching for changes...${colors.reset}`
    );

    // Check if nodemon is installed
    try {
      require.resolve("nodemon");
      // Simple file watcher
      exec(
        'npx nodemon --watch src --ext ts,js --exec "npm run build"',
        (error, stdout, stderr) => {
          if (error) {
            console.error(
              `${colors.red}Error watching files: ${error.message}${colors.reset}`
            );
            return;
          }
          console.log(stdout);
        }
      );
    } catch (error) {
      console.error(
        `${colors.red}Nodemon not found. Install it with:${colors.reset}`
      );
      console.error(
        `${colors.bright}npm install --save-dev nodemon${colors.reset}`
      );
      console.error(
        `${colors.yellow}Continuing without file watching...${colors.reset}`
      );
    }
  }
}
