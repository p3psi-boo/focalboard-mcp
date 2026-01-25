# Focalboard MCP Server - Files, Auth & System Tools Planning

## Overview
Complete planning for File Operations, Authentication, and System tools for the Focalboard MCP server.

## Architecture Decisions

### 1. Type System
- Use Zod for runtime validation and type inference
- Generate TypeScript types from Zod schemas
- Align with Swagger definitions from `swagger.yml`
- Base64 encoding/decoding for file content

### 2. Error Handling Strategy
- HTTP 404: Resource not found (files, endpoints)
- HTTP 403: Access denied
- HTTP 401: Authentication required/invalid credentials
- HTTP 500: Internal server error
- Network errors: Connection failures, timeouts
- File-specific: Invalid base64, file size limits, unsupported formats

### 3. Authentication Flow
- **FOCALBOARD_TOKEN**: Environment variable for pre-authenticated sessions
  - Used for all authenticated API calls
  - Set via `.env` file or environment
  - Bypasses login flow when present
  
- **login tool**: Dynamic authentication
  - Returns token in response
  - Token stored in MCP session state
  - Used when FOCALBOARD_TOKEN not set
  
- **Priority**: FOCALBOARD_TOKEN > login token > unauthenticated

### 4. File Handling Strategy
- Accept files as base64 strings in MCP tools
- Decode base64 → binary for API upload (multipart/form-data)
- Encode binary → base64 for API download responses
- Validate base64 format before processing
- Handle MIME types: image/jpg, image/png, image/gif, application/json

### 5. Testing Strategy
- Unit tests for each tool
- Integration tests for API calls
- Mock Focalboard API responses
- Test error scenarios comprehensively
- Test base64 encoding/decoding edge cases
- Test authentication flows (token vs login)

---

## Tool Categories

### Category 1: File Operations (2 tools)
- Upload file (base64 → multipart/form-data)
- Download file (binary → base64)

### Category 2: Authentication (3 tools)
- Login (username/password → token)
- Logout (invalidate session)
- Register (create new user)

### Category 3: System Information (5 tools)
- Client configuration
- Server statistics
- Cloud limits
- Health checks (ping, hello)

---

## PART 1: FILE OPERATIONS TOOLS

### Tool 1: upload_file

**Purpose**: Upload a file to a board (images, attachments)

**MCP Tool Definition**:
```typescript
{
  name: "upload_file",
  description: "Upload a file to a Focalboard board. Accepts base64-encoded file content. Returns file metadata including URL.",
  inputSchema: {
    type: "object",
    properties: {
      teamID: {
        type: "string",
        description: "Team ID where the board belongs"
      },
      boardID: {
        type: "string",
        description: "Board ID to attach the file to"
      },
      filename: {
        type: "string",
        description: "Name of the file including extension (e.g., 'image.png')"
      },
      content: {
        type: "string",
        description: "Base64-encoded file content"
      }
    },
    required: ["teamID", "boardID", "filename", "content"]
  }
}
```

**Function Signature**:
```typescript
async function uploadFile(params: {
  teamID: string;
  boardID: string;
  filename: string;
  content: string; // base64
}): Promise<FileUploadResponse>
```

**Request/Response Types**:
```typescript
// Input validation schema
const UploadFileInputSchema = z.object({
  teamID: z.string().min(1),
  boardID: z.string().min(1),
  filename: z.string().min(1),
  content: z.string().min(1) // base64 string
});

// Response from API (swagger.yml line 71-73)
const FileUploadResponseSchema = z.object({
  fileId: z.string().optional(),
  filename: z.string()
});

type UploadFileInput = z.infer<typeof UploadFileInputSchema>;
type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;
```

**API Mapping**:
- **Endpoint**: `POST /api/v2/teams/{teamID}/boards/{boardID}/files`
- **Content-Type**: `multipart/form-data`
- **Auth**: Bearer token required
- **Form field**: `uploaded file` (binary data)

**Implementation Logic**:
1. Validate input schema
2. Decode base64 content to binary Buffer
3. Validate base64 format (catch decode errors)
4. Create FormData with file
5. Set filename and content-type
6. POST to API endpoint with Bearer token
7. Parse response JSON
8. Return FileUploadResponse

**Base64 Strategy**:
```typescript
// Decode base64 to Buffer
const buffer = Buffer.from(content, 'base64');

// Create FormData
const formData = new FormData();
formData.append('uploaded file', new Blob([buffer]), filename);
```

**Error Scenarios**:
1. Invalid base64 format → 400 Bad Request
2. Board not found → 404 Not Found
3. Unauthorized → 401 Unauthorized
4. File too large → 413 Payload Too Large
5. Network error → Connection failed

