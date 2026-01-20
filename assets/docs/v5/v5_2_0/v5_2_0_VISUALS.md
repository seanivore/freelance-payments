# v5.2.0 Visual Design Updates

**Created**: 2026-01-20 
**Status**: Review plans, identify all specifics, plan implementation
**Priority**: High (First Impression Critical)

---

## Design Strategy

The payments platform, `payments.august.style`, is the first impression a client has with Sean's work after they've made verbal agreement to contract their work to him.

These clients identify the designer from visual work that stands out; they're paying for that same high-bar of design excellence.

The platform must reflect this while facilitating contract signature, invoice review, and then taking client payments in a recognizable digital safe-space created by using Stripe custom UI components.

This flow must feel premium but not intimidating.

Pull through a cohesive use of Sean's portfolio visual aesthetics found at the domain name's apex, `august.style`, to achieve the casual edge.

Achieve the premium feel through an emotionally intelligent UX by leveling up classic, timeless aesthetics with interactive UI and carefully crafted copywriting.

### Current State 

**What's Working**
  - Functional payment flow works end-to-end
  - Clean component structure uses React + TypeScript

**What Needs Improvement**
  - Homepage/user login needs powerful first impression
  - Responsive layout foundation across all phases 
  - PDF viewer is functional but clunky
  - Overall visual hierarchy, spacing needs refinement

**What's Missing**
  - Engaging, responsive user-interactions 
  - Carefully considered UI choices and copywriting 

### Design Inspiration

