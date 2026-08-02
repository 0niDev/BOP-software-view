# Deploy to GitHub Pages

This ERP system can now be deployed to **GitHub Pages for FREE** using SQLite Cloud as the database backend. No need for Render or any paid hosting service!

## How It Works

The `docs/index.html` file contains a complete frontend application that connects **directly** to SQLite Cloud's REST API from the browser. This eliminates the need for a Python/Flask backend server.

## Deployment Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Choose branch: **main** (or your default branch)
5. Choose folder: **/docs**
6. Click **Save**

### 2. Wait for Deployment

GitHub will deploy your site at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

### 3. Access Your App

Your ERP system will be live and connected to SQLite Cloud!

## File Structure

```
/workspace/
├── api_server.py          # Flask backend (for Render/PythonAnywhere - NOT used for GitHub Pages)
├── static/index.html      # Original frontend (requires backend)
├── docs/index.html        # ✅ GitHub Pages version (direct SQLite Cloud connection)
└── ... other files
```

## What Changed in `docs/index.html`

The `docs/index.html` file has been modified to:

1. **Remove backend dependency**: No more `API = window.location.origin`
2. **Direct SQLite Cloud connection**: Uses `fetch()` to call SQLite Cloud REST API directly
3. **SQL queries in JavaScript**: All API endpoints are replaced with direct SQL queries
4. **Same functionality**: All features work exactly the same as before

## SQLite Cloud Configuration

The app uses these credentials (already configured in `docs/index.html`):

```javascript
const SQLITE_CLOUD_CONFIG = {
    apiKey: "bmJZ0l1RTFCoxS0Au17c0iofzZmrDn2Db94v0YtV9Uw",
    database: "cool-depot.sqlite",
    projectId: "cjja8z6pvz",
    apiUrl: "https://cjja8z6pvz.g4.sqlite.cloud/v2/weblite/sql"
};
```

## Features Available

All features work without a backend:

- ✅ Dashboard with real-time data
- ✅ Parties management
- ✅ Items management  
- ✅ Sales invoices
- ✅ Purchase invoices
- ✅ Accounts
- ✅ Stock management
- ✅ Trial Balance report
- ✅ Profit & Loss report
- ✅ Balance Sheet report
- ✅ Cash Book report
- ✅ Party Ledger report

## Important Notes

### Security Consideration

⚠️ **Your API key is exposed in the browser code**. This is acceptable for:
- Personal projects
- Internal tools
- Prototypes

For production use with sensitive data, consider:
1. Using SQLite Cloud's row-level security
2. Creating a read-only API key with limited permissions
3. Using a proxy service (Cloudflare Workers, etc.)

### CORS

SQLite Cloud REST API supports CORS, so browser requests work without issues.

### Rate Limits

SQLite Cloud free tier has rate limits. For heavy usage, consider upgrading.

## Updating Your Database

To update data in your SQLite Cloud database:

1. Use SQLite Cloud's web interface at https://app.sqlitecloud.io
2. Or use any SQLite client that supports SQLite Cloud
3. Or use the REST API directly

## Troubleshooting

### App shows "Loading..." forever

1. Open browser console (F12)
2. Check for errors
3. Verify your SQLite Cloud database name and API key
4. Make sure your database has the required tables

### CORS errors

SQLite Cloud should allow CORS by default. If you see CORS errors:
1. Check your SQLite Cloud settings
2. Make sure you're using the correct API URL

### Data not showing

1. Verify your database has data
2. Check table names match the SQL queries
3. Look for SQL syntax errors in browser console

## Comparison: GitHub Pages vs Render

| Feature | GitHub Pages | Render |
|---------|-------------|--------|
| Cost | **FREE** | Free tier available |
| Backend Required | ❌ No | ✅ Yes (Python/Flask) |
| Setup Complexity | Easy | Medium |
| Performance | Fast (CDN) | Depends on server |
| Database | SQLite Cloud | Any |
| SSL | ✅ Automatic | ✅ Automatic |
| Custom Domain | ✅ Yes | ✅ Yes |

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify SQLite Cloud connection at: https://app.sqlitecloud.io
3. Review the SQL queries in `docs/index.html`

---

**Enjoy your FREE hosting on GitHub Pages! 🎉**
