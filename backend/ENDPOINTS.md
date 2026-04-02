# Costura API - Endpoints Documentation

Complete API reference for the Costura backend with all available endpoints, request/response formats, and error codes.

Base URL: `http://localhost:3000/api`

## Authentication Endpoints

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response 201:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "ALUMNO"
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "ALUMNO"
  }
}
```

## Courses Endpoints

### List All Courses
```
GET /api/courses
Query Parameters:
  - featured (optional): "true" to get only featured courses

Response 200:
[
  {
    "id": "course123",
    "title": "Sewing Basics",
    "description": "Learn basic sewing skills",
    "price": 29.99,
    "level": "PRINCIPIANTE",
    "featured": true,
    "rating": 4.5,
    "students": 120,
    "lessons": []
  }
]
```

### Get Course Details
```
GET /api/courses/:id

Response 200:
{
  "id": "course123",
  "title": "Sewing Basics",
  "description": "Learn basic sewing skills",
  "longDescription": "...",
  "image": "https://...",
  "price": 29.99,
  "level": "PRINCIPIANTE",
  "instructor": "Expert Tailor",
  "duration": "4 weeks",
  "featured": true,
  "rating": 4.5,
  "students": 120,
  "lessons": [
    {
      "id": "lesson1",
      "title": "Getting Started",
      "duration": "15 min",
      "order": 1
    }
  ]
}
```

### Create Course (Admin Only)
```
POST /api/courses
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Advanced Fashion Design",
  "description": "Master advanced techniques",
  "price": 79.99,
  "level": "AVANZADO",
  "instructor": "Fashion Expert",
  "image": "https://...",
  "longDescription": "...",
  "duration": "8 weeks",
  "featured": false
}

Response 201: Course object
```

### Update Course (Admin Only)
```
PUT /api/courses/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Updated Title",
  "price": 49.99
}

Response 200: Updated course object
```

### Delete Course (Admin Only)
```
DELETE /api/courses/:id
Authorization: Bearer <JWT_TOKEN>

Response 200: { "success": true }
```

## Lessons Endpoints

### List Lessons for Course
```
GET /api/courses/:courseId/lessons

Response 200:
[
  {
    "id": "lesson1",
    "title": "Getting Started",
    "videoUrl": "https://youtube.com/watch?v=...",
    "duration": "15 min",
    "order": 1,
    "courseId": "course123"
  }
]
```

### Get Lesson Details
```
GET /api/courses/:courseId/lessons/:lessonId

Response 200: Lesson object
```

### Create Lesson (Admin Only)
```
POST /api/courses/:courseId/lessons
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "First Steps",
  "videoUrl": "https://youtube.com/watch?v=...",
  "duration": "20 min",
  "order": 1,
  "courseId": "course123"
}

Response 201: Lesson object
```

### Update Lesson (Admin Only)
```
PUT /api/courses/:courseId/lessons/:lessonId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Updated Title",
  "videoUrl": "https://youtube.com/watch?v=..."
}

Response 200: Updated lesson object
```

### Delete Lesson (Admin Only)
```
DELETE /api/courses/:courseId/lessons/:lessonId
Authorization: Bearer <JWT_TOKEN>

Response 200: { "success": true }
```

## Purchases Endpoints

### Request Course Purchase
```
POST /api/purchases
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "courseId": "course123"
}

