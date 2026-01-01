# PDF Generation Implementation 

## Overview

We're moving from markdown-to-HTML contract/invoice rendering to **Google Docs template-based PDF generation**. This provides:

  - Professional formatting, consistent typography, no CSS/HTML 
  - Proper PDF exports that are easy and quick to produce 

## Next Steps 

  1. Clean up this current document ✅
  2. Fill in gaps from IMPLv1 
     `assets/docs/v4/IMPL_v1_PDF_GENERATION.md`
    - How to template, Google Service Account 
    - Complete API implementation code (`/api/generate-pdf.js`)
    - Webhook integration updates
    - Frontend integration updates
  3. Do the same to v4_UPDATE and leave it sparkling 
     `assets/docs/v4/v4_UPDATE.md`
  4. Reach a point ready for refactoring and testing 

  * **Questions and thoughts to look for while consolidating** 
  - Where is the plan for page design; exactly what files are no longer relevant and which have to be revamped like the HTML templates. Might be in IMPLv1 document but taking note because it feels like it has yet to be mentioned. 
  - File changes mentioned: Webhook Handler: `api/webhook.js` (needs update to trigger PDF generation). Contract Controller: `assets/js/contract-controller.js` (needs update to display PDFs)

--- 

## Implementation Progress & Design Alterations 

### Phase 1: Template Creation
1. Create Google Docs templates with placeholders ✅
2. Get template IDs ✅
3. Store IDs in Vercel environment variables ✅

### Phase 2: Service Account Setup
1. Create Google Cloud project ✅
2. Enable Drive API and Docs API ✅
3. Create service account ✅
4. Grant template access ✅
5. Store credentials in Vercel ✅

### Phase 2.5: Scripts, Pages, Schema Updates Before Testing  

### Phase 3: API Implementation
1. Install `googleapis` npm package
2. Implement `/api/generate-pdf.js` using code from `DIA_BROWSER_IMPLEMENTATION_GUIDE.md`
3. Test with sample JSON

### Phase 4: Integration
1. Update `/api/webhook.js` to trigger PDF generation
2. Update frontend controllers to display PDFs
3. Test end-to-end flow

### Phase 5: Deployment
1. Deploy to Vercel
2. Test with real payment
3. Verify PDFs are generated and accessible

---

## Important Design Alterations From Original Plan 

  1. ~~PDFs Generated on Payment Success: Not on contract signing (ensures invoice reflects actual payment)~~
  User login -> PDF Contract, must read before signing or paying business partnership, scroll-through tracking, option to continue to view Invoice as planned in Agreement then come back and sign, or sign now -> Signing tracked and Checkout Session build from JSON and loads on the spot 
  + The PDFs are part of the experience and a must have first to be able to pay. When a new job JSON is committed, after the Stripe catalog object build and then the state management details are updated, then the automation continues by kicking into generating PDFs. They will then be stored in repo, the JSON tracking updated, and the frontend page will have a modern PDF view from embed. 

  2. ~~Dual Storage: PDFs in Google Drive (live access) + Repository archive (audit trail)~~
  + I don't want to be tapping into more APIs for functionality. Given the PDF need to be made at job JSON commit, we should delete the gDoc after keeping the version we'll serve in the repository. The true forever archive is Stripe. 

  3. ~~Backward Compatible: If PDF not generated, fall back to HTML rendering~~
  + The v4 schema is already drastically changed and idk if you recall the image of the contract in HTML, but a broken site would be better than presenting something that looks like that to clients coming to me for development and design. Fortunately earlier PDF production also helps these shift make more sense. 

---
*Understand our unique architecture and automation stack: `assets/docs/v4/AI_CONTEXT_PRIMER.md`*