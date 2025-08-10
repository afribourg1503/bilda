# 🔧 Toast Fixes for SessionTimer.tsx

The SessionTimer component still has several toast calls using the old format that need to be converted to sonner's direct API.

## 🚨 **Current Issues**

The component has multiple toast calls using the old format:
```typescript
toast({ title: '...', variant: 'destructive' as any })
```

These need to be converted to:
```typescript
toast.error('...')  // for errors
toast.success('...') // for success messages
```

## 📍 **Lines to Fix**

### **Line 144** - handleEndSession
```typescript
// Change from:
toast({ title: 'You must be logged in', variant: 'destructive' as any });

// To:
toast.error('You must be logged in');
```

### **Line 292** - handleEndSession (already fixed)
```typescript
// Already changed to:
toast.error('Select a project first');
```

### **Line 309** - handleEndSession
```typescript
// Change from:
toast({ title: 'Failed to save session', description: error.message, variant: 'destructive' as any });

// To:
toast.error(`Failed to save session: ${error.message}`);
```

### **Line 311** - handleEndSession
```typescript
// Change from:
toast({ title: 'Session saved', description: `Duration: ${Math.floor(elapsed/60)}m` });

// To:
toast.success(`Session saved! Duration: ${Math.floor(elapsed/60)}m`);
```

### **Line 329** - handleEndSession
```typescript
// Change from:
toast({ title: 'Failed to save session', description: e?.message ?? 'Unknown error', variant: 'destructive' as any });

// To:
toast.error(`Failed to save session: ${e?.message ?? 'Unknown error'}`);
```

### **Line 349** - handleCreateProject
```typescript
// Change from:
toast({ title: 'You must be logged in', variant: 'destructive' as any });

// To:
toast.error('You must be logged in');
```

### **Line 353** - handleCreateProject
```typescript
// Change from:
toast({ title: 'Project name is required', variant: 'destructive' as any });

// To:
toast.error('Project name is required');
```

### **Line 365** - handleCreateProject
```typescript
// Change from:
toast({ title: 'Failed to create project', description: error.message, variant: 'destructive' as any });

// To:
toast.error(`Failed to create project: ${error.message}`);
```

### **Line 369** - handleCreateProject
```typescript
// Change from:
toast({ title: 'Project created successfully', variant: 'default' as any });

// To:
toast.success('Project created successfully!');
```

### **Line 380** - handleToggleLive
```typescript
// Change from:
toast({ title: 'Select a project first', variant: 'destructive' as any });

// To:
toast.error('Select a project first');
```

## 🎯 **Quick Fix Script**

You can use search and replace in your editor to fix all instances:

1. **Search for**: `toast({ title: '`
2. **Replace with**: `toast.error('`
3. **Search for**: `toast({ title: 'Project created successfully', variant: 'default' as any });`
4. **Replace with**: `toast.success('Project created successfully!');`
5. **Search for**: `toast({ title: 'Session saved', description: \`Duration: \${Math.floor(elapsed/60)}m\` });`
6. **Replace with**: `toast.success(\`Session saved! Duration: \${Math.floor(elapsed/60)}m\`);`

## ✅ **After Fixes**

Once all toast calls are converted:
- Timer should work properly (infinite loop fixed)
- No more linter errors
- Consistent toast notifications using sonner
- Better user experience with proper error/success messages

## 🚀 **Deploy After Fixes**

After fixing all toast calls:
1. Commit the changes
2. Push to GitHub
3. Vercel will auto-deploy
4. Timer should work correctly on the deployed website