Design mockups were created as a guide originally for the PDF view, but should be used as a reference for the entire platform.
  - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-1.jpg`
  - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-2.jpg`
  - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-3.jpg`

The original homepage had a visual effect following the mouse cursor, creating an engaging, interactive experience. This was described in the following documents:
  - Original development plan referencing CSS for the august.style portfolio aesthetic
  `assets/docs/v1/v1_DEV_PLAN.md`
  - See details under heading "Design UI & UX Flow, Interrupted" 
    `assets/docs/v2/MODULAR_REFACTOR_PLANNING.md`
  - Portfolio CSS reference 
    `assets/docs/v1/EXAMPLE_FILES/styles_example.css` 
  - Original homepage glow effect, before migration to React 
    `assets/js/glow-effect.js`

### Key Visual Elements 

  - Dark theme with gradient depth effects
  - Cereal aesthetic colors (mauve #C99CAD, blue #8FA9B3, terracotta #C9A68A) from Portfolio
    `assets/docs/RESOURCES/EXAMPLE_IMG/portfolio-aesthetic-example.jpg`
  - Primarily use system-ui fonts; use AgencyFB for heading/accents (RegularCondensed, RegularCompressed)
  - Add smooth transitions and micro-interactions and visual effects that respond to user interaction

---

## Planned Design Updates 

These are observed update needs that can be considered as priority, but should not considered the only updates needed. 

  + Integrate use of shadcn/ui wherever possible 
  + User should be moved to next state upon action, not from using buttons 

### 1. Homepage/Login Page

**Current State**: Basic form with minimal styling

**Improvements**
  - Use PDF view mockups for possible background art/shading layer concept
  - Give shadow layer color and blur to keep focus on login form while creating depth/interest
  - Create a glow effect that follows cursor and lights up the shadow layer and gets bright on the edges of the form elements
  - Original background before transition to React build 
    `assets/docs/RESOURCES/EXAMPLE_IMG/example-homepage-glow-mouse-1.jpg`
  - Example of glow effect 
    `assets/docs/RESOURCES/EXAMPLE_IMG/example-homepage-glow-mouse-2.jpg`
    `assets/docs/RESOURCES/EXAMPLE_IMG/example-homepage-glow-mouse-3.jpg` 
  - Creates engaging, interactive first impression
  - Smooth transitions on form focus, hover states
  - Input fields should have polished focus states
  - Submit button should have satisfying hover/active states

### 2. PDF Viewer Styling

**Current State**: Functional, not totally logical, doesn't match mockups

**PDF Container & Hovering Paper**
  - PDF centered horizontally, vertically scrollable
  - Full-size abstract background art visible through shaded left and right sides of PDF paper
    `assets/media/pdf-viewer-bg-art-1.webp`
    `assets/media/pdf-viewer-bg-art-2.webp`
    `assets/media/pdf-viewer-bg-art-3.webp`
  - Shaded sides create depth, keep focus on the PDF
  - Subtle shadow/depth to create hovering paper appearance 
  - White/off-white paper color; legal paper #faf9f6

**Top Bar (GateBar)**
  - Dark bar at top with UX-emotionally-intelligent messaging
  - AgencyFB font 
    + AgencyFB-RegularCondensed for less narrow 
    + Headings, accents, anywhere system-ui isn't enough 
  - White text with very slight shadow blending 
  - Helpful, guiding text that helps users understand next steps, give hip edge without loosing professionalism
    + "Contract for your review."
    + "Please sign and add today's date."
    + "Continue to make payment."
  - Should feel supportive, not pushy, and not too casual
  - "Click to sign" can hover over area where user will sign 
    + Important part is to make sure the sign button isn't hidden below the fold like it is currently 
    + The next page button should direct user down to the signature area 
    + Submitting signature should take user to next state (payment)

**Signature Modal**
  - Convert to shadcn/ui Drawer component
  - Styling should match overall dark theme with accent colors
  - Layout should be clean, organized for:
    + Legal name text input
    + Date picker (already exists, needs integration)
    + Signature canvas (pen tool) **evaluate if we want to keep this; does it put signature on page? If not, it is kind of pointless and confusing** 
  - Submit button should be styled to match platform aesthetic
  - Should feel 
    + Supportive, not pushy, and not too casual
    + Professional, like legal document security feeling 

**Action "Buttons"** 

  - One "gate" per phase 
    + The gates have been referred to as "buttons" or "action buttons" 
    + Instead, think of the action the user is taking as the "gate" 
    + The act of completing the action should trigger the next phase/page to load/state to change 
    + No one needs a "next" button simply for moving to the next page; it should hold other value if used at all 
  - Put the "download" UI icon in the gate bar
  - For the action step after viewing the invoice or balance 
    + It is currently "Download: Yes" / "Download: No" buttons 
    + This doesn't make sense because there was not a button to download the contract
    + Instead we should just keep the download icon, no text needed, in the bar for each PDF 
  - Then change the action button for the invoice/download to be more like a CONFIRM 
    + This would be framed (not with text literally, but implied via placement location) as a confirm button for finishing both the contract and the invoice, or just the balance 
  - Make it "CONFIRM & CONTINUE TO MAKE PAYMENT"
    + When they click there could be a pop-up asking if they want to download the documents 
    + Would need different states for pop-up to offer appropriate PDF

### 3. Completion Pages

**Current State**: Functional but needs design refinement, messaging

**Improvements**
  - Should be thought of more as a thank you page that confirms we got their payment 
    + Thank you message should be warm, professional, and Supportive 
  - Visual design should match platform aesthetic
  - Remove admin details 
    + Payment Intent ID 
    + Stripe status, etc.
    + Obviously these should be designed for the client/user not for admin/developer 
  - Soft CTA to return for final payment (not pushy)

**Completion1 (After Payment 1)**
  - Clear next steps "Next time you login you'll be directed to your final payment."
  - Soft CTA; a subtle encouragement to return for final payment (not pushy)

**Completion2 (After Payment 2)**
  - Final thank you message should be celebration of project completion
  - Download links for all PDFs
    + Contract PDF
    + Invoice PDF
    + Balance PDF
  - Visual design should match platform aesthetic
  - Remove admin details 
    + Payment Intent ID 
    + Stripe status, etc.
    + Obviously these should be designed for the client/user not for admin/developer 
  - Clear completion indication; user should understand project is complete, and it is not certain that they'll be able to log in again after they end this session 

### 4. Payment/Checkout Pages

**Current State**: Functional Stripe Elements integration

**Improvements**
  - Visual design should match platform aesthetic
  - Layout refinement/Loading states should be polished
    + Better spacing, typography hierarchy
    + Loading states — clear and not delayed (current can see the contract load again in the background before the payment page loads)
    + Error states — make sure they're written for the client/user not for admin/developer
    + Clear, helpful error messages with platform styling
  - Add a subtle visual effect to the payment form elements to indicate they are focused and active

### 5. Overall Visual Polish 

**Typography**:
  - AgencyFB font family (RegularCondensed preferred)
  - System font stack for readability
  - Clear visual hierarchy with font sizes and weights

**Spacing**:
  - Consistent padding use design system spacing (from portfolio CSS)
  - Visual breathing room adequate whitespace for premium feel
  - Component spacing consistent gaps between elements

**Colors**:
  - Dark theme maintain dark background for premium feel
  - Accent colors use portfolio accent colors (mauve, blue, terracotta) strategically
  - Contrast ensure WCAG AA compliance for accessibility

**Transitions**:
  - Smooth animations 300ms duration, cubic-bezier easing
  - Micro-interactions subtle hover, focus, active states
  - Page transitions smooth transitions between gates/views

**Visual Effects**:
  - Cursor following effect on homepage (if implemented)
  - Background art in PDF viewer (as described above)
  - Subtle gradients where appropriate for depth

---

## Design Mockups & References

### PDF Viewer Mockups
  - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-1.jpg`
  - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-2.jpg`
  - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-3.jpg`