**Test Cases**:
```typescript
describe('upload_file', () => {
  test('uploads PNG image successfully', async () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await uploadFile({
      teamID: 'team-123',
      boardID: 'board-456',
      filename: 'test.png',
      content: base64
    });
    expect(result.filename).toBe('test.png');
  });

  test('rejects invalid base64', async () => {
    await expect(uploadFile({
      teamID: 'team-123',
      boardID: 'board-456',
      filename: 'test.png',
      content: 'not-valid-base64!!!'
    })).rejects.toThrow('Invalid base64');
  });

  test('handles 404 board not found', async () => {
    await expect(uploadFile({
      teamID: 'team-123',
      boardID: 'nonexistent',
      filename: 'test.png',
      content: validBase64
    })).rejects.toThrow('Board not found');
  });

  test('handles unauthorized', async () => {
    // Mock no token
    await expect(uploadFile({
      teamID: 'team-123',
      boardID: 'board-456',
      filename: 'test.png',
      content: validBase64
    })).rejects.toThrow('Unauthorized');
  });
});
```

---

### Tool 2: get_file

**Purpose**: Download a file from a board and return as base64

**MCP Tool Definition**:
```typescript
{
  name: "get_file",
  description: "Download a file from a Focalboard board. Returns base64-encoded file content.",
  inputSchema: {
    type: "object",
    properties: {
      teamID: {
        type: "string",
        description: "Team ID where the board belongs"
      },
      boardID: {
        type: "string",
        description: "Board ID containing the file"
      },
      filename: {
        type: "string",
        description: "Name of the file to download"
      }
    },
    required: ["teamID", "boardID", "filename"]
  }
}
```

**Function Signature**:
```typescript
async function getFile(params: {
  teamID: string;
  boardID: string;
  filename: string;
}): Promise<FileDownloadResponse>
```

**Request/Response Types**:
```typescript
// Input validation schema
const GetFileInputSchema = z.object({
  teamID: z.string().min(1),
  boardID: z.string().min(1),
  filename: z.string().min(1)
});

// Response (custom)
const FileDownloadResponseSchema = z.object({
  filename: z.string(),
  content: z.string(), // base64
  contentType: z.string().optional(),
  size: z.number().optional()
});

type GetFileInput = z.infer<typeof GetFileInputSchema>;
type FileDownloadResponse = z.infer<typeof FileDownloadResponseSchema>;
```

**API Mapping**:
- **Endpoint**: `GET /api/v2/files/teams/{teamID}/{boardID}/{filename}`
- **Content-Type**: Binary (image/jpg, image/png, image/gif, application/json)
- **Auth**: Bearer token required
- **Response**: Binary file data

**Implementation Logic**:
1. Validate input schema
2. GET from API endpoint with Bearer token
3. Read response as binary Buffer
4. Encode Buffer to base64
5. Extract content-type from headers
6. Return FileDownloadResponse with base64 content

**Base64 Strategy**:
```typescript
// Fetch binary data
const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
const buffer = await response.arrayBuffer();

// Encode to base64
const base64 = Buffer.from(buffer).toString('base64');

return {
  filename,
  content: base64,
  contentType: response.headers.get('content-type'),
  size: buffer.byteLength
};
```

**Error Scenarios**:
1. File not found → 404 Not Found
2. Board not found → 404 Not Found
3. Unauthorized → 401 Unauthorized
4. Network error → Connection failed

**Test Cases**:
```typescript
describe('get_file', () => {
  test('downloads PNG image successfully', async () => {
    const result = await getFile({
      teamID: 'team-123',
      boardID: 'board-456',
      filename: 'test.png'
    });
    expect(result.filename).toBe('test.png');
    expect(result.contentType).toBe('image/png');
    expect(result.content).toMatch(/^[A-Za-z0-9+/=]+$/); // valid base64
  });

  test('handles 404 file not found', async () => {
    await expect(getFile({
      teamID: 'team-123',
      boardID: 'board-456',
      filename: 'nonexistent.png'
    })).rejects.toThrow('File not found');
  });

  test('handles unauthorized', async () => {
    await expect(getFile({
      teamID: 'team-123',
      boardID: 'board-456',
      filename: 'test.png'
    })).rejects.toThrow('Unauthorized');
  });

  test('round-trip upload and download', async () => {
    const originalBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const uploadResult = await uploadFile({
      teamID: 'team-123',
      boardID: 'board-456',
      filename: 'roundtrip.png',
      content: originalBase64
    });
    
    const downloadResult = await getFile({
      teamID: 'team-123',
      boardID: 'board-456',
      filename: uploadResult.filename
    });
    
    expect(downloadResult.content).toBe(originalBase64);
  });
});
```

---

## PART 2: AUTHENTICATION TOOLS

### Authentication Flow Documentation

**Two Authentication Modes**:

1. **Environment Token (FOCALBOARD_TOKEN)**:
   - Set via `.env` file: `FOCALBOARD_TOKEN=your-token-here`
   - Used automatically for all API calls
   - No login required
   - Recommended for server/automation use

