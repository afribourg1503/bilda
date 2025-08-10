# 🚀 Supabase Setup Guide for BuilderTrack

## 📋 **Step 1: Get Your Supabase Keys**

1. Go to your Supabase project: https://supabase.com/dashboard/project/aifrmvlajweesojgrpvd
2. Navigate to **Settings** → **API**
3. Copy your **Project URL** and **anon public key**

## 🔧 **Step 2: Update Environment Variables**

Create a `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=https://aifrmvlajweesojgrpvd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_anon_key_here` with your actual anon key from Step 1.

## 🗄️ **Step 3: Create Database Tables**

Go to your Supabase dashboard → **SQL Editor** and run these commands:

### **Users Table (Auto-created by Supabase Auth)**
```sql
-- This is automatically created by Supabase Auth
-- No need to create manually
```

### **Projects Table**
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🚀',
  color TEXT NOT NULL DEFAULT 'bg-purple-500',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);
```

### **Sessions Table**
```sql
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- Duration in seconds
  note TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);
```

## 🔐 **Step 4: Configure Authentication**

1. Go to **Authentication** → **Settings**
2. Configure your **Site URL**: `http://localhost:8081` (for development)
3. Add **Redirect URLs**: 
   - `http://localhost:8081/dashboard`
   - `http://localhost:8081/auth/callback`

### **Enable OAuth Providers (Optional)**
1. Go to **Authentication** → **Providers**
2. Enable **GitHub** and configure with your GitHub OAuth app
3. Enable **Google** if desired

## 🎯 **Step 5: Test the Integration**

1. Start your development server: `npm run dev`
2. Go to `http://localhost:8081/login`
3. Try creating an account or signing in
4. Test the project creation and session tracking

## 🔧 **Step 6: Update Supabase Config**

Once you have your anon key, update `src/lib/supabase.ts`:

```typescript
const supabaseAnonKey = 'your_actual_anon_key_here';
```

## 🚀 **What's Now Working:**

✅ **Real Authentication** - Sign up/sign in with email/password  
✅ **OAuth Integration** - GitHub login  
✅ **Database Schema** - Projects and sessions tables  
✅ **Row Level Security** - Users can only access their own data  
✅ **Real-time Features** - Live updates with WebSockets  
✅ **Type Safety** - Full TypeScript support  

## 📊 **Next Steps:**

1. **Test Authentication** - Create an account and sign in
2. **Test Project Creation** - Create projects through the UI
3. **Test Session Tracking** - Start and end build sessions
4. **Deploy to Production** - Update site URLs for production

## 🐛 **Troubleshooting:**

- **"Invalid API key"** - Check your anon key in `.env.local`
- **"RLS policy violation"** - Make sure you're signed in
- **"Table doesn't exist"** - Run the SQL commands in Step 3
- **OAuth not working** - Check redirect URLs in Supabase settings

## 📞 **Need Help?**

- Check Supabase docs: https://supabase.com/docs
- Join Supabase Discord: https://discord.supabase.com
- Check the console for detailed error messages

---

**🎉 You now have a fully functional backend for BuilderTrack!** 