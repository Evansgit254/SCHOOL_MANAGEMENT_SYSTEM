# Assignments Page Documentation

## Overview
The assignments page is a role-based system for managing school assignments. It provides different views and permissions based on user roles (admin, teacher, student).

## Table of Contents
1. [URL Structure](#url-structure)
2. [Role-Based Access](#role-based-access)
3. [Search Parameters](#search-parameters)
4. [Query System](#query-system)
5. [Page Features](#page-features)
6. [Code Examples](#code-examples)

## URL Structure

### Base URL
```
/assignments
```

### URL Parameters
- `page`: Page number for pagination
- `search`: Text to search in assignment names
- `classId`: Filter by specific class
- `teacherId`: Filter by specific teacher

### Examples
```
/assignments?page=1
/assignments?search=math
/assignments?classId=123
/assignments?teacherId=456
/assignments?search=math&classId=123&page=1
```

## Role-Based Access

### Admin Role
- Can view all assignments
- Has full CRUD (Create, Read, Update, Delete) permissions
- No filtering restrictions

### Teacher Role
- Can view their own assignments
- Can create new assignments
- Can edit and delete their own assignments
- Automatically filtered to show only their assignments

### Student Role
- Can only view assignments for their class
- Cannot create, edit, or delete assignments
- Automatically filtered by their class ID

## Search Parameters

### Available Parameters

1. **page**
   - Type: number
   - Default: 1
   - Purpose: Controls pagination
   ```javascript
   const p = page ? parseInt(page) : 1;
   ```

2. **search**
   - Type: string
   - Purpose: Text search in assignment names
   ```javascript
   case "search":
       query.lesson.AND.push({
           subject: {
               name: {
                   contains: value,
                   mode: "insensitive"
               }
           }
       });
   ```

3. **classId**
   - Type: number
   - Purpose: Filter assignments by class
   ```javascript
   case "classId":
       query.lesson.AND.push({ 
           classId: parseInt(value) 
       });
   ```

4. **teacherId**
   - Type: string
   - Purpose: Filter assignments by teacher
   ```javascript
   case "teacherId":
       query.lesson.AND.push({ 
           teacherId: value 
       });
   ```

## Query System

### Basic Query Structure
```javascript
const query = {
    lesson: {
        AND: []
    }
};
```

### Query Components

1. **Role-Based Filtering**
```javascript
switch (role) {
    case "admin":
        // No restrictions
        break;
    case "teacher":
        // Filter by teacher ID
        query.lesson.AND.push({ teacherId: user.id });
        break;
    case "student":
        // Filter by class ID
        query.lesson.AND.push({ classId: studentClassId });
        break;
}
```

2. **Search Filtering**
```javascript
if (searchText) {
    query.lesson.AND.push({
        subject: {
            name: {
                contains: searchText,
                mode: "insensitive"
            }
        }
    });
}
```

## Page Features

### 1. Table Display
- Shows assignment details
- Responsive design (some columns hide on mobile)
- Sortable columns

### 2. Action Buttons
- Create new assignment (admin/teacher only)
- Edit assignment (admin/teacher only)
- Delete assignment (admin/teacher only)

### 3. Pagination
- Shows 10 items per page
- Page navigation controls
- Current page indicator

### 4. Search and Filter
- Text search functionality
- Class filter
- Teacher filter

## Code Examples

### 1. Basic Query
```javascript
// Get all assignments for a class
const query = {
    lesson: {
        AND: [
            { classId: 123 }
        ]
    }
};
```

### 2. Combined Filters
```javascript
// Get math assignments for a specific teacher
const query = {
    lesson: {
        AND: [
            { teacherId: "teacher123" },
            {
                subject: {
                    name: {
                        contains: "math",
                        mode: "insensitive"
                    }
                }
            }
        ]
    }
};
```

### 3. Pagination Implementation
```javascript
const results = await prisma.assignment.findMany({
    where: query,
    take: ITEM_PER_PAGE,
    skip: ITEM_PER_PAGE * (page - 1),
});
```

## Error Handling

### Authentication Errors
```javascript
if (!userId || !user) {
    return (
        <div className="flex justify-center items-center h-full">
            <p className="text-red-500">Please sign in to view assignments</p>
        </div>
    );
}
```

### Role Validation
```javascript
if (!role) {
    return (
        <div className="flex justify-center items-center h-full">
            <p className="text-red-500">Access denied. No role assigned.</p>
        </div>
    );
}
```

### Empty Results
```javascript
if (!data || data.length === 0) {
    return (
        <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No assignments found</p>
        </div>
    );
}
```

## Best Practices

1. **Role-Based Access Control**
   - Always check user role before displaying content
   - Implement proper permissions for actions
   - Filter data based on role

2. **Query Optimization**
   - Use proper indexing for frequently searched fields
   - Implement pagination for large datasets
   - Optimize database queries

3. **Error Handling**
   - Provide clear error messages
   - Handle edge cases
   - Implement proper validation

4. **UI/UX**
   - Responsive design
   - Clear navigation
   - Intuitive interface

## Troubleshooting

### Common Issues

1. **Permissions Issues**
   - Check user role assignment
   - Verify authentication status
   - Confirm proper role-based filtering

2. **Search Problems**
   - Verify search parameter format
   - Check case sensitivity settings
   - Confirm database indexing

3. **Pagination Issues**
   - Verify page number calculation
   - Check ITEM_PER_PAGE setting
   - Confirm total count calculation 