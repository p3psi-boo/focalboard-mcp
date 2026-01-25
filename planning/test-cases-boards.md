# Test Cases - Board Operations

## Test Suite: create_board

### TC-B001: Create basic board
**Given:** Valid teamId and title
**When:** create_board is called
**Then:** 
- Returns Board object with generated ID
- Board has correct teamId and title
- HTTP 200 response

### TC-B002: Create board with all optional fields
**Given:** All board properties provided
**When:** create_board is called
**Then:**
- Returns Board with all properties set
- Icon, description, type are persisted

### TC-B003: Create board without teamId
**Given:** Missing teamId
**When:** create_board is called
**Then:**
- Returns validation error
- HTTP 400 response

### TC-B004: Create board with invalid teamId
**Given:** Non-existent teamId
**When:** create_board is called
**Then:**
- Returns error "team not found"
- HTTP 404 response

---

## Test Suite: get_board

### TC-B005: Get existing board
**Given:** Valid boardId
**When:** get_board is called
**Then:**
- Returns complete Board object
- HTTP 200 response

### TC-B006: Get non-existent board
**Given:** Invalid boardId
**When:** get_board is called
**Then:**
- Returns error "board not found"
- HTTP 404 response

### TC-B007: Get board without permission
**Given:** boardId user doesn't have access to
**When:** get_board is called
**Then:**
- Returns error "access denied"
- HTTP 403 response

---

## Test Suite: update_board

### TC-B008: Update board title
**Given:** Valid boardId and new title
**When:** update_board is called
**Then:**
- Returns updated Board
- Only title is changed
- HTTP 200 response

### TC-B009: Update multiple fields
**Given:** boardId with title, description, icon
**When:** update_board is called
**Then:**
- All provided fields are updated
- Other fields remain unchanged

### TC-B010: Update non-existent board
**Given:** Invalid boardId
**When:** update_board is called
**Then:**
- Returns error "board not found"
- HTTP 404 response

---

## Test Suite: delete_board

### TC-B011: Delete existing board
**Given:** Valid boardId
**When:** delete_board is called
**Then:**
- Board is soft-deleted (deleteAt timestamp set)
- HTTP 200 response

### TC-B012: Delete non-existent board
**Given:** Invalid boardId
**When:** delete_board is called
**Then:**
- Returns error "board not found"
- HTTP 404 response

### TC-B013: Delete board without permission
**Given:** boardId user doesn't own
**When:** delete_board is called
**Then:**
- Returns error "access denied"
- HTTP 403 response
