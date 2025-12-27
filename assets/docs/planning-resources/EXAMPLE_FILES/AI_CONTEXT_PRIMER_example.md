# Single-JSON Portfolio Architecture
*Complete reference for AI assistants working on august.style*

**Live Site:** [august.style](https://august.style)

  * **Purpose:** This document provides everything a new AI instance needs to understand and work on this project effectively. It also serves as the primary README for this repository. Read this first before making any changes.

---

## Table of Contents

  1. [Project Overview](#project-overview)
  2. [Recent Updates (November 2025)](#recent-updates-november-2025)
  3. [Architecture Explained](#architecture-explained)
  4. [How to Run & Test Locally](#how-to-run--test-locally)
  5. [File Structure & Key Files](#file-structure--key-files)
  6. [Design System & Styling](#design-system--styling)
  7. [Adding New Projects](#adding-new-projects)
  8. [Tag System & Navigation](#tag-system--navigation)
  9. [Mobile-First Design Principles](#mobile-first-design-principles)
  10. [Common Pitfalls & Important Notes](#common-pitfalls--important-notes)
  11. [Deployment](#deployment)
  12. [About the Creator & Project](#about-the-creator--project)

---

## Recent Updates (November 2025)

### Design & UX Refinements

  * **Homepage Tile Interactivity**
    + All images now clickable (not just text bar)
    + Added decorative line trio pointing to section names
    + Improved visual hierarchy with color accents

  * **Project Counter Styling**
    + Fixed oversized counter display on section pages
    + Now matches homepage tile styling (smaller, color-differentiated)
    + Format: "Section Projects (count)" with distinct styling

  * **Filter Navigation Bar**
    + Condensed monospace font for better thumb-friendliness
    + Removed background and border for cleaner look
    + Added 5rem gradient shadows on both sides
    + Added vertical bars creating "rolling into slit" effect
    + Significantly improved mobile usability

  * **Navigation Scroll Behavior**
    + Fixed About/Contact links scrolling incorrectly from section/entry pages
    + Adjusted scroll-padding-top from 5rem to 6rem
    + Native browser hash navigation now works perfectly

  * **Project URL Display**
    + New `project_url_text` field for cleaner URL presentation
    + URLs now smaller, centered, and stacked vertically
    + Both Project URL and GitHub URL have consistent styling

### Technical Improvements

  * **Tile System Refinements**
    + Homepage thumbnail selection reverted to pure random (12 per section)
    + When sections have <10 entries, distributes equally from all entries
    + Fixed tile layout bleeding on tablet devices
    + Optimized tile-text-area positioning (width: 90%, height: 4rem)
    + Tile-gallery position corrected to relative (was absolute)

  * **Responsive Layout Updates**
    + Mobile tiles properly bleed screen with negative margins
    + Tablet max-width optimized (48rem for tiles, 40rem for homepage)
    + Added proper spacing between video containers and thumbnail images
    + Grid-related layout cleaned up (removed unnecessary overflow/scroll)

  * **Schema Updates (v3.2)**
    + Added `project_url_text` field for display-friendly URLs
    + Improved JSON formatting with proper indentation and line breaks
    + Enhanced readability for human editors

---

## Project Overview

### What This Is

  * **A portfolio website (august.style) that displays projects across web, print, digital, and video using an innovative architecture** 
  
    + Portfolio pages render from just 2 HTML templates
    + All content dynamically loaded from JSON files
      - No build process 
      - No frameworks 
      - Pure HTML/CSS/JS 
    + Hosted on GitHub Pages with clean URLs

### The Core Innovation

  * **Traditional portfolios require maintaining HTML files for every entry, but this architecture is novel**

    + 2 HTML templates 
      - `section.html`
      - `entry.html`
      - homepage at `index.html`
    + As many JSON files as needed in one location 
      - Just one per project
      - `assets/entries/...`
    + SPA-style routing via 404 redirect trick
    + Dynamic filtering with tag-based navigation

### Message & Purpose

  * **Problem:** Economic uncertainty + AI integration = organizational downsizing
  * **Solution:** Generalist portfolio to showcase cross-functional "downsizing-friendly" capabilities 

    + **UX Goal:** Hiring managers can preview many, many projects without excessive clicking
      - Swipe tile thumbnail slideshow 
      - Text cycles with images to tell full story 
      - Visual-first magazine aesthetic

---

## Architecture Explained

### The Clever Part: Hybrid Routing

  * **This project uses three routing strategies simultaneously**

#### 1. Jekyll via GitHub Pages for Clean URLs 

```
Traditional: august.style/entry.html
Our result:  august.style/web/html-css-js/project-name
```

  + Jekyll removes `.html` extensions automatically
  + We leverage this WITHOUT using Jekyll templates

#### 2. SPA 404 Routing Trick for Dynamic Loading

```
User visits: august.style/web/html-css-js/slug
↓
No file exists → GitHub Pages serves 404.html
↓
404.html redirects to: entry.html (preserving URL)
↓
JavaScript loads: Correct JSON based on URL path
```

  * **This is unconventional but brilliant** 
    + We're making GitHub Pages think it's serving static files 
    + While actually running a mini single-page application 

#### 3. Hash Routing for Dynamic Filtering

```
august.style/web#tags=copywriting+illustration
```

  + Base page loads (`section.html`)
    - Hash changes don't trigger page reload
    - JavaScript reads hash, filters tiles dynamically

### How It Actually Works

  * **One template, many pages**

  + `section.html` handles 
    - `/web` → Filter to section="Web"
    - `/web/html-css-js` → Filter to section="Web" AND subsection="HTML/CSS/JS"
    - `/projects` → Show everything
  + Plus hash filtering: `#tags=copywriting`
    - Tiles shuffled every reload 
    - Filters remain applied

  * **`entry.html` handles**
  
    + `/web/html-css-js/slug-project-name` → Load correct JSON, render page

  * **How does it know which JSON to load?**
  
    + `manifest.json` 
      - Maps URLs to JSON files
      - Auto-generated by scanning all JSON files

```json
{
  "entries": {
    "web/html-css-js/slug-project-name": "assets/entries/uid-abc-123.json"
  }
}
```

### Routing Flow Example

  * **User visits** `august.style/web/html-css-js/saas-product`
    
    1. GitHub Pages looks for file
       - Checks: `/web/html-css-js/saas-product.html` → Not found
       - Checks: `/web/html-css-js/saas-product/index.html` → Not found
       - Serves: `404.html`

    2. `404.html` analyzes URL

        ```javascript
        const segments = path.split('/').filter(Boolean);
        if (segments.length >= 3) {
            // Entry page
            sessionStorage.setItem('entryPath', path);
            window.location.replace('/entry.html');
        } else {
            // Section page
            sessionStorage.setItem('sectionPath', path);
            window.location.replace('/section.html');
        }
        ```

    3. `entry.html` loads

        ```javascript
        const path = sessionStorage.getItem('entryPath');
        const manifest = await fetch('/manifest.json').then(r => r.json());
        const jsonPath = manifest.entries[path];
        const data = await fetch(jsonPath).then(r => r.json());
        // Populate page with data
        ```

    4. Result
       - URL stays: `august.style/web/html-css-js/saas-product` ✅
       - Content from: `uid-abc-123.json` ✅
       - User sees: Beautiful project page ✅

---

## How to Run & Test Locally

### Local Development Server

  * **IMPORTANT** 
  
    + Must use a server 
      - Not `file://` 
      - GitHub Pages 404 routing doesn't work locally 
      - Use URL parameters

```bash
# Start local server
python3 -m http.server 5500 --bind 127.0.0.1
```

### Testing Different Page Types

  * **Homepage**

```
http://localhost:5500/
```

  * **Section Pages**

```
http://localhost:5500/section.html?section=web
http://localhost:5500/section.html?section=print
http://localhost:5500/section.html?section=web&subsection=html-css-js
```

  * **Entry Pages**

```
http://localhost:5500/entry.html?path=web/html-css-js/project-slug
http://localhost:5500/entry.html?path=web/webflow/automated-shop
```

### URL Parameter Pattern

  * **Controllers check for parameters FIRST**

```javascript
// section-controller.js
const urlParams = new URLSearchParams(window.location.search);
const section = urlParams.get('section');  // Localhost testing
if (!section) {
  // Production: parse from pathname
}

// entry-controller.js
const pathParam = urlParams.get('path');  // Localhost testing
if (!pathParam) {
  // Production: get from sessionStorage
}
```

### Testing Workflow

  1. **Start server** on port 5500
  2. **Test section pages** with `?section=web` parameter
  3. **Test entry pages** with `?path=web/html-css-js/slug` parameter
  4. **Test filtering** by clicking tags (hash-based, works locally)
  5. **Test tile shuffling** by reloading pages multiple times

---

## File Structure & Key Files

```
/Users/seanivore/Development/360-design/

├── index.html              # Homepage (Projects, About, Contact)
├── section.html            # Handles ALL section/subsection pages
├── entry.html              # Handles ALL individual project pages
├── 404.html                # SPA routing helper
├── styles.css              # Complete site styling
├── generate_manifest.py    # Auto-generates manifest.json

├── assets/
│   ├── js/
│   │   ├── data-loader.js           # Loads JSON data
│   │   ├── tile-renderer.js         # Creates tile HTML
│   │   ├── filter-controller.js     # Tag filtering logic
│   │   ├── section-controller.js    # Section page controller
│   │   ├── entry-controller.js      # Entry page controller
│   │   ├── homepage-controller.js   # Homepage controller
│   │   ├── manifest.json            # URL → JSON mapping
│   │   └── placement.json           # Config (toggle tags, SEO)
│   │
│   ├── entries/
│   │   └── uid-*.json               # 15+ project entries
│   │
│   ├── media/
│   │   └── [project-folders]/       # Images, videos
│   │
│   └── docs/
│       ├── _entry_template.json     # Template for new projects
│       ├── ADD_NEW_PROJECT.md       # How to add projects
│       └── AI_CONTEXT_PRIMER.md     # This file
```

### Key JavaScript Modules

  * **`data-loader.js`**

    - Loads manifest.json
    - Fetches project JSON files
    - Normalizes URLs (`normalizeForURL()` function)
    - Case-insensitive filtering

  * **`tile-renderer.js`**

    - `renderSectionTile()` - tiles for section pages
    - `renderHomepageTile()` - tiles for homepage
    - Magazine aesthetic: NO title/subtitle on section tiles

  * **`filter-controller.js`**

    - Tag activation/deactivation
    - Sticky filter logic (main filter can't be removed)
    - DOM reordering (active tags move to left)

  * **`section-controller.js`**
    
    - Parses URL (section/subsection)
    - Loads matching projects
    - Handles tag filtering
    - Tile shuffling on reload

  * **`entry-controller.js`**

    - Parses entry URL path
    - Loads project JSON
    - Populates page content
    - Related posts algorithm (6-hour rotation)

  * **`homepage-controller.js`**
    
    - Randomly selects 1 project per section
    - Renders 4 section tiles
    - Shuffles tile order on reload
    - Count badges show project totals

---

## Design System & Styling

### Color Scheme is Dark Mode Only 

```css
:root {
  /* Background dark and lighter match charcoal */
  --color-bg-primary: #1f1f1f;
  --color-bg-secondary: #363635;

  /* Tile's dark text area */
  2 px solid image stroke: ##ffffff;
  --color-bg-dark: #0f0f0f;  /* Text areas */

  /* Text */
  --color-text-primary: #EBEBEB;
  --color-text-secondary: #D7CDCC;

  /* Accent */
  --color-accent: #9C528B;
  --color-accent-active: #7d4070;

  /* Borders & Shadows */
  --color-border: #595A4A;
  --tile-shadow: 0 2px 8px rgba(0, 0, 0, 0.4),
                 0 4px 16px rgba(0, 0, 0, 0.3);
}
```

### Design Principles

  * **Magazine Aesthetic**
    
    - Visual-first design
    - Minimal text on tiles
    - Clean, timeless look
    - No trendy effects

  * **Mobile-First**
    
    - All interactions work on touch
    - No hover-only functionality
    - Smooth transitions (300ms)
    - Sequential element fade-in

  * **Sharp & Realistic**

    - **Tiles:** Sharp corners (border-radius: 0)
    - **Shadows:** Realistic, layered depth
    - **Typography:** Clear hierarchy
    - **Spacing:** Generous whitespace

### Typography Scale

```css
/* Homepage */
.section-heading {
  font-size: 2.5rem;    /* H1 equivalent */
  font-weight: 700;
}

/* Entry Pages */
.entry-header h1 {
  font-size: 3rem;      /* page_title */
  font-weight: 700;
}

.entry-header h2 {
  font-size: 1.5rem;    /* page_subtitle */
  font-weight: 400;
}

.content-text h3 {
  font-size: 1.75rem;   /* Section headings */
  font-weight: 600;
}

/* Tags & Breadcrumbs */
.breadcrumbs {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Tile Types

  * **Homepage Tiles**

    - Oversized thumbnail gallery (all images clickable)
    - Project count badge 
    - Decorative line trio pointing to section name
    - Links to section pages
    - Swipe cycles images
    - Text container: max-width 17rem, aligned right

  * **Section Tiles**

    - Similar to homepage 
    - Without project count badge or section 
    - NO title/subtitle (magazine aesthetic)
    - Shows teaser text that cycles with images
    - Links to entry pages
    - Text area: width 90%, height 4rem, self-centered
    - Gallery position: relative (not absolute)

### Filter Navigation Styling

  * **Tag Filter Bar (Section Pages)**

    - Condensed monospace font for thumb-friendliness
    - No background or border (clean, minimal)
    - Minimal left/right padding
    - Vertical bars (2-3px) on both sides
    - 5rem gradient shadows (left and right)
    - "Rolling into slit" visual effect
    - Subliminal scroll cue for users

```css
.tag-filters-wrapper::before, .tag-filters-wrapper::after {
    width: 5rem;  /* Gradient shadow width */
    pointer-events: none;
    z-index: 2;
}
```

  * **Project Counter Display**

    - Smaller, color-differentiated count
    - Format: "Section Projects (count)"
    - Matches homepage tile counter styling
    - Not oversized like heading text

### Spacing System

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;
}
```

---

## Adding New Projects

### Quick Reference

  1. **Generate entry_id:** Run `uid` command, add underscore prefix
  2. **Choose section:** Web, Print, Digital, or Video
  3. **Create subsection** (if needed) - check existing ones first
  4. **Write slug:** Clean, no extension (e.g., `project-name`)
  5. **Fill JSON** using template at `assets/docs/_entry_template.json`
  6. **Save to** `assets/entries/uid-xxx-###.json`
  7. **Regenerate manifest:** `python3 generate_manifest.py`

### JSON Structure (Schema v3.2)

```json
{
"categorization": {
    "entry_id": "uid-abc-123",
    "placement": {
        "section": "Web",              // Capitalized!
        "sub_section": "HTML/CSS/JS",  // Has slashes!
        "slug": "project-name"         // Clean, no .html
    },
    "tagging": {
        "technology": ["JavaScript", "CSS Animation"],
        "media": ["Portfolio Website"],
        "role": "Creative Technologist",  // STRING (v3.1)
        "skill": ["Landing Page Design"]
    }
},
"content": {
    "media": {
        "video_embed": "...",
        "video_alt_text": "...",                  // v3.1
        "thumbnail_images": ["/assets/media/..."],
        "thumb_slideshow_alt_text": "...",        // v3.1
        "page_imagery": ["/assets/media/..."],    // v3.1
        "page_image_group_alt_text": "..."        // v3.1
    },
    "assets": {
        "project_url_text": "august.style/etc",   // v3.2 - Display text for project URL
        "project_url": "https://...",             // v3.1 - Full project URL (optional)
        "github_repository": "https://github..."  // v3.1 - GitHub repo URL (optional)
    },
    "teaser_copy": {
        "seo_title": "...",
        "seo_description": "...",
        "page_title": "...",
        "page_subtitle": "...",
        "breadcrumb": "...",
        "tile_text": ["...", "..."]  // Multiple lines
    },
    "page_copy": {
        "pattern": "The challenge or context...",
        "action": "What was done...",
        "measured": "Results and impact..."
    }
}
}
```

### Schema v3.2 Changes *November 2025*

  * **What's new in v3.2:** 

    1. Added `project_url_text` field in assets section
       - Displays cleaner, shortened URL text on entry pages
       - Example: "august.style/project" instead of full URL
       - Optional field (not all projects need external URLs)
    2. Improved JSON formatting
       - Added line breaks between major objects
       - Larger, consistent indentation
       - Better readability for human editors
    3. Enhanced URL display styling
       - Both project_url and github_repository shown smaller
       - Centered and stacked vertically
       - Consistent card-style presentation 

  * **Changed from v2.1:**

    1. `role` is now STRING (not array) - single role per project
    2. Added `video_alt_text` - accessibility for video embeds
    3. Changed `thumbnail_alt_text` to `thumb_slideshow_alt_text` - clarity
    4. Added `page_imagery` array - additional on-page images
    5. Added `page_image_group_alt_text` - accessibility
    6. Added `project_url` - external project links
    7. Added `github_repository` - GitHub repo links

### Important to Keep JSON Human-Readable

  * **DO NOT "fix" the capitalization! This is intentional**

```json
"section": "Web"              // ← NOT "web"
"sub_section": "HTML/CSS/JS"  // ← NOT "html-css-js"
"role": "Creative Technologist" // ← NOT "creative-technologist"
```

  * **Why? These values display on pages. JavaScript normalizes them for URLs**

```javascript
function normalizeForURL(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-');
}
// "HTML/CSS/JS" → "html-css-js"
```

  * **Benefits**

    - JSON readable by humans
    - Values display nicely on pages
    - URL logic centralized in one function
    - Change URL format without touching 50+ JSONs

---

## Tag System & Navigation

### Three Types of Tags

  1. Placement Tags (in JSON `categorization.placement`)
    
     - `section` - Web, Print, Digital, Video (4 total)
     - `sub_section` - Created as needed (e.g., Webflow, Framer)

  2. Contextual Tags (in JSON `categorization.tagging`)
    
     - `technology` - Tools, frameworks, languages used
     - `media` - Where project lived (Website, Social Media, etc.)
     - `role` - Single role for this project (STRING, v3.1)
     - `skill` - Other relevant skills

  3. Toggle Tags (defined in `placement.json`)
  
     - Strategic tags shown ONLY on section-type pages
     - Guide users toward key portfolio content
     - Examples: AI, Creative, Social Media, Strategy, Design

### Tag Display Rules

  * **Section Pages**

   + Section-type filtered (e.g., `/web`)

```
Order: toggle_tags → sub_section → role
Shows: Only projects from that section
Main filter: "WEB" as heading (not in tag list)
```

   + Click-through filtered** (e.g., clicked "Copywriting" tag)

```
Order: section → sub_section → role → contextual_tags
Shows: ALL projects with that tag (across all sections)
Main filter: "COPYWRITING" as heading
NO toggle tags shown
```

  * **Entry Pages**
  
    + Top Layout: Breadcrumbs (left) + Tags hover card (right)
      - Breadcrumbs: `section › sub_section › breadcrumb` (clickable)
      - Tags card: `technology`, `media`, `skill` ONLY (comma/bullet separated)
      - Max-width: 400px
      - Hover: Subtle lift effect

  * **What's NOT in tags card**
  
    - `section` - shown in breadcrumbs
    - `sub_section` - shown in breadcrumbs
    - `role` - displayed as H3 heading in content

  * **Bottom Layout:** Repeat of top layout for UX flow

### Sticky Filter Logic

  * **Main filter cannot be removed:**
  
    - It's displayed as heading (not in tag list)
    - Other tags can be activated/deactivated
    - Reload maintains filters (stored in URL hash)
    - Tile order still shuffles on reload

### Tag Creation Protocol

  * **Before adding new tags**

    1. Check `placement.json > active_tags > contextual_tags`
    2. Use existing tags when possible
    3. Prefer short, versatile tags over long specific ones
    4. Ensure no duplicate concepts (e.g., don't add "UI Design" if "Design" exists)

  * **Tag Strategy**

    - Combine multiple short tags rather than one long tag
    - Creates more overlap between projects
    - Keeps total tag count manageable
    - More versatile for hiring manager searches

---

## Mobile-First Design Principles

### Core Rules

  1. No Hover-Only Interactions
     
     + Everything must work on touch
     + Use `:active` for press states
     + Micro-interactions on tap/click

  2. Smooth Transitions
    
     + 300ms duration
     +  `cubic-bezier(0.4, 0, 0.2, 1)` easing
     +  Sequential element fade-in

  3. Touch-Friendly Targets 
     
     + Minimum 44x44px touch areas
     + Adequate spacing between interactive elements
     + Clear visual feedback on tap

  4. Responsive Strategy
  
     + Mobile: Single column layout
     + Tablet: Transitions smoothly
     + Desktop: 2-column grids, max-width centering

### Breakpoints

```css
/* Mobile-first (default: 375px+) */

@media (min-width: 768px) {
  /* Tablet */
}

@media (min-width: 1024px) {
  /* Desktop */
}
```

### Responsive Layout Behavior

  * **Mobile (< 768px)**

    + Tiles bleed full screen width (100vw)
    + Negative margins compensate for container padding
    + Single column layout
    + Homepage tiles optimized for portrait orientation

```css
@media (max-width: 47.9375rem) {
    .tile {
        width: 100vw;
        max-width: 100vw;
        margin-left: calc(-1 * var(--space-md));
        margin-right: calc(+1 * var(--space-md));
    }
}
```

  * **Tablet (768px - 1024px)**

    + Tiles constrained to prevent bleeding
    + Max-width: 48rem for section tiles
    + Max-width: 40rem for homepage tiles
    + Centered layout with proper margins

```css
@media (min-width: 48rem) and (max-width: 63.9375rem) {
    .tile {
        max-width: 48rem;
    }
    .tile-homepage {
        max-width: 40rem;
        width: 100%;
    }
}
```

  * **Desktop (> 1024px)**

    + 2-column grid layouts where appropriate
    + Max-width centering for readability
    + Related posts grid optimized (max-width: 110rem)
    + Generous whitespace

### Tile Interactions

  * **Image Swipe**
    
    + Simple hidden overflow 
    + Long single row of 16:9 thumbnail images
    + All images clickable on homepage tiles
    + Click-through to section or entry pages

  * **Text Cycling**    *<-!- This needs to be re-added!*
  *Removed because coded gesture wasn't reliably functional* 
  
    + Syncs with image swipe 
    + Cross-fade animation
    + Matches image timing

  * **Tag Filtering**
  
    + Tap to activate
    + Tap again to turn off 
    + Tap other tag to turn off 
    + Tiles re-render with smooth transitions
    + Smooth 300ms transitions

---

## Common Pitfalls & Important Notes

### DO NOT "Fix" These Things

  1. Capitalization in JSON

```json
"section": "Web"  // ← Correct (displays on page)
NOT: "web"        // ← Wrong
```

  2. Spaces and Slashes in JSON

```json
"sub_section": "HTML/CSS/JS"  // ← Correct
NOT: "html-css-js"            // ← Wrong
```

  3. Role as String (v3.1) 

```json
"role": "Creative Technologist"  // ← Correct (single string)
NOT: ["Creative Technologist"]   // ← Wrong (was array in v2.1)
```

### Common Mistakes

  1. Testing Without Server

     + ❌ Opening `file:///index.html` won't work
     + ✅ Use `python3 -m http.server 5500`

  2. Forgetting URL Parameters for Local Testing
  
     + ❌ `http://localhost:5500/section.html` (breaks on reload)
     + ✅ `http://localhost:5500/section.html?section=web`

  3. Hardcoding Values 
  
     + ❌ `const sections = ['Web', 'Print', 'Digital', 'Video'];`
     + ✅ Load from manifest.json dynamically

  4. Breaking Normalization 
  
     + ❌ Creating new normalization functions
     + ✅ Use `DataLoader.normalizeForURL()` everywhere
     
  5. Missing Alt Text
     
     + ❌ Leaving alt text fields empty
     + ✅ Add descriptive alt text for accessibility

### Architecture-Specific Notes

  * **Manifest Generation**
  
    + Run `python3 generate_manifest.py` after adding/modifying entries
      - Commit updated manifest.json
      - Don't manually edit manifest.json

  * **404 Routing**

    + Only works in production (GitHub Pages)
      - Use URL parameters for local testing
      - Don't try to test 404 routing locally

  * **Related Posts**
  
    + Uses 6-hour time seed (not daily)
      - Shows 5 posts (not 3)
      - Deterministic random using seededRandom()
      - Consistent within 6-hour window

  * **Tag Matching**

    + Case-insensitive
      - Partial string matching for toggle tags
      - "Design" matches "Graphic Design", "Print Design", etc.

---

## Deployment

### Pre-Deployment Checklist

  - [ ] Generate manifest.json (`python3 generate_manifest.py`)
  - [ ] Test all page types locally
  - [ ] Verify tag filtering works
  - [ ] Check responsive breakpoints
  - [ ] Validate all JSON files
  - [ ] Test entry pages load correctly
  - [ ] Verify images/videos load

### Deployment Process

```bash
# Create feature branch
git checkout -b feature-name

# Make changes, test locally
git add .
git commit -m "Description

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin feature-name

# GitHub Pages auto-deploys from main/master
# Merge feature branch via PR when ready
```

### Post-Deployment Testing

  1. Visit `www.august.style`
  2. Test homepage tiles link correctly
  3. Click section tiles → `/web`, `/print`, etc.
  4. Click project tiles → `/web/html-css-js/project-name`
  5. Test tag filtering on section pages
  6. Test related posts on entry pages
  7. Test breadcrumb navigation
  8. Verify all images/videos load
  9. Test on mobile device
  10. Check responsive breakpoints

---

## Quick Start for New AI Instances

  * **If you're a new AI working on this project**

    1. Read this entire document first
    2. Run local server `python3 -m http.server 5500`
    3. Test homepage `http://localhost:5500/`
    4. Test section `http://localhost:5500/section.html?section=web`
    5. Test entry `http://localhost:5500/entry.html?path=web/html-css-js/slug`
    6. Review key files
       + `assets/docs/_entry_template.json` - JSON structure
       + `assets/js/placement.json` - Site configuration
       + `styles.css` - Design system
    7. Before making changes
       + Understand the routing architecture
       + Don't "fix" intentional design choices
       + Test locally before pushing

  * **For AI Agents using MCP (Model Context Protocol)**

    + This document references the Filesystem MCP for file access
    + Paths are provided for agents working in environments like Claude Desktop
    + Regular developers can access files normally through their IDE/editor
    + Use `Filesystem:read_file` or `Filesystem:edit_file` for MCP-based workflows
    + Human developers: just open files normally!

  * **Remember that this architecture is unconventional but intentional** 
  
  + If something looks "wrong" like capitalization, routing, tag structure 
  + Read this document first before changing it 

---

### Technology Stack

This portfolio demonstrates:
- Pure HTML/CSS/JS (no framework overhead)
- Single-JSON architecture (infinite scalability)
- Jekyll on GitHub Pages (clean URLs, free hosting)
- Mobile-first responsive design
- Accessible, semantic markup
- Git version control with detailed documentation

**Philosophy:** "Unconventionally smart" solutions that leverage existing tools creatively rather than reinventing wheels. Emphasis on maintainable code, clear architecture, and user experience details.

---

*Document created: 2025-10-25*
*Last updated: 2025-11-14*
*For project: Creative Generalist Portfolio (august.style)*
*Architecture by: Sean August Horvath + Claude Sonnet 4.5*
