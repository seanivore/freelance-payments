# Payments Login Homepage Swarm Design Spec

## Summary

+ This is my freelance payments portal's login homepage 
  - It is where my clients go to sign their contract, get their invoices, and make payments through Stripe custom UI components 
  - The site is really pretty, and the homepage is a great starting point 
  - The main reason to push further is because **these clients are paying me for a high bar of design work** 

## Goal 

+ Inspirational goal would be **James Turrell's immersive light experience at LACMA** 
  - Favorite artist and instillation that just doesn't get old  
  - Great improvement on the current starting point that is 'generic SaaS login page vibe'

+ **Think:** you step into a dark, minimal room where there’s a single glass panel floating in space, and your cursor is the moving light source. As you move it, the glow blooms like colored fog: very bright, soft-edged, almost physical. The login card is a simple square, but its borders catch and bend that light in a way that feels deliberate and premium. The vibe is closer to an infinite glowing room from an art installation or music video set than a financial form — minimal layout, maximal presence.

---

## Resources 

### Creative Process Strategy 

+ I'd like to copy what we need from this, otherwise production ready, project directory and create an entirely new repository. 
+ In that repository, with this SPEC but perfected, we'll task about 10 agents to all build it in parallel. 
  - I'd like them to be primed to know they are frontend designers, the best of the best. 
  - I love how Opus 4.5 does visual design, as they did this entire project without needing any fixes, so a good handful of that model. 
  - Then we should probably let Sonnet get some attempts as well. 
+ They all have the same codebase, and the same SPEC, and they all build the same thing, and we then judge them on the quality of their visual design. 

### Materials 

  1. This design brief 
  2. Small set of reference images in "attachments" below 
  3. The code context 
    - Let's get a repo branch set up 
    - React/Tailwind/shadcn stack already wired 
    - We want to eliminate any cognitive work for the agents outside of their design tasks; make sure they have no need for guessing 

### Attachments

- Current Horvath Payments homepage (2 screenshots)
  ![Current Horvath Payments homepage](testing/IMG-bg_homepage_current-1.jpg)
  ![Current Horvath Payments homepage](testing/IMG-bg_homepage_current-2.jpg)

- 2–3 crypto / trading dashboard screenshots for glow / depth / glass inspo
  ![Crypto / trading dashboard screenshots](testing/IMG-bg_example_light_reflection-1.jpg)
  ![Crypto / trading dashboard screenshots](testing/IMG-bg_example_light_reflection-2.jpg)
  ![Crypto / trading dashboard screenshots](testing/IMG-bg_example_light_reflection-3.jpg)

- A color strip and portfolio hero snippet to show the cereal gradient palette
  ![Cereal gradient palette](testing/IMG-bg_homepage_cereal_aesthetic_and_gradient-1.jpg)
  ![Cereal gradient palette](testing/IMG-bg_homepage_cereal_aesthetic_and_gradient-2.jpg)

Use these as *visual references* only. Please don’t copy layouts from the dashboards; focus on light behavior, glass material, and color use.

---

## Design Brief 

### Context 

+ This is the login to my freelance payments portal's homepage. 
+ Clients land here to:
  - Enter their last name and project keyword
  - View and sign their contract, download their invoices, and make their payments 
+ The user flow is clean, professional, and impressively simple 
  - The "WOW" factor should come from LIGHT, MATERIAL, and COLOR of this first-impression homepage, not from complex layout or animation spam 
  - The stack is modern (React + Tailwind + shadcn/ui) 
  - Glassmorphism is a dying trend; this doesn't mean avoid it, this means give it a new spin; "same but different" is the key to success 
  - We like the cursor-follow interactions, maybe some masking etc. 
  - But you must first come up with a clear, intentional, visual concept; this is high-end smart-art

### Visual Theme 

+ One central object 

  - The boxy, glass-like login card in the middle of the screen 

+ Surrounding environment 

  - A dark, almost void-like space with softened, abstract art and color behind it 

+ Main interaction 

  - The cursor behaves like a powerful light source 
  - Wherever it moves, it throws a bright, perhaps slightly jelly-like glow that interacts with the card and its edges 
  - This is used to explore the scene; what is behind the light? The art? Explore the card itself 
  - They should want to play with the cursor 