2. **Dynamic Login (login tool)**:
   - User provides username/password
   - Returns session token
   - Token stored in MCP session state
   - Used when FOCALBOARD_TOKEN not set
   - Recommended for interactive use

**Token Priority**:
```typescript
function getAuthToken(): string | null {
  // 1. Check environment variable
  if (process.env.FOCALBOARD_TOKEN) {
    return process.env.FOCALBOARD_TOKEN;
  }
  
  // 2. Check session state (from login)
  if (sessionState.token) {
    return sessionState.token;
  }
  
  // 3. No token available
  return null;
}
```

---

### Tool 3: login

**Purpose**: Authenticate user and obtain session token

**MCP Tool Definition**:
```typescript
{
  name: "login",
  description: "Login to Focalboard with username/password. Returns session token. Not needed if FOCALBOARD_TOKEN environment variable is set.",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "Username or email"
      },
      password: {
        type: "string",
        description: "User password"
      },
      mfa_token: {
        type: "string",
        description: "Multi-factor authentication token (optional)"
      }
    },
    required: ["username", "password"]
  }
}
```

**Function Signature**:
```typescript
async function login(params: {
  username: string;
  password: string;
  mfa_token?: string;
}): Promise<LoginResponse>
```

**Request/Response Types**:
```typescript
// Input validation schema (swagger.yml line 74-76)
const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  mfa_token: z.string().optional()
});

// Response (swagger.yml line 77-79)
const LoginResponseSchema = z.object({
  token: z.string()
});

type LoginRequest = z.infer<typeof LoginRequestSchema>;
type LoginResponse = z.infer<typeof LoginResponseSchema>;
```

**API Mapping**:
- **Endpoint**: `POST /api/v2/login`
- **Content-Type**: `application/json`
- **Auth**: None (public endpoint)
- **Body**: `{ username, password, mfa_token? }`

**Implementation Logic**:
1. Validate input schema
2. POST to `/api/v2/login` with credentials
3. Handle 401 (invalid credentials)
4. Parse response JSON
5. Store token in session state
6. Return LoginResponse

**Error Scenarios**:
1. Invalid credentials → 401 Unauthorized
2. MFA required but not provided → 401 Unauthorized
3. Account locked → 403 Forbidden
4. Server error → 500 Internal Server Error
5. Network error → Connection failed

**Test Cases**:
```typescript
describe('login', () => {
  test('successful login with valid credentials', async () => {
    const result = await login({
      username: 'testuser',
      password: 'testpass123'
    });
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  test('rejects invalid credentials', async () => {
    await expect(login({
      username: 'testuser',
      password: 'wrongpassword'
    })).rejects.toThrow('Invalid login');
  });

  test('handles MFA token', async () => {
    const result = await login({
      username: 'testuser',
      password: 'testpass123',
      mfa_token: '123456'
    });
    expect(result.token).toBeDefined();
  });

  test('stores token in session state', async () => {
    const result = await login({
      username: 'testuser',
      password: 'testpass123'
    });
    expect(sessionState.token).toBe(result.token);
  });

  test('skips login if FOCALBOARD_TOKEN set', async () => {
    process.env.FOCALBOARD_TOKEN = 'env-token';
    const token = getAuthToken();
    expect(token).toBe('env-token');
  });
});
```

---

### Tool 4: logout

**Purpose**: Invalidate current session token

**MCP Tool Definition**:
```typescript
{
  name: "logout",
  description: "Logout from Focalboard and invalidate session token. Requires active session.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

**Function Signature**:
```typescript
async function logout(): Promise<void>
```

**Request/Response Types**:
```typescript
// No input parameters
// No response body (void)
```

**API Mapping**:
- **Endpoint**: `POST /api/v2/logout`
- **Content-Type**: `application/json`
- **Auth**: Bearer token required
- **Body**: Empty

**Implementation Logic**:
1. Check if token exists (session or env)
2. POST to `/api/v2/logout` with Bearer token
3. Clear session state token
4. Return void

**Error Scenarios**:
1. No active session → 401 Unauthorized
2. Token already invalid → 401 Unauthorized
3. Server error → 500 Internal Server Error
4. Network error → Connection failed

**Test Cases**:
```typescript
describe('logout', () => {
  test('successful logout', async () => {
    // Login first
    await login({ username: 'testuser', password: 'testpass123' });
    
    // Logout
    await logout();
    
    // Token should be cleared
    expect(sessionState.token).toBeNull();
  });

  test('handles logout without active session', async () => {
    sessionState.token = null;
    await expect(logout()).rejects.toThrow('No active session');
  });

  test('does not clear FOCALBOARD_TOKEN', async () => {
    process.env.FOCALBOARD_TOKEN = 'env-token';
    await logout();
    expect(process.env.FOCALBOARD_TOKEN).toBe('env-token');
  });
});
```

---

### Tool 5: register

**Purpose**: Register a new user account

**MCP Tool Definition**:
```typescript
{
  name: "register",
  description: "Register a new Focalboard user account. May require registration token depending on server configuration.",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "Desired username"
      },
      email: {
        type: "string",
        description: "User email address"
      },
      password: {
        type: "string",
        description: "User password"
      },
      token: {
        type: "string",
        description: "Registration token (if required by server)"
      }
    },
    required: ["username", "email", "password"]
  }
}
```

**Function Signature**:
```typescript
async function register(params: {
  username: string;
  email: string;
  password: string;
  token?: string;
}): Promise<void>
```

**Request/Response Types**:
```typescript
// Input validation schema (swagger.yml line 90-92)
const RegisterRequestSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  token: z.string().optional()
});

