# v5.2.0 Visual Design Updates - Changelog

**Started**: 2026-01-20
**Status**: In Progress

---

## Overview

Comprehensive visual design overhaul implementing portfolio-consistent aesthetics with:
- Dark theme with accent colors (mauve/blue/terracotta)
- Cursor-following glow effects
- Abstract background art
- AgencyFB typography
- Refined UX across all views

---

## Changes Log

### Design System Foundation
- [x] Extended `src/index.css` with design tokens and AgencyFB font-face
- [x] Extended `tailwind.config.js` with portfolio color palette

### Utility Components
- [x] Created `src/components/BackgroundArt.tsx`
- [x] Created `src/hooks/useMouseGlow.ts`
- [x] Created `src/components/ui/drawer.tsx` (shadcn/ui Drawer using vaul)

### Homepage/Login
- [x] Redesigned with background art and mouse glow effect
- [x] Polished form styling with AgencyFB headings
- [x] Glow intensity increases near card edges

### PDF Viewer
- [x] Floating paper effect with off-white background (#faf9f6)
- [x] Background art visible through shaded margins
- [x] Vignette overlay for focus (left/right gradients)
- [x] Removed old header, GateBar now sticky at top

### GateBar
- [x] AgencyFB typography for messaging
- [x] Download icon always present (subtle, no text)
- [x] Context-aware copy per section
- [x] "Sign Contract" / "Confirm & Continue to Payment" buttons

### Signature Modal
- [x] Converted to shadcn/ui Drawer (bottom slide-up)
- [x] **REMOVED pen canvas** (see Deferred Features below)
- [x] Kept legal name + date inputs only
- [x] Legal disclaimer text added

### Payment/Checkout Views
- [x] Background art layer
- [x] Refined loading states with spinner
- [x] User-friendly error messaging
- [x] Stripe appearance configured to match theme

### Completion Views
- [x] Removed admin/developer details (Payment Intent ID, status)
- [x] Warm, professional messaging
- [x] Explicit download emphasis (final opportunity)
- [x] Warning about potential session expiration in completion2

### App Layout
- [x] Removed fixed header (views handle their own backgrounds)
- [x] Smooth view transitions with animate-fade-in-up
- [x] Platform-styled loading states with mauve spinner

---

## Deferred Features

### Pen Signature Canvas

**Status**: Removed in v5.2.0, planned for future implementation

**Reason**: The pen-signing code existed but was never fully implemented with proper UX flow. There was no visual confirmation that the signature was added to the PDF, which would confuse users.

**Future Implementation Plan**:
1. Visual preview showing signature placement on PDF before confirming
2. Clear confirmation dialog/animation that signature was embedded
3. Option to re-sign if user is unhappy with result
4. Consider showing a "signed" watermark or indicator on the PDF view after signing

**Files affected**:
- `src/components/SignatureModal.tsx` - Canvas code removed
- `src/components/PdfViewer.tsx` - `embedSignature()` function exists but not called
- `src/lib/pdf-utils.ts` - `dataURLToUint8Array()` helper exists for future use

---

## Issues Encountered

*(Will be updated during implementation)*

---

## Testing Notes

- Must test end-to-end (gated flow requires job entry)
- Push to live via `git add . && git smart-push`
- Test sequence: Login -> Contract -> Invoice -> Payment1 -> Completion1 -> Balance -> Payment2 -> Completion2

---

## Files Modified

1. `src/index.css`
2. `tailwind.config.js`
3. `src/index.tsx`
4. `src/App.tsx`
5. `src/components/PdfViewer.tsx`
6. `src/components/PdfLoader.tsx`
7. `src/components/GateBar.tsx`
8. `src/components/SignatureModal.tsx`
9. `src/components/PaymentView.tsx`
10. `src/components/CheckoutForm.tsx`
11. `src/components/CompletionView.tsx`
12. `src/components/ContractView.tsx`
13. `src/components/InvoiceView.tsx`
14. `src/components/BalanceView.tsx`

## Files Created

1. `src/components/BackgroundArt.tsx`
2. `src/hooks/useMouseGlow.ts`
3. `assets/docs/v5/v5_2_0/UPDATE_CHANGELOG.md` (this file)