### Background Art Assets
  - `assets/media/pdf-viewer-bg-art-1.webp`
  - `assets/media/pdf-viewer-bg-art-2.webp`
  - `assets/media/pdf-viewer-bg-art-3.webp`

### Font Files
  - `assets/font/AgencyFB-RegularCompressed.otf`
  - `assets/font/AgencyFB-RegularCondensed.otf`

### Portfolio CSS Reference
  - `assets/docs/v1/EXAMPLE_FILES/styles_example.css`

### Portfolio Visual Reference Image 
  - `assets/docs/RESOURCES/EXAMPLE_IMG/portfolio-aesthetic-example.jpg`

### Glow Effect & Original Homepage Appearance 
  - `assets/docs/RESOURCES/EXAMPLE_IMG/example-homepage-glow-mouse-1.jpg`
  - `assets/docs/RESOURCES/EXAMPLE_IMG/example-homepage-glow-mouse-2.jpg`
  - `assets/docs/RESOURCES/EXAMPLE_IMG/example-homepage-glow-mouse-3.jpg` 

---

## Technical Considerations

### CSS Framework
- **Tailwind CSS**: Currently using Tailwind for utility classes
- **Custom CSS**: May need custom CSS for visual effects (cursor following, background art)
- **shadcn/ui**: Using for component library (drawer, button, etc.)

### Performance
- **Visual Effects**: Should not impact page load or performance
- **Background Images**: Optimize WebP format, lazy load if needed
- **Animations**: Use CSS transforms for smooth performance

### Responsive Design
- **Mobile-First**: Ensure all visual improvements work on mobile
- **Touch Interactions**: Visual effects should work with touch (not just mouse)
- **Breakpoints**: Maintain responsive breakpoints from portfolio CSS

### Accessibility
- **WCAG AA Compliance**: Ensure color contrast meets standards
- **Focus States**: Clear focus indicators for keyboard navigation
- **Screen Readers**: Ensure visual effects don't interfere with screen readers

---

## Next Steps

1. **Review Design Mockups**: Study PDF viewer mockups in detail
2. **Review Portfolio CSS**: Understand visual effects and styling patterns
3. **Create Design System**: Document color palette, typography, spacing
4. **Implement Homepage**: Start with homepage visual polish
5. **Implement PDF Viewer**: Match mockups exactly
6. **Refine Completion Pages**: Remove admin details, improve messaging
7. **Test Across Devices**: Ensure responsive design works
8. **Accessibility Audit**: Verify WCAG compliance

---

## Notes

- **First Impression Critical**: This platform is often the first interaction clients have with the designer's work
- **Match Portfolio Quality**: Visual design should match the quality of the portfolio website
- **Professional but Approachable**: Design should feel premium but not intimidating
- **Functional First**: Visual improvements should not compromise functionality
- **Iterative Process**: Design updates can be implemented incrementally

---

_This document serves as a planning guide for visual design improvements. Implementation should be done incrementally, testing each change to ensure functionality is maintained while visual quality improves._
