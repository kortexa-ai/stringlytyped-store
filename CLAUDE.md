# CLAUDE.md - Stringly Typed Store Guidelines

## Commands
- Build/Run: `yarn start` or `npm start` (runs `node server.js`)
- Install dependencies: `yarn` or `npm install`

## Project Structure
- Express.js server with file-based storage
- MCP (Model Context Protocol) implementation
- Resources stored as JSON files in `./data/` directory

## Code Style
- **Language**: JavaScript (ES Modules)
- **Formatting**: 4-space indentation, semicolons required
- **Naming**: camelCase for variables/functions, descriptive names
- **Error Handling**: Use try/catch blocks for file operations and API endpoints
- **Imports**: Group imports by type (standard lib, external packages, local)
- **File Structure**: Core server in `server.js`, MCP implementation in `mcp.js`
- **Exports**: Use named exports for utility functions
- **Types**: Using Zod for validation, JSDoc comments preferred for types

## Key Patterns
- SLOP (Simple Lump of Plaintext) pattern for storage
- RESTful API endpoints for resource management
- Async/await for asynchronous operations
- SSE (Server-Sent Events) for MCP communication