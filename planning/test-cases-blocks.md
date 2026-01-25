# Test Cases - Block Operations

## Test Suite: create_blocks

### TC-BL001: Create single block
**Given:** Valid boardId and block data
**When:** create_blocks is called
**Then:**
- Returns array with one Block
- Block has server-generated ID
- HTTP 200 response

### TC-BL002: Create multiple blocks
**Given:** boardId and array of 5 blocks
**When:** create_blocks is called
**Then:**
- Returns array of 5 Blocks
- All have unique IDs
- Maintains order

### TC-BL003: Create blocks with disableNotify
**Given:** blocks array and disableNotify=true
**When:** create_blocks is called
**Then:**
- Blocks created successfully
- No notifications sent

### TC-BL004: Create block without type
**Given:** Block missing required 'type' field
**When:** create_blocks is called
**Then:**
- Returns validation error
- HTTP 400 response

---

## Test Suite: get_blocks

### TC-BL005: Get all blocks for board
**Given:** Valid boardId
**When:** get_blocks is called
**Then:**
- Returns all blocks in board
- HTTP 200 response

### TC-BL006: Get blocks filtered by parentId
**Given:** boardId and parentId
**When:** get_blocks is called
**Then:**
- Returns only child blocks
- All have matching parentId

### TC-BL007: Get blocks filtered by type
**Given:** boardId and type='card'
**When:** get_blocks is called
**Then:**
- Returns only blocks of type 'card'
- Other types excluded

---

## Test Suite: update_block

### TC-BL008: Update block title
**Given:** Valid blockId and new title
**When:** update_block is called
**Then:**
- Block title updated
- Other fields unchanged
- HTTP 200 response

### TC-BL009: Update block fields
**Given:** blockId and fields object
**When:** update_block is called
**Then:**
- Fields merged with existing
- HTTP 200 response

### TC-BL010: Update non-existent block
**Given:** Invalid blockId
**When:** update_block is called
**Then:**
- Returns error "block not found"
- HTTP 404 response