+ Emotional tone 

  - Confident, futuristic, intimate 
  - It should feel like you’ve stepped into a carefully designed light room dedicated to this one action: paying me, but we're making them forget they're spending money, or rather, using emotionally intelligent design to make sure they are connecting feelings of joy, along with confidence and trust, while spending money 

---

## Elements 

### Background Artwork Treatment 

+ The existing geometric abstraction artwork stays 
  - But we do have a few options you will need to see to choose from 
  - They are intentionally large and abstract; leave them full size (2240 × 1792 pixels) regardless of viewport size 
  - Zoomed in because of viewport, or out, this will not matter; it is background vibe; just leave it and don't stretch it 

  ![Background artwork options](/assets/media/pdf-viewer-bg-art-1.webp)
  ![Background artwork options](/assets/media/pdf-viewer-bg-art-2.webp)
  ![Background artwork options](/assets/media/pdf-viewer-bg-art-3.webp)

+ Treat the artwork more like a tinted, blurred backdrop than an image to look at 
  - It is part of the emotional story, the tone of the experience 

+ Think of it as colored light bleeding through frosted glass
  - Heavy tint, a darkening overlay, so it doesn’t compete with the card and glow, and so the bright cursor light shines through 
  - Soft blur and reduced contrast so shapes are suggestion, not detail 

+ The background should be 
  - Deep, dark base, like charcoal or near-black, but slightly cool  

+ Subtle hints of the cereal palette 
  - terracotta: 25 35% 70%;
  - blue: 195 25% 65%;
  - mauve: 330 30% 72% 
  - Also pinks, blues, purples, blooming underneath 

+ No sharp edges or busy texture 
  - The background’s job is to set mood and color, not to be the focal point 

### Color Palette 

+ Base
  - Very dark background, charcoal or black with a slight hue 
  - Background art heavily tinted and de-saturated so it acts as atmospheric color, not a focal point 

+ Accent colors
  - Use the existing pink heavily for the strongest highlights and active states 
  - Introduce more of the blue from the portfolio gradient so the scene isn't monochrome pink 
  - The balance might be: Pink at the glow core/edge where intensity peaks, and Blue and purple in the softer falloff zones and edges of the card 

### Login Container Card

+ Shape
  - Boxy and squarish 
  - Rectangular, squared corners, like chunky glass frame 
  - No soft, pill-shaped neumorphism 

+ Material
  - Post-glassmorphism era; it is now chunky glass, like a slab, thick, reflective, refractive, creating prisms  
  - Slightly transparent with backdrop blur so you can see the tinted background abstracted behind it 
  - Perhaps a perspective shift where the background image moves up if there is room to scroll down, etc. 
  - Soft inner glow and a subtle edge glow to suggest thickness, like a glass slab

+ Heavy glare 
  - Across the top of the surface 
  - Outside the card 
  - On the edges, inside the card 
  - All at different layers and angles that make sense in physics and geometry 

+ Edge behavior **CRITICAL**
  - The borders should feel like they refract light 
  - When the cursor glow passes behind part of the card, that segment of the border should flare up with a bright, colorful highlight
  - Other parts of the border not touched by the glow should stay relatively calm and dim 
  - It has to be clear this is not a simple hover state, but a dynamic, interactive, immersive experience 

+ Content layout 
  - Clean, minimal 
  - Title: Last Name, Project Keyword fields, primary button text 
  - Typography should feel modern and confident, not playful or bubbly 
  - Secondary text gets system UI font, you should only really need one accent font, maybe two 

+ The form content should never overpower the light interaction 
  - It is secondary visually 
  - Primary functionally 
  - They should leave the page remembering the FX and forget how they even logged in 

---

## Interaction 

### Light Behavior, Cursor Glow, Refraction

* **This MAIN CHARACTER is the centerpiece of the design**

+ Concept
  - The cursor carries a strong, soft-edged light blob; a luminous sphere or cloud 
  - As it moves, the glow follows with smooth, slightly eased motion 
  - No jittery or harsh lag; perhaps subtle trailing if you can make it support the "liquid light" feeling 