type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
```

**API Mapping**:
- **Endpoint**: `POST /api/v2/register`
- **Content-Type**: `application/json`
- **Auth**: None (public endpoint)
- **Body**: `{ username, email, password, token? }`

**Implementation Logic**:
1. Validate input schema (email format, password length)
2. POST to `/api/v2/register` with user data
3. Handle 401 (invalid registration token)
4. Return void on success

**Error Scenarios**:
1. Invalid registration token → 401 Unauthorized
2. Username already exists → 409 Conflict
3. Email already exists → 409 Conflict
4. Weak password → 400 Bad Request
5. Server error → 500 Internal Server Error
6. Network error → Connection failed

**Test Cases**:
```typescript
describe('register', () => {
  test('successful registration', async () => {
    await register({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'securepass123'
    });
    // Should not throw
  });

  test('rejects invalid email', async () => {
    await expect(register({
      username: 'newuser',
      email: 'invalid-email',
      password: 'securepass123'
    })).rejects.toThrow('Invalid email');
  });

  test('rejects weak password', async () => {
    await expect(register({
      username: 'newuser',
      email: 'newuser@example.com',
      password: '123'
    })).rejects.toThrow('Password too short');
  });

  test('handles duplicate username', async () => {
    await expect(register({
      username: 'existinguser',
      email: 'new@example.com',
      password: 'securepass123'
    })).rejects.toThrow('Username already exists');
  });

  test('requires registration token when configured', async () => {
    await expect(register({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'securepass123'
    })).rejects.toThrow('Registration token required');
  });

  test('accepts valid registration token', async () => {
    await register({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'securepass123',
      token: 'valid-reg-token'
    });
    // Should not throw
  });
});
```


---

## PART 3: SYSTEM INFORMATION TOOLS

### Tool 6: get_client_config

**Purpose**: Retrieve client configuration settings

**MCP Tool Definition**:
```typescript
{
  name: "get_client_config",
  description: "Get Focalboard client configuration including feature flags, telemetry settings, and server capabilities.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

**Function Signature**:
```typescript
async function getClientConfig(): Promise<ClientConfig>
```

**Request/Response Types**:
```typescript
// Response (swagger.yml line 60-62)
const ClientConfigSchema = z.object({
  telemetry: z.boolean().optional(),
  telemetryid: z.string().optional(),
  enablePublicSharedBoards: z.boolean().optional(),
  featureFlags: z.record(z.boolean()).optional(),
  maxFileSize: z.number().optional()
});

type ClientConfig = z.infer<typeof ClientConfigSchema>;
```

**API Mapping**:
- **Endpoint**: `GET /api/v2/clientConfig`
- **Content-Type**: `application/json`
- **Auth**: None (public endpoint)
- **Response**: ClientConfig object

**Implementation Logic**:
1. GET from `/api/v2/clientConfig`
2. Parse response JSON
3. Validate against schema
4. Return ClientConfig

**Error Scenarios**:
1. Server error → 500 Internal Server Error
2. Network error → Connection failed

**Test Cases**:
```typescript
describe('get_client_config', () => {
  test('retrieves client config successfully', async () => {
    const result = await getClientConfig();
    expect(result).toBeDefined();
    expect(typeof result.telemetry).toBe('boolean');
  });

  test('handles server error gracefully', async () => {
    // Mock server error
    await expect(getClientConfig()).rejects.toThrow('Internal error');
  });

  test('returns feature flags', async () => {
    const result = await getClientConfig();
    expect(result.featureFlags).toBeDefined();
  });
});
```

---

### Tool 7: get_statistics

**Purpose**: Retrieve server statistics (boards, cards, users)

**MCP Tool Definition**:
```typescript
{
  name: "get_statistics",
  description: "Get Focalboard server statistics including board count, card count, and active users. Requires authentication.",
  inputSchema: {
    type: "object",
    properties: ,
    required: []
  }
}
```

**Function Signature**:
```typescript
async function getStatistics(): Promise<BoardsStatistics>
```

**Request/Response Types**:
```typescript
// Response (swagger.yml line 43-44)
const BoardsStatisticsSchema = z.object({
  board_count: z.number().optional(),
  card_count: z.number().optional(),
  active_users: z.number().optional(),
  last_activity: z.string().optional() // ISO date
});

type BoardsStatistics = z.infer<typeof BoardsStatisticsSchema>;
```

**API Mapping**:
- **Endpoint**: `GET /api/v2/statistics`
- **Content-Type**: `application/json`
- **Auth**: Bearer token required
- **Response**: BoardsStatistics object

**Implementation Logic**:
1. Check auth token exists
2. GET from `/api/v2/statistics` with Bearer token
3. Parse response JSON
4. Validate against schema
5. Return BoardsStatistics

**Error Scenarios**:
1. Unauthorized → 401 Unauthorized
2. Server error → 500 Internal Server Error
3. Network error → Connection failed

**Test Cases**:
```typescript
describe('get_statistics', () => {
  test('retrieves statistics successfully', async () => {
    const result = await getStatistics();
    expect(result.board_count).toBeGreaterThanOrEqual(0);
    expect(result.card_count).toBeGreaterThanOrEqual(0);
  });

  test('requires authentication', async () => {
    sessionState.token = null;
    await expect(getStatistics()).rejects.toThrow('Unauthorized');
  });

  test('returns valid date format', async () => {
    const result = await getStatistics();
    if (result.last_activity) {
      expect(() => new Date(result.last_activity)).not.toThrow();
    }
  });
});
```

---

### Tool 8: get_cloud_limits

**Purpose**: Retrieve cloud plan limits and usage

**MCP Tool Definition**:
```typescript
{
  name: "get_cloud_limits",
  description: "Get Focalboard cloud limits including board limits, card limits, and storage quotas. Requires authentication.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

**Function Signature**:
```typescript
async function getCloudLimits(): Promise<BoardsCloudLimits>
```

**Request/Response Types**:
```typescript
// Response (swagger.yml line 37-41)
const BoardsCloudLimitsSchema = z.object({
  used_cards: z.number().optional(),
  card_limit_timestamp: z.number().optional(),
  cards_limit: z.number().optional(),
  views: z.number().optional()
});

type BoardsCloudLimits = z.infer<typeof BoardsCloudLimitsSchema>;
```

**API Mapping**:
- **Endpoint**: `GET /api/v2/limits`
- **Content-Type**: `application/json`
- **Auth**: Bearer token required
- **Response**: BoardsCloudLimits object

**Implementation Logic**:
1. Check auth token exists
2. GET from `/api/v2/limits` with Bearer token
3. Parse response JSON
4. Validate against schema
5. Return BoardsCloudLimits

**Error Scenarios**:
1. Unauthorized → 401 Unauthorized
2. Server error → 500 Internal Server Error
3. Network error → Connection failed

**Test Cases**:
```typescript
describe('get_cloud_limits', () => {
  test('retrieves cloud limits successfully', async () => {
    const result = await getCloudLimits();
    expect(result).toBeDefined();
    expect(typeof result.used_cards).toBe('number');
  });

  test('requires authentication', async () => {
    sessionState.token = null;
    await expect(getCloudLimits()).rejects.toThrow('Unauthorized');
  });

  test('calculates remaining cards', async () => {
    const result = await getCloudLimits();
    if (result.cards_limit && result.used_cards) {
      const remaining = result.cards_limit - result.used_cards;
      expect(remaining).toBeGreaterThanOrEqual(0);
    }
  });
});
```


---

### Tool 9: ping

**Purpose**: Health check with server metadata

**MCP Tool Definition**:
```typescript
{
  name: "ping",
  description: "Ping Focalboard server to check health and get server metadata (version, build info).",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

**Function Signature**:
```typescript
async function ping(): Promise<PingResponse>
```

**Request/Response Types**:
```typescript
// Response (custom - not in swagger)
const PingResponseSchema = z.object({
  status: z.string(),
  version: z.string().optional(),
  build: z.string().optional(),
  timestamp: z.number().optional()
});

type PingResponse = z.infer<typeof PingResponseSchema>;
```

**API Mapping**:
- **Endpoint**: `GET /api/v2/ping`
- **Content-Type**: `application/json`
- **Auth**: None (public endpoint)
- **Response**: Server metadata

**Implementation Logic**:
1. GET from `/api/v2/ping`
2. Parse response JSON
3. Return PingResponse

**Error Scenarios**:
1. Server unreachable → Connection failed
2. Timeout → Request timeout

**Test Cases**:
```typescript
describe('ping', () => {
  test('pings server successfully', async () => {
    const result = await ping();
    expect(result.status).toBe('ok');
  });

  test('returns version info', async () => {
    const result = await ping();
    expect(result.version).toBeDefined();
  });

  test('handles server timeout', async () => {
    await expect(ping()).rejects.toThrow('Timeout');
  });
});
```

---

### Tool 10: hello

**Purpose**: Simple health check

**MCP Tool Definition**:
```typescript
{
  name: "hello",
  description: "Simple health check endpoint. Returns 'Hello' if server is running.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

**Function Signature**:
```typescript
async function hello(): Promise<string>
```

**Request/Response Types**:
```typescript
// Response is plain text "Hello"
type HelloResponse = string;
```

**API Mapping**:
- **Endpoint**: `GET /api/v2/hello`
- **Content-Type**: `text/plain`
- **Auth**: None (public endpoint)
- **Response**: "Hello" string

**Implementation Logic**:
1. GET from `/api/v2/hello`
2. Read response as text
3. Return string

**Error Scenarios**:
1. Server unreachable → Connection failed

**Test Cases**:
```typescript
describe('hello', () => {
  test('returns hello message', async () => {
    const result = await hello();
    expect(result).toBe('Hello');
  });

  test('handles server unreachable', async () => {
    await expect(hello()).rejects.toThrow('Connection failed');
  });
});
```


---

## PART 4: COMPREHENSIVE TYPE DEFINITIONS

### Core Type Schemas

```typescript
// ============================================================================
// FILE OPERATIONS TYPES
// ============================================================================

export const UploadFileInputSchema = z.object({
  teamID: z.string().min(1, "Team ID required"),
  boardID: z.string().min(1, "Board ID required"),
  filename: z.string().min(1, "Filename required"),
  content: z.string().min(1, "File content required")
});

export const FileUploadResponseSchema = z.object({
  fileId: z.string().optional(),
  filename: z.string()
});

export const GetFileInputSchema = z.object({
  teamID: z.string().min(1, "Team ID required"),
  boardID: z.string().min(1, "Board ID required"),
  filename: z.string().min(1, "Filename required")
});

export const FileDownloadResponseSchema = z.object({
  filename: z.string(),
  content: z.string(), // base64
  contentType: z.string().optional(),
  size: z.number().optional()
});

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export const LoginRequestSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
  mfa_token: z.string().optional()
});

