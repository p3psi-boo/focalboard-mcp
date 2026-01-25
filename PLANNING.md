# Focalboard MCP Server - Boards & Blocks Tools Planning

## Overview
This document contains the complete planning for Board and Block operation tools for the Focalboard MCP server.

## Architecture Decisions

### 1. Type System
- Use Zod for runtime validation and type inference
- Generate TypeScript types from Zod schemas
- Align with Swagger definitions from `swagger.yml`

### 2. Error Handling Strategy
- HTTP 404: Resource not found
- HTTP 403: Access denied
- HTTP 401: Authentication required
- HTTP 500: Internal server error
- Network errors: Connection failures, timeouts

### 3. Batch Operations
- Optimize for bulk operations where API supports it
- Use `disable_notify` parameter for bulk inserts/updates
- Implement transaction-like semantics for boards-and-blocks operations

### 4. Testing Strategy
- Unit tests for each tool
- Integration tests for API calls
- Mock Focalboard API responses
- Test error scenarios comprehensively

## Tool Categories

### Category 1: Board Operations (11 tools)
- CRUD operations
- Search and list
- Duplicate and archive
- Membership (join/leave)
- Undelete

### Category 2: Block Operations (7 tools)
- CRUD operations
- Batch operations
- Duplicate and undelete

### Category 3: Combined Operations (3 tools)
- Atomic board+block operations
- Transactional semantics

## Next Steps
1. Define type schemas (types.ts)
2. Define tool specifications (tools-spec.ts)
3. Define test cases (test-cases.ts)
4. Implementation guide (implementation.md)
