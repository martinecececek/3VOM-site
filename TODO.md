# 3VOM Site - TODO & Issues

## 🔴 CRITICAL SECURITY ISSUES (Fix Immediately!)

### 1. ADMIN_KEY Exposed in Client-Side Code
**Priority:** URGENT
**Status:** ⚠️ Not Fixed
**Files:**
- `admin/JS/add-item.js` (line 4)
- `admin/JS/remove-item.js` (line 6)

**Problem:**
The ADMIN_KEY is hardcoded in JavaScript files that are publicly accessible. Anyone can view your website's source code and obtain this key, allowing them to add/remove items from your system without authorization.

**Current Code:**
```javascript
const ADMIN_KEY = "bHKJKHJKJHG6Jadpiadasd14a6s5d15691ASDADASD541a5sd1a651d3a1sd65198451ASDASASDASDASDDa16jh5gk4h665161K";
```

**Solution Options:**
1. **Server-side authentication:** Create a backend endpoint that handles authentication with session cookies
2. **Use Cloudflare Access:** Implement Cloudflare Access to protect the admin pages
3. **IP-based restrictions:** Configure Cloudflare Worker to only accept requests from specific IP addresses
4. **OAuth/Auth0:** Implement proper user authentication

**Impact:** High - Anyone can manipulate your data
**Effort:** Medium - Requires restructuring authentication flow

---

### 2. Wide-Open CORS Policy
**Priority:** HIGH
**Status:** ⚠️ Not Fixed
**Files:**
- `admin/cloudeflare-worker/add-item-worker.js` (lines 15-17)
- `admin/cloudeflare-worker/remove-item-worker.js` (lines 15-17)

**Problem:**
Workers accept requests from ANY origin, not just your domain.

**Current Code:**
```javascript
const origin = request.headers.get("Origin") || "*";
const corsHeaders = {
   "Access-Control-Allow-Origin": origin,
```

**Solution:**
Restrict CORS to only your domain:
```javascript
const ALLOWED_ORIGINS = ["https://yourdomain.com", "http://localhost:5500"];
const origin = request.headers.get("Origin");
const corsHeaders = {
   "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
```

**Impact:** Medium - Prevents unauthorized cross-site requests
**Effort:** Low - Simple code change

---

## 🟠 HIGH PRIORITY BUGS

### 3. Duplicate Event Listeners on Remove Button
**Priority:** HIGH
**Status:** ⚠️ Not Fixed
**Files:**
- `admin/JS/load-borrow-admin.js` (lines 117-119)
- `admin/JS/remove-item.js` (lines 11-72)

**Problem:**
BOTH files attach event listeners to `.remove-item-btn`. When clicked:
1. `load-borrow-admin.js` removes the row from UI immediately (line 118)
2. `remove-item.js` tries to make the API call
3. If API call fails, row is already gone and user can't retry

**Current Code in load-borrow-admin.js:**
```javascript
// REMOVE row (UI only)
if (t.classList.contains("remove-item-btn")) {
   t.closest("tr")?.remove();
}
```

**Solution:**
Remove lines 116-119 from `load-borrow-admin.js`. Let `remove-item.js` handle both the API call and UI update.

**Impact:** Medium - Causes poor UX when API fails
**Effort:** Low - Delete 4 lines of code

---

### 4. Relative Path in Data Fetch
**Priority:** MEDIUM
**Status:** ⚠️ Not Fixed
**File:** `admin/JS/load-borrow-admin.js` (line 9)

**Problem:**
Uses relative path `"../src/data/items.json"` which might fail depending on where the page is served from.

**Current Code:**
```javascript
fetch("../src/data/items.json")
```

**Solution:**
Use absolute path:
```javascript
fetch("/src/data/items.json")
```

**Impact:** Low - Could cause loading failures on some paths
**Effort:** Low - Change one line

---

### 5. Inconsistent ID Types in items.json
**Priority:** LOW
**Status:** ⚠️ Not Fixed
**File:** `src/data/items.json`

**Problem:**
Borrowed items have mixed ID types:
- Original items: numeric IDs (101, 102)
- New items: string IDs ("borrow-1771193157411-19l85n2h7")

**Solution:**
Standardize to string IDs for all borrowed items. Update workers to always generate string IDs.

**Impact:** Low - Code handles it but inconsistent
**Effort:** Medium - Need to migrate existing IDs

---

## 🟡 MEDIUM PRIORITY IMPROVEMENTS

### 6. Poor UX with alert() Dialogs
**Priority:** MEDIUM
**Status:** ⚠️ Not Fixed
**Files:**
- `admin/JS/add-item.js` (lines 26, 30, 60, 68, 71, 75)
- `admin/JS/remove-item.js` (lines 22, 52, 60, 63, 66)

**Problem:**
Using `alert()` and `confirm()` for user feedback is outdated and blocks the UI.