export const LoginResponseSchema = z.object({
  token: z.string()
});

export const RegisterRequestSchema = z.object({
  username: z.string().min(1, "Username required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().optional()
});

// ============================================================================
// SYSTEM INFORMATION TYPES
// ============================================================================

export const ClientConfigSchema = z.object({
  telemetry: z.boolean().optional(),
  telemetryid: z.string().optional(),
  enablePublicSharedBoards: z.boolean().optional(),
  featureFlags: z.record(z.boolean()).optional(),
  maxFileSize: z.number().optional()
});

export const BoardsStatisticsSchema = z.object({
  board_count: z.number().optional(),
  card_count: z.number().optional(),
  active_users: z.number().optional(),
  last_activity: z.string().optional()
});

export const BoardsCloudLimitsSchema = z.object({
  used_cards: z.number().optional(),
  card_limit_timestamp: z.number().optional(),
  cards_limit: z.number().optional(),
  views: z.number().optional()
});

export const PingResponseSchema = z.object({
  status: z.string(),
  version: z.string().optional(),
  build: z.string().optional(),
  timestamp: z.number().optional()
});

// ============================================================================
// ERROR TYPES
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  errorCode: z.string().optional(),
  details: z.record(z.any()).optional()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;
export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;
export type GetFileInput = z.infer<typeof GetFileInputSchema>;
export type FileDownloadResponse = z.infer<typeof FileDownloadResponseSchema>;

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export type ClientConfig = z.infer<typeof ClientConfigSchema>;
export type BoardsStatistics = z.infer<typeof BoardsStatisticsSchema>;
export type BoardsCloudLimits = z.infer<typeof BoardsCloudLimitsSchema>;
export type PingResponse = z.infer<typeof PingResponseSchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
```


---

## PART 5: IMPLEMENTATION GUIDE

### File Structure

```
src/
├── tools/
│   ├── files.ts          # File operation tools
│   ├── auth.ts           # Authentication tools
│   └── system.ts         # System information tools
├── types/
│   ├── files.ts          # File types
│   ├── auth.ts           # Auth types
│   └── system.ts         # System types
├── utils/
│   ├── base64.ts         # Base64 encoding/decoding
│   ├── http.ts           # HTTP client wrapper
│   └── auth.ts           # Auth token management
└── tests/
    ├── files.test.ts
    ├── auth.test.ts
    └── system.test.ts
```

### Base64 Utility Implementation

```typescript
// src/utils/base64.ts

export class Base64Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Base64Error';
  }
}

