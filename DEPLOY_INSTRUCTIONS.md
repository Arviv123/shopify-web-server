# 🚀 Deploy Instructions

## Step 1: Push to New GitHub Repository

After creating a new repository on GitHub called `shopify-web-server`, run:

```bash
cd C:\mcp\shopify-mcp-server
git remote add origin https://github.com/Arviv123/shopify-web-server.git
git push -u origin master
```

## Step 2: Deploy to Render.com

1. Go to Render.com dashboard
2. Click "New" → "Web Service"
3. Connect the new GitHub repository: `shopify-web-server`
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
   
5. Environment Variables:
   ```
   SHOPIFY_STORE_URL=https://your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
   ```

6. Click "Deploy"

## Step 3: Test Deployment

Once deployed, visit:
- `https://your-app.onrender.com/` - Main page
- `https://your-app.onrender.com/config` - Configuration interface  
- `https://your-app.onrender.com/health` - Health check

## ✅ What This Version Contains

- **Pure CommonJS** - No TypeScript, no build process
- **4 Dependencies Only** - express, axios, cors, uuid
- **Working Configuration Interface** - Set credentials via web interface
- **No Legacy Files** - Clean repository with only necessary files

## 🔧 Local Testing

```bash
npm install
npm start
# Visit http://localhost:8080/config
```

This version should deploy successfully without any build errors!