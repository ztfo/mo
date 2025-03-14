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
  `${colors.bright}${colors.cyan}Building Mo Plugin...${colors.reset}`
);

// Ensure dist directory exists
const distDir = path.join(__dirname, "../dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`${colors.green}Created dist directory${colors.reset}`);
}

// Run TypeScript compilation
console.log(`${colors.yellow}Running TypeScript compilation...${colors.reset}`);
exec("npx tsc -p tsconfig.json", (error, stdout, stderr) => {
  if (error) {
    console.error(`${colors.red}TypeScript compilation failed:${colors.reset}`);
    console.error(stderr || error.message);

    // Fall back to simplified build if TypeScript compilation fails
    console.log(
      `${colors.yellow}Falling back to simplified build...${colors.reset}`
    );
    require("./build-simple.js");
    return;
  }

  console.log(
    `${colors.green}TypeScript compilation successful!${colors.reset}`
  );

  // Copy any static assets if needed
  // ...

  console.log(
    `${colors.bright}${colors.green}Build completed successfully!${colors.reset}`
  );
});