export function encodeBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export function decodeBase64(base64: string): Buffer {
  try {
    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      throw new Base64Error('Invalid base64 format');
    }
    return Buffer.from(base64, 'base64');
  } catch (error) {
    throw new Base64Error(`Failed to decode base64: ${error.message}`);
  }
}

export function isValidBase64(str: string): boolean {
  try {
    decodeBase64(str);
    return true;
  } catch {
    return false;
  }
}
```

### HTTP Client Wrapper

```typescript
// src/utils/http.ts

export class FocalboardAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'FocalboardAPIError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseURL = process.env.FOCALBOARD_URL || 'http://localhost:8000';
  const url = `${baseURL}${endpoint}`;
  
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };
  
  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new FocalboardAPIError(
        error.error || `HTTP ${response.status}`,
        response.status,
        error
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof FocalboardAPIError) throw error;
    throw new FocalboardAPIError('Network error', 0, error);
  }
}
```


### Authentication Token Management

```typescript
// src/utils/auth.ts

interface SessionState {
  token: string | null;
}

const sessionState: SessionState = {
  token: null
};

export function getAuthToken(): string | null {
  // Priority 1: Environment variable
  if (process.env.FOCALBOARD_TOKEN) {
    return process.env.FOCALBOARD_TOKEN;
  }
  
  // Priority 2: Session token (from login)
  if (sessionState.token) {
    return sessionState.token;
  }
  
  return null;
}

