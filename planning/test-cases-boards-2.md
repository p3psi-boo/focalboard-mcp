# Test Cases - Board Operations (Part 2)

## Test Suite: list_boards

### TC-B014: List boards for team
**Given:** Valid teamId with boards
**When:** list_boards is called
**Then:**
- Returns array of Board objects
- All boards belong to teamId
- HTTP 200 response

### TC-B015: List boards for empty team
**Given:** Valid teamId with no boards
**When:** list_boards is called
**Then:**
- Returns empty array
- HTTP 200 response

### TC-B016: List boards for invalid team
**Given:** Non-existent teamId
**When:** list_boards is called
**Then:**
- Returns error or empty array
- HTTP 404 or 200 response

---

## Test Suite: search_boards

### TC-B017: Search with matching results
**Given:** Query matching board titles
**When:** search_boards is called
**Then:**
- Returns array of matching boards
- Results contain query term

### TC-B018: Search with no results
**Given:** Query with no matches
**When:** search_boards is called
**Then:**
- Returns empty array
- HTTP 200 response

### TC-B019: Search with empty query
**Given:** Empty string query
**When:** search_boards is called
**Then:**
- Returns validation error
- HTTP 400 response

---

## Test Suite: duplicate_board

### TC-B020: Duplicate board successfully
**Given:** Valid boardId
**When:** duplicate_board is called
**Then:**
- Returns BoardsAndBlocks with new board
- New board has different ID
- All blocks are duplicated

### TC-B021: Duplicate non-existent board
**Given:** Invalid boardId
**When:** duplicate_board is called
**Then:**
- Returns error "board not found"
- HTTP 404 response
