# 🚀 Connecting Supabase to Vercel Deployment

This guide will help you connect your Supabase backend to your Vercel frontend deployment.

## 📋 **Prerequisites**

- ✅ Supabase project created and running
- ✅ Vercel project deployed
- ✅ Database tables set up (run `SUPABASE_MINIMAL_SETUP.sql`)

## 🔑 **Step 1: Get Your Supabase Credentials**

1. **Go to your Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project**
3. **Go to Settings → API**
4. **Copy these values**:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: The long string starting with `eyJ...`

## 🌍 **Step 2: Set Environment Variables in Vercel**

1. **Go to your Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add these variables**:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `your-anon-key-here` | Production, Preview, Development |

5. **Click "Save"**

## 🗄️ **Step 3: Set Up Your Database**

1. **In Supabase Dashboard, go to SQL Editor**
2. **Run the minimal setup script**:
   ```sql
   -- Copy and paste the contents of SUPABASE_MINIMAL_SETUP.sql
   ```
3. **Verify tables are created**:
   - `profiles`
   - `follows` 
   - `notifications`
   - `live_sessions`
   - `live_comments`

## 🔄 **Step 4: Redeploy Your App**

1. **In Vercel, go to Deployments**
2. **Click "Redeploy" on your latest deployment**
3. **Wait for deployment to complete**

## ✅ **Step 5: Test the Connection**

1. **Visit your deployed app**
2. **Try to sign up/sign in**
3. **Check browser console for any errors**
4. **Verify data is being saved to Supabase**

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"Invalid API key" error**:
   - Double-check your anon key in Vercel
   - Ensure the key is copied completely

2. **"Project not found" error**:
   - Verify your project URL in Vercel
   - Check that your Supabase project is active

3. **"Table doesn't exist" error**:
   - Run the database setup script in Supabase
   - Check that all required tables are created

4. **CORS errors**:
   - In Supabase, go to Settings → API
   - Add your Vercel domain to "Additional Allowed Origins"

### **Debug Steps:**

1. **Check Vercel environment variables** are set correctly
2. **Verify Supabase project** is running and accessible
3. **Check browser console** for detailed error messages
4. **Test Supabase connection** directly in the dashboard

## 🔒 **Security Notes**

- ✅ **anon key is safe** to expose in frontend (it's public)
- ❌ **Never expose** service role key in frontend
- ✅ **Environment variables** are encrypted in Vercel
- ✅ **Row Level Security (RLS)** protects your data

## 📱 **Local Development**

For local development, create a `.env.local` file:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🎯 **Next Steps**

After successful connection:
1. **Test all features** (auth, projects, live streaming)
2. **Monitor Supabase logs** for any issues
3. **Set up monitoring** and alerts if needed
4. **Consider setting up** Supabase Edge Functions for advanced features

---

**Need Help?** Check the [Supabase Documentation](https://supabase.com/docs) or [Vercel Documentation](https://vercel.com/docs).