export function setSessionToken(token: string): void {
  sessionState.token = token;
}

export function clearSessionToken(): void {
  sessionState.token = null;
}

export function requireAuth(): string {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Use login tool or set FOCALBOARD_TOKEN.');
  }
  return token;
}
```


---

## PART 6: ERROR HANDLING MATRIX

### HTTP Status Code Mapping

| Status | Meaning | Tools Affected | Action |
|--------|---------|----------------|--------|
| 200 | Success | All | Return data |
| 401 | Unauthorized | All authenticated | Throw auth error |
| 403 | Forbidden | All | Throw permission error |
| 404 | Not Found | get_file, upload_file | Throw not found error |
| 409 | Conflict | register | Throw duplicate error |
| 413 | Payload Too Large | upload_file | Throw size error |
| 500 | Server Error | All | Throw server error |

### Error Response Format

```typescript
{
  "error": "Human-readable error message",
  "errorCode": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Custom Error Classes

```typescript
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class FileNotFoundError extends Error {
  constructor(filename: string) {
    super(`File not found: ${filename}`);
    this.name = 'FileNotFoundError';
  }
}

export class InvalidBase64Error extends Error {
  constructor() {
    super('Invalid base64 content');
    this.name = 'InvalidBase64Error';
  }
}
```


---

## PART 7: TEST STRATEGY

### Test Coverage Requirements

1. **Unit Tests** (100% coverage target):
   - Each tool function
   - Base64 encoding/decoding
   - Auth token management
   - Error handling

2. **Integration Tests**:
   - Real API calls (with test server)
   - File upload/download round-trip
   - Login/logout flow
   - Token persistence

3. **Edge Cases**:
   - Empty files
   - Large files (>10MB)
   - Invalid base64
   - Expired tokens
   - Network timeouts

### Mock Strategy

```typescript
// Mock Focalboard API responses
export const mockAPI = {
  login: {
    success: { token: 'mock-token-123' },
    failure: { error: 'Invalid login', errorCode: 'AUTH_FAILED' }
  },
  uploadFile: {
    success: { fileId: 'file-123', filename: 'test.png' },
    notFound: { error: 'Board not found', errorCode: 'BOARD_NOT_FOUND' }
  },
  getFile: {
    success: Buffer.from('mock-file-content'),
    notFound: { error: 'File not found', errorCode: 'FILE_NOT_FOUND' }
  }
};
```


---

## PART 8: TOOL REGISTRATION SUMMARY

### MCP Tool Registration Pattern

```typescript
// Register all tools with MCP SDK
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // File Operations
      {
        name: "upload_file",
        description: "Upload a file to a Focalboard board",
        inputSchema: zodToJsonSchema(UploadFileInputSchema)
      },
      {
        name: "get_file",
        description: "Download a file from a Focalboard board",
        inputSchema: zodToJsonSchema(GetFileInputSchema)
      },
      
      // Authentication
      {
        name: "login",
        description: "Login to Focalboard",
        inputSchema: zodToJsonSchema(LoginRequestSchema)
      },
      {
        name: "logout",
        description: "Logout from Focalboard",
        inputSchema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "register",
        description: "Register new user",
        inputSchema: zodToJsonSchema(RegisterRequestSchema)
      },
      
      // System Information
      {
        name: "get_client_config",
        description: "Get client configuration",
        inputSchema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "get_statistics",
        description: "Get server statistics",
        inputSchema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "get_cloud_limits",
        description: "Get cloud limits",
        inputSchema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "ping",
        description: "Ping server",
        inputSchema: { type: "object", properties: {}, required: [] }
      },
      {
        name: "hello",
        description: "Simple health check",
        inputSchema: { type: "object", properties: {}, required: [] }
      }
    ]
  };
});
```


---

## PART 9: IMPLEMENTATION CHECKLIST

### Phase 1: Core Infrastructure
- [ ] Set up project structure (src/tools, src/types, src/utils)
- [ ] Implement base64 utility (encode, decode, validate)
- [ ] Implement HTTP client wrapper with error handling
- [ ] Implement auth token management (getAuthToken, setSessionToken)
- [ ] Set up test framework with Bun

### Phase 2: Type Definitions
- [ ] Define all Zod schemas for file operations
- [ ] Define all Zod schemas for authentication
- [ ] Define all Zod schemas for system tools
- [ ] Export TypeScript types from schemas
- [ ] Validate schemas against swagger.yml

### Phase 3: File Operations
- [ ] Implement upload_file tool
- [ ] Implement get_file tool
- [ ] Write unit tests for file tools
- [ ] Test base64 round-trip
- [ ] Test error scenarios

### Phase 4: Authentication
- [ ] Implement login tool
- [ ] Implement logout tool
- [ ] Implement register tool
- [ ] Write unit tests for auth tools
- [ ] Test token persistence
- [ ] Test FOCALBOARD_TOKEN priority

### Phase 5: System Tools
- [ ] Implement get_client_config tool
- [ ] Implement get_statistics tool
- [ ] Implement get_cloud_limits tool
- [ ] Implement ping tool
- [ ] Implement hello tool
- [ ] Write unit tests for system tools

### Phase 6: Integration
- [ ] Register all tools with MCP SDK
- [ ] Implement tool call handler
- [ ] Test end-to-end flows
- [ ] Write integration tests
- [ ] Performance testing

### Phase 7: Documentation
- [ ] API documentation
- [ ] Usage examples
- [ ] Error handling guide
- [ ] Deployment guide


---

## PART 10: SUMMARY & KEY DECISIONS

### Tool Count Summary
- **File Operations**: 2 tools (upload_file, get_file)
- **Authentication**: 3 tools (login, logout, register)
- **System Information**: 5 tools (get_client_config, get_statistics, get_cloud_limits, ping, hello)
- **Total**: 10 tools

### Key Technical Decisions

1. **Base64 for File Content**
   - MCP tools accept/return base64 strings
   - Internal conversion to/from binary for API calls
   - Validates base64 format before processing

2. **Dual Authentication Model**
   - Environment variable (FOCALBOARD_TOKEN) for automation
   - Login tool for interactive sessions
   - Clear priority: env > session > none

3. **Error Handling**
   - Custom error classes for different scenarios
   - HTTP status code mapping
   - Detailed error messages with context

4. **Type Safety**
   - Zod schemas for runtime validation
   - TypeScript types inferred from schemas
   - Alignment with swagger.yml definitions

5. **Testing Approach**
   - Unit tests for each tool
   - Integration tests with mock API
   - Edge case coverage
   - Base64 round-trip validation

### API Endpoint Mapping

| Tool | Method | Endpoint | Auth Required |
|------|--------|----------|---------------|
| upload_file | POST | /api/v2/teams/{teamID}/boards/{boardID}/files | Yes |
| get_file | GET | /api/v2/files/teams/{teamID}/{boardID}/{filename} | Yes |
| login | POST | /api/v2/login | No |
| logout | POST | /api/v2/logout | Yes |
| register | POST | /api/v2/register | No |
| get_client_config | GET | /api/v2/clientConfig | No |
| get_statistics | GET | /api/v2/statistics | Yes |
| get_cloud_limits | GET | /api/v2/limits | Yes |
| ping | GET | /api/v2/ping | No |
| hello | GET | /api/v2/hello | No |

### Dependencies
- `@modelcontextprotocol/sdk`: MCP server implementation
- `zod`: Schema validation and type inference
- `bun`: Runtime and test framework
- No additional dependencies required (use built-in fetch, Buffer)

### Environment Variables
```bash
# Required
FOCALBOARD_URL=http://localhost:8000

# Optional (for pre-authenticated sessions)
FOCALBOARD_TOKEN=your-token-here
```

### Next Steps
1. Review this planning document
2. Create type definitions in `src/types/`
3. Implement utilities in `src/utils/`
4. Implement tools in `src/tools/`
5. Write tests in `src/tests/`
6. Register tools with MCP SDK
7. Integration testing
8. Documentation

---

## APPENDIX: Example Usage

### File Upload Example
```typescript
// Upload an image
const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const result = await uploadFile({
  teamID: 'team-123',
  boardID: 'board-456',
  filename: 'logo.png',
  content: imageBase64
});

console.log(`Uploaded: ${result.filename}`);
```

### Authentication Flow Example
```typescript
// Login
const loginResult = await login({
  username: 'user@example.com',
  password: 'securepass123'
});

console.log(`Token: ${loginResult.token}`);

// Use authenticated endpoints
const stats = await getStatistics();
console.log(`Boards: ${stats.board_count}`);

// Logout
await logout();
```

### System Information Example
```typescript
// Check server health
const hello = await hello();
console.log(hello); // "Hello"

// Get configuration
const config = await getClientConfig();
console.log(`Max file size: ${config.maxFileSize}`);

// Check limits
const limits = await getCloudLimits();
console.log(`Cards used: ${limits.used_cards}/${limits.cards_limit}`);
```

---

**END OF PLANNING DOCUMENT**