+ Brightness 
  - The **glow** should be the **brightest** element on the **screen**
  - When it passes behind the card or along the edges, it should feel powerful enough to punch through the dark and make the borders pop 

+ Localized lighting 
  - The glow should only strongly light the parts of an element that are **actually** behind or near it 
  - If near it, the angle of the geometry and physics should be considered in how the light reflects 

+ Example: If the glow overlaps the top-right corner of the card 
  - That corner’s border becomes **intensely** bright and colorful 
  - Maybe a bit of spill into the nearby surface of the card the way a lit object would light up the surrounding surface; reflective light
  - The rest of the card edges remain mostly unchanged 

+ This creates the feeling of a moving highlight sliding along a physical object 
  - Not a uniform full-card "hover state" 
  - But a dynamic, interactive, immersive experience 
  - Sort of like headlights in a rear-view mirror, almost blinding and only lighting up the parts that are actually behind or near it

+ Shape and softness 
  - Soft, large radius, almost fog-like edges.
  - Slightly elliptical or asymmetric is fine if it adds to the organic feel; organic being like lense flare or snow/moon halo 
  - No hard circles or harsh gradients 

+ Interaction with edges
  - Where the glow meets a border the boarder should intensify in brightness 
  - It should shift color slightly in a way that makes sense in the context of the colors being used; realism 
  - Should gain a subtle bloom outside the card, like light spilling into the air, it disperses and spreads out 

### Feeling of Shiny, Liquid, "JELLO" Material 

+ The whole interaction should feel like light is moving through a viscous, translucent medium
  - Soft light smearing and blooming 
  - Highlights that feel almost squishy or gelatinous, not razor-sharp neon 

+ Inside the glow
  - A bright core, white or very light pastel, that transitions into saturated color at the edges 
  - Edge colors can cycle or blend between pink, blue, and purple depending on position or intensity

+ On the card
  - Show a subtle internal reflection where the glow passes, just like light would reflect each way in small or large aways 
  - Like the light is refracting through its thickness, like a glass slab or gel 
  - Avoid sharp specular highlights that feel metallic or plastic
  - It should feel more like a heavy chunk of very pure glass or very smooth, clear gel even if tinted 

### Interaction Versus Simplicity

+ The visual complexity should come from light and material 
  - NOT from layout, beyond how parts of it refract light 
  - NOT from excessive motion; the user should get a whole SHOW, a whole visual experience, even just slowly moving the cursor from viewport R to L 

+ Layout remains minimal 
  - Minimal impresses more than complex because you are doing something specific and intentional, focusing effort on what matters most 

  * One main card 
  * Clear headline (HORVATH PAYMENTS or similar) 
  * Two fields, one button, a small help line (Need help? Contact...) 

+ The scene should feel immersive and premium even when you’re just sitting there moving the cursor around slowly 
  - The experience before typing anything already communicates care, craft, and intentionality 
  - It should feel like a small "infinite room" of light built solely around this payment moment 

---

## Deliverable 

### Consider This Form of Thinking 

+ Cursor-following radial gradient / glow layer positioned via JS/CSS 
+ Glass-like card using backdrop-filter, transparent inner/outer borders, and multiple layers, nuanced highlights
+ Masking or blending so only the overlapped section of the border gets the strong highlight, instead of the entire card 
+ Smooth, subtle easing for glow movement animations 
+ No unnecessary UI elements moving around; keep focus on the light and the card

### Design Requirements 

* **The design should translate well to Tailwind + React with custom CSS/animation primitives**

+ Refined homepage visual concept that shows 
  - Dark, tinted background; abstract art treated as a shade layer 
  - Central, rectangular tinted glass login card with chunky think clear glass frame
  - Clear depiction, in frames or mock states, of how the cursor glow looks moving around the page, behind card, light up portions of elements

+ Use of the pink/blue/mauve cereal palette in a way where 
  - The background is muted
  - The glow and card edges are where brightness and saturation live

+ Result should feel like you're standing inside a minimal, infinite light room that exists solely for this one interaction