Response 201:
{
  "id": "purchase123",
  "userId": "user123",
  "courseId": "course123",
  "status": "PENDING",
  "total": 29.99,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get Pending Purchase Requests (Admin Only)
```
GET /api/purchases/pending
Authorization: Bearer <JWT_TOKEN>

Response 200:
[
  {
    "id": "purchase123",
    "userId": "user123",
    "courseId": "course123",
    "status": "PENDING",
    "total": 29.99,
    "user": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "course": {
      "id": "course123",
      "title": "Sewing Basics"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Approve Purchase (Admin Only)
```
PATCH /api/purchases/:purchaseId/approve
Authorization: Bearer <JWT_TOKEN>

Response 200: Updated purchase with status APPROVED
```

### Reject Purchase (Admin Only)
```
PATCH /api/purchases/:purchaseId/reject
Authorization: Bearer <JWT_TOKEN>

Response 200: Updated purchase with status REJECTED
```

### Get User Purchases
```
GET /api/purchases/user/:userId
Authorization: Bearer <JWT_TOKEN>

Response 200:
[
  {
    "id": "purchase123",
    "userId": "user123",
    "courseId": "course123",
    "status": "APPROVED",
    "total": 29.99,
    "course": { ... },
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

## Lesson Progress Endpoints

### Get Course Progress
```
GET /api/progress/courses/:courseId
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "courseId": "course123",
  "totalLessons": 10,
  "completedLessons": 3,
  "progressPercentage": 30,
  "lessons": [
    {
      "id": "lesson1",
      "title": "Getting Started",
      "order": 1,
      "duration": "15 min",
      "completed": true
    },
    {
      "id": "lesson2",
      "title": "Next Steps",
      "order": 2,
      "duration": "20 min",
      "completed": false
    }
  ]
}
```

### Mark Lesson as Complete
```
PATCH /api/progress/lessons/:lessonId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "completed": true
}

Response 200: Updated progress object
```

## Notifications Endpoints

### Get User Notifications
```
GET /api/notifications
Authorization: Bearer <JWT_TOKEN>

Response 200:
[
  {
    "id": "notif1",
    "title": "Purchase Approved",
    "message": "Your purchase has been approved",
    "read": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Get Unread Count
```
GET /api/notifications/unread-count
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "unreadCount": 3
}
```

### Mark Notification as Read
```
PATCH /api/notifications/:notificationId/read
Authorization: Bearer <JWT_TOKEN>

Response 200: Updated notification object
```

### Mark All as Read
```
PATCH /api/notifications/mark-all-read
Authorization: Bearer <JWT_TOKEN>

Response 200: { "updated": 3 }
```

### Delete Notification
```
DELETE /api/notifications/:notificationId
Authorization: Bearer <JWT_TOKEN>

Response 200: { "success": true }
```

## Favorites Endpoints

### Get User Favorites
```
GET /api/favorites
Authorization: Bearer <JWT_TOKEN>

Response 200:
[
  {
    "id": "fav1",
    "userId": "user123",
    "courseId": "course123",
    "course": {
      "id": "course123",
      "title": "Sewing Basics",
      "price": 29.99
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Add Course to Favorites
```
POST /api/favorites/courses/:courseId
Authorization: Bearer <JWT_TOKEN>

Response 201: Favorite object
```

### Remove from Favorites
```
DELETE /api/favorites/courses/:courseId
Authorization: Bearer <JWT_TOKEN>

Response 200: { "success": true }
```

### Check if Course is Favorite
```
GET /api/favorites/courses/:courseId/check
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "isFavorite": true
}
```

## Users Endpoints

### Get All Users (Admin Only)
```
GET /api/users
Authorization: Bearer <JWT_TOKEN>

Response 200:
[
  {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ALUMNO",
    "active": true,
    "createdAt": "2024-01-10T10:30:00Z"
  }
]
```

### Get User Details
```
GET /api/users/:id
Authorization: Bearer <JWT_TOKEN>

Response 200: User object
```

### Delete User (Admin Only)
```
DELETE /api/users/:id
Authorization: Bearer <JWT_TOKEN>

Response 200: { "success": true }
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Authentication Header
All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

Where `<JWT_TOKEN>` is obtained from `/auth/register` or `/auth/login`

## Rate Limiting
- **Limit**: 100 requests per 15 minutes
- **Headers**: 
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1610700600`

## Required Fields Validation

### Registration
- `name`: string, min 2 characters
- `email`: valid email format
- `password`: string, min 6 characters

### Login
- `email`: valid email format
- `password`: string, min 6 characters

### Course Creation
- `title`: string, required
- `description`: string, required
- `price`: number >= 0
- `level`: "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO"

### Lesson Creation
- `title`: string, required
- `videoUrl`: string, required
- `duration`: string, required
- `order`: number >= 0
- `courseId`: valid course ID

## Usage Examples

### Complete Purchase Flow
```bash
# 1. User requests purchase
curl -X POST http://localhost:3000/api/purchases \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"courseId": "course123"}'

# 2. Admin views pending requests
curl http://localhost:3000/api/purchases/pending \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 3. Admin approves purchase
curl -X PATCH http://localhost:3000/api/purchases/purchase123/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 4. User gets notification and can access course
```

### Complete Lesson Flow
```bash
# 1. Get course with lessons
curl http://localhost:3000/api/courses/course123

# 2. Mark first lesson complete
curl -X PATCH http://localhost:3000/api/progress/lessons/lesson1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# 3. Get progress
curl http://localhost:3000/api/progress/courses/course123 \
  -H "Authorization: Bearer <TOKEN>"
```
