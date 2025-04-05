# Linear MCP Implementation Improvements

This document outlines necessary improvements to our Linear MCP implementation to ensure proper integration with Cursor's chat interface, based on comparison with the browser-tools-mcp reference implementation.

## High Priority

1. **Resolve Tool Function Name Consistency**

   - Ensure all function names in `package.json` cursor-tools section match exactly with handler functions
   - Standardize naming convention (underscore format for chat tools, dash format for editor commands)
   - Add mapping utility function to convert between formats consistently

2. **Fix Initial MCP Handshake Protocol**

   - Update the handshake response to properly register tools with Cursor
   - Add version checking to ensure compatibility with Cursor's MCP implementation
   - Modify `sendMcpResponse` to send complete tools manifest on initial connection

3. **Improve Parameter Parsing and Validation**
   - Add structured validation for incoming parameters in chat tool mode
   - Create typed interfaces for all tool parameters
   - Add helpful error messages for invalid parameters

## Medium Priority

4. **Consolidate Tool Definitions**

   - Create a single source of truth for tool definitions
   - Generate both `cursor-tools` section and server tool registry from this source
   - Add utility to sync definitions at build time

5. **Enhance Error Handling for Chat Mode**

   - Add specific error handling for chat tool invocations
   - Format error responses to be more user-friendly in chat context
   - Add recovery suggestions for common errors

6. **Improve Tool Response Formatting**
   - Optimize all command responses for chat display
   - Add context-aware formatting based on execution mode
   - Include helpful action suggestions in responses

## Lower Priority

7. **Add WebSocket Support for Real-time Updates**

   - Implement WebSocket server for real-time Linear webhook updates
   - Add connection management for persistent clients
   - Add serialization/deserialization utilities for messages

8. **Enhance Documentation**

   - Add comprehensive usage examples for each tool
   - Create troubleshooting guide specific to chat tools
   - Document parameter requirements more thoroughly

9. **Add Type Safety Improvements**
   - Create complete TypeScript interfaces for all Linear API interactions
   - Use generics for response types
   - Add runtime type checking utilities

## Implementation Notes

- For function name consistency, modify `handleDirectToolInvocation` in `index.ts` to properly map between formats
- For handshake protocol, update `startServer` in `server.ts` to send complete tool manifest
- For parameter parsing, add validation to `handleMcpRequest` function
- Consider creating a shared `tools.ts` file to define all tools in one place
- Review browser-tools-mcp implementation for inspiration on WebSocket handling
- Use a build script to generate consistent tool definitions across files

## Reference Implementation

The [browser-tools-mcp](https://github.com/AgentDeskAI/browser-tools-mcp) project by AgentDeskAI serves as a reference implementation for Cursor MCP tools. Our implementation should follow similar patterns and architectural approaches to ensure compatibility.

## Next Steps

1. Address high-priority items to resolve chat integration issues
2. Create automated tests specifically for chat tool invocation
3. Implement medium and lower priority items as project resources allow