**Solution:**
Implement toast notifications or inline error messages. Consider using a library like:
- Toastify
- SweetAlert2
- Custom toast component

**Impact:** Low - Better user experience
**Effort:** Medium - Need to implement toast system

---

### 7. Full Page Reload on Success
**Priority:** MEDIUM
**Status:** ⚠️ Not Fixed
**Files:**
- `admin/JS/add-item.js` (line 69)
- `admin/JS/remove-item.js` (line 61)

**Problem:**
`location.reload()` causes unnecessary full page refresh after successful operations.

**Current Code:**
```javascript
if (data.ok) {
   alert("Položka úspěšně přidána ✅");
   location.reload(); // Reload to show updated data
}
```

**Solution:**
Update the DOM directly instead of reloading:
- On add: Call `renderAdmin(updatedData)` or insert new row directly
- On remove: Row is already removed by API success handler

**Impact:** Low - Faster, smoother UX
**Effort:** Medium - Need to update DOM manipulation

---

### 8. No Rate Limiting on Workers
**Priority:** MEDIUM
**Status:** ⚠️ Not Fixed
**Files:**
- `admin/cloudeflare-worker/add-item-worker.js`
- `admin/cloudeflare-worker/remove-item-worker.js`

**Problem:**
Someone with the ADMIN_KEY could spam unlimited requests.

**Solution:**
Add rate limiting in Cloudflare Workers using:
- Cloudflare's built-in rate limiting
- KV storage to track request counts
- Durable Objects for more complex rate limiting

**Impact:** Medium - Prevents abuse
**Effort:** Medium - Requires Cloudflare rate limiting setup

---

### 9. No Input Sanitization
**Priority:** MEDIUM
**Status:** ⚠️ Not Fixed
**Files:**
- `admin/cloudeflare-worker/add-item-worker.js` (lines 133-138)

**Problem:**
User inputs (category, description, itemNumber) aren't sanitized before storage. Could potentially allow malicious content.

**Current Code:**
```javascript
if (!item.category || !item.description) {
   return new Response("Missing required fields: category, description", {
      status: 400,
```

**Solution:**
Add input validation and sanitization:
```javascript
// Sanitize and validate
const sanitizedDescription = item.description.trim().substring(0, 200);
const sanitizedCategory = ["Book", "Equipment", "Other"].includes(item.category) ? item.category : "Other";
```

**Impact:** Low - XSS prevention (already using escapeHtml on display)
**Effort:** Low - Add validation logic

---

## 📋 NICE-TO-HAVE IMPROVEMENTS

### 10. Hardcoded Configuration in Workers
**Priority:** LOW
**Status:** ⚠️ Not Fixed
**Files:**
- `admin/cloudeflare-worker/add-item-worker.js` (lines 44-47)
- `admin/cloudeflare-worker/remove-item-worker.js` (lines 44-47)

**Problem:**
Repository configuration is hardcoded.

**Current Code:**
```javascript
const OWNER = "martinecececek";
const REPO = "3VOM-site";
const BRANCH = "main";
const ITEMS_JSON_PATH = "src/data/items.json";
```

**Solution:**
Move to environment variables for better flexibility:
```javascript
const OWNER = env.GITHUB_OWNER || "martinecececek";
const REPO = env.GITHUB_REPO || "3VOM-site";
```

**Impact:** Low - Better maintainability
**Effort:** Low - Move to env vars

---

## 📊 Progress Tracking

- [ ] Fix ADMIN_KEY exposure (Issue #1)
- [ ] Fix CORS policy (Issue #2)
- [ ] Fix duplicate event listeners (Issue #3)
- [ ] Fix relative path (Issue #4)
- [ ] Standardize ID types (Issue #5)
- [ ] Implement toast notifications (Issue #6)
- [ ] Remove page reloads (Issue #7)
- [ ] Add rate limiting (Issue #8)
- [ ] Add input sanitization (Issue #9)
- [ ] Move config to env vars (Issue #10)

---

## 🎯 Recommended Fix Order

1. **Issue #1** - Fix ADMIN_KEY exposure (CRITICAL SECURITY)
2. **Issue #3** - Fix duplicate event listeners (breaks functionality)
3. **Issue #2** - Fix CORS policy (security)
4. **Issue #4** - Fix relative path (simple fix)
5. **Issue #9** - Add input sanitization (quick security win)
6. **Issue #6** - Implement toast notifications (UX improvement)
7. **Issue #7** - Remove page reloads (UX improvement)
8. **Issue #8** - Add rate limiting (prevents abuse)
9. **Issue #5** - Standardize ID types (consistency)
10. **Issue #10** - Move config to env vars (maintainability)

---

## 📝 Notes

- Current system is functional but has security vulnerabilities
- Focus on security issues (#1, #2) first before deploying to production
- UX improvements (#6, #7) can be done incrementally
- Document any authentication changes thoroughly
