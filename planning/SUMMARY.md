# Focalboard MCP Server - Boards & Blocks Tools Planning Summary

## Mission Complete ✓

This planning document provides comprehensive specifications for implementing Board and Block operation tools for the Focalboard MCP server.

## Deliverables

### 1. Type Definitions (`types.ts`)
- **Board Types**: Board, BoardPatch, BoardMember, BoardMetadata
- **Block Types**: Block, BlockPatch, BlockPatchBatch
- **Combined Types**: BoardsAndBlocks, PatchBoardsAndBlocks, DeleteBoardsAndBlocks
- **Error Types**: ErrorResponse
- **Query Types**: GetBlocksQuery, SearchQuery, DisableNotify
- All types use Zod v4 for runtime validation

### 2. Tool Specifications

#### Board Tools (11 tools) - `tools-spec-boards.ts`
1. **create_board** - POST /boards
2. **get_board** - GET /boards/{boardID}
3. **update_board** - PATCH /boards/{boardID}
4. **delete_board** - DELETE /boards/{boardID}
5. **list_boards** - GET /teams/{teamID}/boards
6. **search_boards** - GET /boards/search
7. **duplicate_board** - POST /boards/{boardID}/duplicate
8. **archive_board** - GET /boards/{boardID}/archive/export
9. **undelete_board** - POST /boards/{boardID}/undelete
10. **join_board** - POST /boards/{boardID}/join
11. **leave_board** - POST /boards/{boardID}/leave

#### Block Tools (7 tools) - `tools-spec-blocks.ts` + `tools-spec-blocks-batch.ts`
1. **create_blocks** - POST /boards/{boardID}/blocks
2. **get_blocks** - GET /boards/{boardID}/blocks
3. **update_block** - PATCH /boards/{boardID}/blocks/{blockID}
4. **delete_block** - DELETE /boards/{boardID}/blocks/{blockID}
5. **patch_blocks_batch** - PATCH /boards/{boardID}/blocks/
6. **duplicate_block** - POST /boards/{boardID}/blocks/{blockID}/duplicate
7. **undelete_block** - POST /boards/{boardID}/blocks/{blockID}/undelete

#### Combined Tools (3 tools) - `tools-spec-combined.ts`
1. **insert_boards_and_blocks** - POST /boards-and-blocks
2. **patch_boards_and_blocks** - PATCH /boards-and-blocks
3. **delete_boards_and_blocks** - DELETE /boards-and-blocks

**Total: 21 MCP Tools**

### 3. Test Cases
- **Board Tests**: `test-cases-boards.md`, `test-cases-boards-2.md`
- **Block Tests**: `test-cases-blocks.md`
- Coverage includes:
  - Success scenarios
  - Validation errors (400)
  - Not found errors (404)
  - Permission errors (403)
  - Edge cases (empty results, bulk operations)

## Key Design Decisions

### 1. Batch Operations Optimization
- Use `disable_notify` parameter for bulk operations
- Dedicated batch endpoints for efficiency
- Atomic transactions for combined operations

### 2. Error Handling Strategy
```typescript
- 400: Validation errors (missing required fields)
- 403: Access denied (permission issues)
- 404: Resource not found
- 500: Internal server errors
```

### 3. MCP Tool Registration Pattern
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    createBoardTool,
    getBoardTool,
    // ... all 21 tools
  ]
}));
```

### 4. Function Signatures
Each tool category has a TypeScript interface:
- `BoardToolFunctions` (11 methods)
- `BlockToolFunctions` (7 methods)
- `CombinedToolFunctions` (3 methods)

## Implementation Checklist

- [x] Define Zod schemas for all types
- [x] Define MCP tool specifications (name, description, inputSchema)
- [x] Define TypeScript function signatures
- [x] Document test cases for TDD approach
- [ ] Implement HTTP client for Focalboard API
- [ ] Implement tool handlers
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Add error handling and retries
- [ ] Add logging and monitoring

## API Endpoint Mapping

| Tool | HTTP Method | Endpoint |
|------|-------------|----------|
| create_board | POST | /boards |
| get_board | GET | /boards/{boardID} |
| update_board | PATCH | /boards/{boardID} |
| delete_board | DELETE | /boards/{boardID} |
| list_boards | GET | /teams/{teamID}/boards |
| search_boards | GET | /boards/search |
| duplicate_board | POST | /boards/{boardID}/duplicate |
| archive_board | GET | /boards/{boardID}/archive/export |
| undelete_board | POST | /boards/{boardID}/undelete |
| join_board | POST | /boards/{boardID}/join |
| leave_board | POST | /boards/{boardID}/leave |
| create_blocks | POST | /boards/{boardID}/blocks |
| get_blocks | GET | /boards/{boardID}/blocks |
| update_block | PATCH | /boards/{boardID}/blocks/{blockID} |
| delete_block | DELETE | /boards/{boardID}/blocks/{blockID} |
| patch_blocks_batch | PATCH | /boards/{boardID}/blocks/ |
| duplicate_block | POST | /boards/{boardID}/blocks/{blockID}/duplicate |
| undelete_block | POST | /boards/{boardID}/blocks/{blockID}/undelete |
| insert_boards_and_blocks | POST | /boards-and-blocks |
| patch_boards_and_blocks | PATCH | /boards-and-blocks |
| delete_boards_and_blocks | DELETE | /boards-and-blocks |

## Next Steps for Implementation

1. **HTTP Client Setup**
   - Configure base URL and authentication
   - Add request/response interceptors
   - Implement retry logic

2. **Tool Handler Implementation**
   - Map MCP tool calls to API requests
   - Validate inputs with Zod schemas
   - Transform responses to MCP format

3. **Testing**
   - Mock Focalboard API responses
   - Test each tool independently
   - Test error scenarios
   - Integration tests with real API

4. **Documentation**
   - API usage examples
   - Error handling guide
   - Performance considerations

## Files Created

```
planning/
├── PLANNING.md                    # Overview and architecture
├── types.ts                       # Zod schemas and TypeScript types
├── tools-spec-boards.ts          # Board operation tools (11)
├── tools-spec-blocks.ts          # Block CRUD tools (4)
├── tools-spec-blocks-batch.ts    # Block batch tools (3)
├── tools-spec-combined.ts        # Combined operation tools (3)
├── test-cases-boards.md          # Board test cases
├── test-cases-boards-2.md        # More board test cases
├── test-cases-blocks.md          # Block test cases
└── SUMMARY.md                    # This file
```

## Notes

- All tools follow MCP SDK patterns
- JSON Schema used for inputSchema (MCP requirement)
- Zod used for runtime validation (type safety)
- Test-driven development approach
- Comprehensive error handling
- Batch operations for performance
- Atomic transactions for data consistency
