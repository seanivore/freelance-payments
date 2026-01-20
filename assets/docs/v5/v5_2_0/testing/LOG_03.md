# Testing Log 03 - v5.2.0 Visual Design & UX Improvements

**Created**: 2026-01-20 
**Last Updated**: 2026-01-20
**Status**: In Progress - Bugs identified, analysis complete

## Logging Instructions for AI Agents

This log tracks bugs and fixes during v5 testing. Follow these conventions:

- **File Naming**: `LOG_XX.md` where XX is the log number (01, 02, etc.)
- **Bug Numbering**: `BUG_XX_YYY` where XX matches log number, YYY is sequential bug count across all v5 logs
- **When starting a new log**: User will provide the last bug number from previous log (e.g., "Last bug was BUG_01_015")
- **Grouping**: Use larger headers (##) for test job file names to group related bugs
- **Content**: Keep entries concise - include user's essential details, expected behavior, actual behavior, and fixes implemented
- **Additional Details**: Log any relevant technical details, console errors, workflow runs, commit hashes, or related context

---

## Test Job: `uid-ovc-774.json`

**Login**: Rose -- art-soul

---

### BUG_03_001 - Background Images Return 404 (Not Copied to Build)

**Date**: 2026-01-20  
**Status**: FIXED  
**Severity**: Medium (visual only, no functional impact)

**Issue**: Background images (`pdf-viewer-bg-art-1.webp`, `pdf-viewer-bg-art-2.webp`, `pdf-viewer-bg-art-3.webp`) return 404 errors in console. URLs like `https://payments.august.style/assets/media/pdf-viewer-bg-art-2.webp` fail to load.

**Expected**: Background art displays on homepage, PDF viewer, and completion pages  
**Actual**: 404 errors, no background images visible

**Root Cause**: 
- `vite.config.ts` uses `viteStaticCopy` plugin to copy static assets to `dist/`
- The `assets/media/` directory is NOT included in the copy targets
- Images exist in source (`assets/media/`) but never copied to build output (`dist/assets/media/`)

**Console Errors**:
```
GET https://payments.august.style/assets/media/pdf-viewer-bg-art-1.webp 404 (Not Found)
GET https://payments.august.style/assets/media/pdf-viewer-bg-art-2.webp 404 (Not Found)
```

**Fix Implemented**: Added `assets/media` to `viteStaticCopy` targets in `vite.config.ts`:
```typescript
{
  src: 'assets/media',
  dest: 'assets'
}
```

**Files Modified**:
- `vite.config.ts`: Added media directory to static copy targets

**Verification**: Build now outputs "Copied 16 items" (was 15) and `dist/assets/media/` contains all background images.

---

### BUG_03_002 - PDF Viewer Too Wide on Mobile

**Date**: 2026-01-20  
**Status**: FIXED  
**Severity**: Medium (UX issue on mobile)

**Issue**: On mobile devices, the PDF viewer extends beyond the screen width. Users cannot see the full width of the PDF and the GateBar doesn't span the full visible area.

**Expected**: PDF should fit within viewport with small padding, allowing full document visibility  
**Actual**: PDF canvas overflows viewport, horizontal scroll required but pinch-zoom shows GateBar not spanning full width

**Images**:
- `IMG-BUG_03_002-mobile-test-1.webp` - Contract view overflow
- `IMG-BUG_03_002-mobile-test-2.webp` - Invoice view showing same issue
- `IMG-BUG_03_002-mobile-test-3.webp` - Zoomed out showing GateBar width issue

**Root Cause**: The `renderPage()` function calculated canvas size based on a fixed scale from config, without considering viewport width. On mobile, this resulted in canvases wider than the screen.

**Fix Implemented**:
1. Updated `renderPage()` to calculate a responsive scale based on viewport width
2. Canvas now fits within `min(window.innerWidth - 16px, 896px)` (max-w-4xl)
3. Added `max-w-full h-auto` classes to canvas elements
4. Added `overflow-hidden` to canvas containers
5. Reduced horizontal padding on mobile (`px-2 sm:px-4`)

**Files Modified**:
- `src/components/PdfViewer.tsx`: Responsive scale calculation and container constraints

---

### BUG_03_003 - Date Picker Calendar Too Wide on Mobile

**Date**: 2026-01-20  
**Status**: FIXED  
**Severity**: Low (workaround available - manual date entry)

**Issue**: When signing contract, the date picker calendar popover extends beyond screen width on mobile, making it difficult to select dates.

**Expected**: Calendar popover fits within mobile viewport  
**Actual**: Calendar overflows, cannot see full week or interact easily

**Images**:
- `IMG-BUG_03_003-mobile-test-1.webp` - Calendar overflow
- `IMG-BUG_03_003-mobile-test-2.webp` - Attempted interaction

**Analysis**: The SignatureModal uses a native `<input type="date">` which on iOS opens the system date picker. The iOS picker was extending beyond the Drawer's visible area.

**Fix Implemented**:
1. Added `max-h-[90vh] overflow-y-auto` to DrawerContent to ensure it doesn't exceed viewport
2. Added horizontal padding (`px-4`) to drawer content container

**Files Modified**:
- `src/components/SignatureModal.tsx`: Added viewport constraints to drawer

---

### BUG_03_006 - Desktop Date Picker Doesn't Open Calendar

**Date**: 2026-01-20  
**Status**: FIXED  
**Severity**: Low (UX/legitimacy issue)

**Issue**: On desktop browsers, the date input field for signing the contract doesn't visually open a calendar picker when clicked. It defaults to "today" which is helpful, but users can't easily see or interact with a calendar to select a different date, reducing the perceived legitimacy of the signing flow.

**Expected**: Clicking the date field should open an interactive calendar picker  
**Actual**: Native `<input type="date">` on desktop requires clicking a small calendar icon; not intuitive

**Root Cause**: Native HTML `<input type="date">` has inconsistent UX across browsers. On Chrome desktop, users must click a small calendar icon inside the input rather than the field itself.

**Fix Implemented**:
1. Replaced native `<input type="date">` with custom Popover + Calendar component
2. Full-width clickable button displays formatted date (e.g., "January 20th, 2026")
3. Calendar icon on right side indicates interactivity
4. Calendar popover opens above the button on click
5. Styled Calendar component with portfolio dark theme colors
6. Calendar auto-closes on date selection

**Files Modified**:
- `src/components/SignatureModal.tsx`: Replaced native input with Popover/Calendar
- `src/components/ui/calendar.tsx`: Added portfolio dark theme styling

---

### BUG_03_004 - Homepage Glow Effect Dim with Delayed Response

**Date**: 2026-01-20  
**Status**: FIXED  
**Severity**: Low (polish issue)

**Issue**: 
1. Mouse-following glow effect is very dim before hovering over login form
2. When cursor moves over form, there's a visible delay before glow brightens
3. Creates jarring, staggered visual effect

**Expected**: 
- Glow should be nearly as bright outside form as inside
- Brightness transition should be immediate/smooth
- Form elements should respond independently based on cursor proximity

**Actual**: 
- Dim glow outside form
- Noticeable delay when transitioning to form hover state
- Entire form lights up at once rather than areas near cursor

**Images**:
- `IMG-BUG_03_004-desktop-test-1.webp` - Dim glow before form hover
- `IMG-BUG_03_004-desktop-test-2.webp` - Brightened state after delay

**Root Cause**: 
- Base intensity was 0.15 (too dim)
- Transition timing was 300ms (too slow, causing perceived delay)
- Jump from 0.15 to 0.3+ was too abrupt

**Fix Implemented**:
1. Increased base glow intensity from 0.15 to 0.35 (always visible)
2. Reduced transition time from 300ms to 100ms (faster response)
3. Added proximity detection (100px around card) for gradual intensity increase
4. Inside card: 0.55, Near card: gradual 0.35-0.55, Far: 0.35
5. Increased glow size from 500px to 600px and improved gradient
6. Reduced blur from 80px to 60px for sharper glow
7. Card shadow now scales smoothly with intensity

**Files Modified**:
- `src/index.tsx`: Updated glow effect logic and styling

---

### BUG_03_005 - JSON State Not Updated After Workflow (BLOCKING)

**Date**: 2026-01-20  
**Status**: FIXED  
**Severity**: **CRITICAL** - Blocks all testing and production use

**Issue**: After completing payment_1 and logging in again, the app routes to contract instead of balance. Console shows all `client_status` timestamps as `null` despite the JSON file in GitHub having correct timestamps.

**Expected**: User should be routed to `balance` section (payment_1 already completed)  
**Actual**: Routes to `contract`, console shows all null timestamps

**Console Log**:
```
✅ Loaded job data for uid-ovc-774: {logged_in: null, contract_signed: null, invoice: null, payment_1: null, balance: null, …}
```

**Actual JSON State** (in GitHub repo):
```json
"client_status": {
    "logged_in": "2026-01-20T09:23:34.182Z",
    "contract_signed": "2026-01-20T09:25:02.616Z",
    "invoice": "2026-01-20T09:26:04.583Z",
    "payment_1": "2026-01-20T09:26:04.584Z",
    "balance": null,
    "payment_2": null
}
```

**Related Prior Bugs**: BUG_01_011, BUG_01_013, BUG_01_014 (all marked "Fixed" but same issue persists)

**ROOT CAUSE IDENTIFIED**:

The `user-exit-events.yml` workflow commits with `[skip ci]` flag:
```yaml
git commit -m "Update user behavior stats [skip ci]"
```

This prevents Vercel from redeploying after the workflow updates the JSON file. The sequence:

1. User makes payment, workflow runs
2. Workflow updates JSON in GitHub with timestamps
3. Commit includes `[skip ci]` - Vercel does NOT redeploy
4. User returns to site
5. Vercel serves OLD JSON from last "real" deployment (before timestamps were added)
6. App sees all `null` values, routes to contract

**Evidence**:
```bash
$ git log --oneline -1 -- assets/jobs/uid-ovc-774.json
580b24c Update user behavior stats [skip ci]

$ git show 580b24c --format="%ci" --no-patch
2026-01-20 09:26:50 +0000
```

The JSON was updated at 09:26:50 but Vercel never redeployed because of `[skip ci]`.

**Why [skip ci] Was Used**: Likely to prevent infinite deployment loops (workflow commits → triggers deploy → triggers workflow → etc.)

**Fix Options**:

1. **Remove `[skip ci]`** - Simple but may cause deployment loops
2. **Trigger Vercel deploy hook** - Add step to workflow that calls Vercel deploy hook after commit
3. **Move JSON to API route** - Serve JSON dynamically instead of static file (more complex)
4. **Use Vercel KV/Edge Config** - Store state in Vercel's edge storage (requires architecture change)

**Fix Implemented**: 
1. Removed `[skip ci]` from commit message so Vercel deploys on push
2. Added explicit Vercel deploy hook trigger as backup after successful push
3. Workflow now signals `NEEDS_DEPLOY=true` after push and triggers hook

**Files Modified**:
- `.github/workflows/user-exit-events.yml`: 
  - Removed `[skip ci]` from commit message
  - Added `NEEDS_DEPLOY` environment flag
  - Added "Trigger Vercel Deploy" step that calls deploy hook

**Setup Required**:
1. In Vercel Dashboard → Project Settings → Git → Deploy Hooks
2. Create a hook named "user-events" for the `freelance-payments` branch
3. Copy the hook URL and add as GitHub secret `VERCEL_DEPLOY_HOOK`

**Note**: Even without the secret configured, removing `[skip ci]` means Vercel will deploy on push. The hook is a reliable backup.

---

### BUG_03_007 - PDF Viewer Toolbar Styling Polish

**Date**: 2026-01-20  
**Status**: FIXED  
**Severity**: Low (visual polish)

**Issue**: The GateBar toolbar in the PDF viewer needed visual refinement for a more polished, floating appearance with better depth and semi-transparency.

**Images**:
- `IMG-BUG_03_006-before-desktop_view-1.webp` - Before toolbar styling
- `IMG-BUG_03_006-before-desktop_view-2.webp` - Before on desktop
- `IMG-BUG_03_006-before-mobile_view-1.webp` - Before on mobile
- `IMG-BUG_03_006-after-desktop_view-1.webp` - After CSS fixes applied

**CSS Changes Applied** (user-specified via Inspector):

1. **Background opacity**: Changed from `bg-portfolio-bg-dark/95` to `bg-portfolio-bg-dark/80`
2. **Removed backdrop blur**: Removed `backdrop-blur-sm` class (cleaner semi-transparent look)
3. **Border styling**: Changed from `border-b border-portfolio-border` to:
   - `border-b-2` (2px width)
   - `borderColor: 'rgb(192 189 189 / 34%)'` (lighter, lower opacity)
4. **Drop shadow**: Added `filter: drop-shadow(2px 4px 6px #0f0f0f47)` for floating effect

**Files Modified**:
- `src/components/GateBar.tsx`: Toolbar styling only

---

## Summary

| Bug | Severity | Status | Root Cause |
|-----|----------|--------|------------|
| BUG_03_001 | Medium | **FIXED** | `assets/media` not in Vite copy targets |
| BUG_03_002 | Medium | **FIXED** | PDF canvas width not mobile-constrained |
| BUG_03_003 | Low | **FIXED** | Drawer viewport constraints |
| BUG_03_004 | Low | **FIXED** | Glow effect timing/intensity |
| BUG_03_005 | **CRITICAL** | **FIXED** | `[skip ci]` prevents Vercel redeploy |
| BUG_03_006 | Low | **FIXED** | Native date input UX inconsistency |
| BUG_03_007 | Low | **FIXED** | Toolbar styling refinements |

---

## All Fixes Implemented

1. **BUG_03_001**: Added `assets/media` to Vite static copy config
2. **BUG_03_002**: Responsive PDF scale calculation based on viewport width
3. **BUG_03_003**: Added viewport constraints to SignatureModal drawer
4. **BUG_03_004**: Improved glow effect intensity, timing, and proximity detection
5. **BUG_03_005**: Removed `[skip ci]` and added Vercel deploy hook trigger
6. **BUG_03_006**: Replaced native date input with styled Popover/Calendar component
7. **BUG_03_007**: Updated toolbar styling with semi-transparency, refined border, and drop shadow

## Next Steps

1. Push all changes: `git add . && git smart-push`
2. (Optional) Configure Vercel deploy hook secret (`VERCEL_DEPLOY_HOOK`) for extra reliability
3. Create new test job and run full end-to-end test
4. Verify all fixes on desktop and mobile
