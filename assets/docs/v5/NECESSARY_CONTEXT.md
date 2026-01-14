# Necessary Context 

  + Necessary context for understanding the current project's build state includes a quick overview and then a breakdown of the build history meant to go further than showing how we got to where we are, by explaining why certain directional shifts were taken. 
  + A recent build session created a new architecture for the project that wasn't completed and could have possibly had better grounding. 
  + These details will help you better understand the various files in the project repository so that you know which are necessary, which might have been neglected in the architecture change, and which are no longer relevant. 

## Project Dual Purpose

  1. A micro-site SPA that allows my freelance clients to login, view their contract and sign it, view their invoice/balances, download those documents as PDFs, and then make payments through Stripe Custom UI integration. 
  2. Learn how to repurpose an architecture currently understood and used for my portfolio to be used for a client's online art store website build by getting experience integrating Stripe Custom UI Components and expanding the automations to manage JSON data flow between tools. 

## Architecture Plan

  + Portfolio base architecture 
    - Simple HTML/CSS/JS build with 2 HTML template pages that loaded data from 30+ JSON entries with data for each project
    - SPA-style routing via 404 redirect trick to host dynamic site on static GitHub Pages host 
    - Manifest.json informed the page builds; GitHub Actions Workflow recreated manifest.json each update push 
    - Understand base portfolio architecture: `assets/docs/RESOURCES/OG_JSON_ARCH_PORTFOLIO.md`

  + New payment site requirements 
    - Stripe payments with data informed from job's JSON, facilitating checkout for two payments per project 
    - Contract and invoice templates completed from job's JSON data and turned into PDFs available to client for download 
    - Automations update JSON entry with new data managing state of payment progress, and storing produced document PDFs to serve 

  + Relation to client's art store website learning needs 
    - Increased automations to handle backend inventory updates and facilitate payments, keeping frontend accurate 
    - Using Stripe's Custom UI Components for fully expanded understanding to fulfill any client payment needs 
    - State management tracking of user flow through events mirror online store frontend event to backend connection needs 

---

## Build History 

### Putting It All Together 

  **ORIGINAL BUILD RESEMBLED ORIGINAL SYSTEM** 

  + Same general structure as portfolio with minimal changes 
    - New data types for new uses on same single-JSON per job method 
    - Only one JSON data to display at a time, so manifest identified JSON to inform all pages in flow 
    - Actions used JSON data to create new needs, then recorded data to reference as needed 
  + JSON files in directory `assets/jobs/...` provided data 
    - Information to create Stripe objects, then save object artifacts needed to build checkout session 
    - Information to product contract and invoice documents, then save PDF artifacts needed to serve on front end 
    - Client details and login keywords needed for manifest.json update job tracking 
  + Pages built from JSON data onto HTML page templates as needed 
    - `404.html` redirect triggered identification of JSON data to serve on HTML template pages 
    - `index.html` and `job.html` provided structure regardless of JSON job selected 
    - JavaScript files `assets/js/...` managed process 
  + Setup workflow managed by expanded GitHub Action workflow `.github/actions/workflow/admin-push.yml`
    - JSON data provided to Stripe API creating product and price objects 
    - Stripe object IDs created saved on JSON file for later reference 
    - JSON data provided to Google Drive/Docs API to fill in template placeholders 
    - Completed Google Doc template saved as PDF and location in repository added to JSON for reference 

  **ADAPTIVE LEARNING OUTPACED DEVELOPMENT OF CODE** 

  + Under-anticipated new functionality implementation iterative revisions 
    - Learning new architectural elements resulted in improvement cycles 
    - Simplifying logic until perfected and foolproof 
  + Workflows for automations required full logical layout understanding to make completely efficient 
    - High number of JSON schema changes needed to accommodate flow of iterative learning process 
    - Code updated so many times to adapt as we did, learning as we were developing 
  + Form stopped following function in the code 
    - Eventually seemed more like "patching" together code, rather than writing best code for the purpose 
    - Original code written from planning done with different understanding 
  + Poorly kept documentation from under-anticipated adaptive development process 
    - From a high-level, the build is conceptually simple and managing changes as needed started out simple 
    - Complexity built, changes in code made intention less recognizable, doubling back to document was near impossible 

  **THE BUGGY RESULT OF BUILDING LIKE AN ARTIST** 

  + Unending wall of bugs that took days to get through one-by-one, in every single function 
  + AI stopped following bug patch best practices 
    - Discover of one bug illustrated reason for issue 
    - Conceptual reason for issue should then be applied in looking through scripts for similar issues 
    - Instead of this proactive patching, we'd patch one issue, then test again 
  + Created versioning sub-directories late 
    - Only v4 and now v5 have been accurate representations of update process 
    - Earlier versions are just estimates to have place to store old documentation 

### Identifying New Path Forward 

  **CAPITALIZING ON RECOGNIZABLE PATTERNS** 

  + Troublesome larger functionality issues better repaired with new 'set of eyes' or 'perspective'
    - Created current state document and AI context primer documents 
    - Then starting a new agent instance with this knowledge often resulted in faster repair if done right 
  + Historic 'development' then 'debug and patch' process ingrained but outdated 
    - Today's AI-pair coding tools make decisions from training data that solved problems using different tools 
    - Old process valued keeping written code INCREDIBLY HIGH due to how resource intense producing functional code was 
    - Old process therefore greatly valued spotting single bug and patching single area over whole code rewrites 
  + LLM limitations from design encourage retrying over fixing on some level 
    - LLM output can "go down the wrong path" 
    - Repeating the same prompt can get different output that is most accurate 50% of the time 
  + Significant new tool abilities have implications that need to be applied to process 
    - The fact that an AI with all necessary information can write bug-free code on the first try is new 
    - Being able to write 20+ files of code creating an entire projects repository is completely new 
  + Full understanding of project variables and an exclusively executable implementation plan that isn't adaptive 
    - This can result in phenomena of "one shotting" an entire website or app that is function on the first try 
    - We've done this many time with website builds, and some simple apps 

  **APPLYING IMPLICATIONS OF MODERN TOOLS TO PROCESS** 

  + Taking inventory of where we were in development 
    - All new features had been iterated to simplified logic perfection 
    - Unexpected variables and resulting necessary changes had all been identified 
    - New learning curves had been climbed 
  + Implications of this status when considering modern tools and historic process 
    - Stop over-valuing current code and making patchwork attempts at debugging 
    - Looking at what know, the constants we have, ask if an implementation plan would look the same 
  + Reconsidering historic process worth 
    - Imagine a function that pulls from 3 different scripts 
    - Test is set up, encounters one bug, further testing is blocked 
    - Considerable amount of time is spend finding bug cause and then solution 
    - Rebuilding and then deploying the application 
    - Setting up the testing again, only to repeat the cycle 
    - Imagine that each script has at least 5 bugs 
  + Now consider new process worth 
    - Examine and understand necessary data flow for function 
    - What pieces come together, to do what 
    - Imagine instead taking this understanding and rewriting the full 3 scripts of code 
    - Each rewrite of all 3 takes 1 minute 
    - How many rewrites might it be worth retrying before switching to a specific 1-bug-at-a-time approach 

### Rebuilding From Ground Up 

  **SETTING NEW AGENT UP FOR THIS NEW, MODERN APPROACH** 

  + Rationale for modern tool needing modernized process conveyed in simplified manner 
  + Agent asked to take in the constants and avoid overthinking current approach 
    - All flow logic needed regardless of architecture or because it was already in its simplest, most efficient form 
    - All tools and API calls needed to facilitate creation of objects and recording of their artifacts 
    - Understand what we have, what logic is in final form, and what we need to get to 
  + Agent then asked to come up with implementation plan based on that information alone 
  + Agent then asked to compare that plan with current state of project and make assessment 
    - What way forward made the most sense for the best quality end product 
    - How much time would it likely take to proceed in either method 
    - Can a hybrid method be created and what would that look like 
  
  **RESULTING CURRENT BUILD STATE** 

  + Process wasn't perfect 
    - There were definitely some things the agent didn't quite fully understand enough before implementing new architecture 
    - This caused some gaps in the rebuild from being completed and working 
  + Still needed to work through some specifics  
    - Building checkout_session still not fully understood for custom UI Stripe components 
    - Discovered a plan in Stripe docs that requires human and AI to walk through process 
  + Agent kept forgetting some aspects of the build 
    - Repeatedly forgot we were already using Vercel stateless functions 
    - Seemed to get very confused about how some of the unchanged functionality worked when it came to planning remaining functionality 
  + Unexpectedly large shift in architecture languages 
    - Expected that we would stay with the same portfolio-learned architecture 
    - Seemed like we had no need to change things like working in HTML/CSS/JS 
  + New architecture languages  
    - React and typescript for a payment system or shop make sense 
    - Though I have less understanding and experience in these languages 
    - Things have progressed rather quickly 
    - Got to same testing spot we left with previous build 
    - New build from start to finish took less than an hour 

---

## Core Lessons

### Late-Stage Development Architectural Review Requests 

  + When development is adaptive and involves learning and perfecting as process, late state audit makes sense to help avoid excessive bugs and need to patch up code written initially with a different understanding, but should be done with clearer directives and an absolutely thorough project context priming that is comprehensive 
  + For example, not that we're going to backtrack now, but perhaps "new architecture" wasn't exactly what should have been communicated, when what was really necessary was probably much smaller, involving no language changes, but re-writing of many main files, evaluating how the files work together to consolidate and improve where possible 

### **BIG-PICTURE PROBLEM:** Communication wasn't part of the process
  
  + Working agentically does not mean working independently 
    - Unknowns and variables should be discussed and figured out together 
    - Specifics of the plan, if request was open ended, must be decided upon and understood by all parties 
  + Results of a lack of communication 
    - Architectural shift wasn't done in an expected way 
    - Changes to build were not complete or as precise as they should have been 
    - Agent did not pause to chat and make sure they understood the old architecture 
    - Agent made assumptions about the architecture and the needs, creating issues that took time to resolve that would have otherwise taken no time 
  + Amount of work increases because of an expectation of later communication that is never planned 
    - Agent used placeholders, which is unacceptable because they're created with expectation of secondary script review that is never planned 
    - Code must be written as final, production ready, code and if not possible, then agent should stop to discuss unknown variables 

### **SOLVE-ALL SOLUTION:** Create plans that require only execution 

  + Plan should have all details completely sorted out 
    - Discuss variables and question-marks, areas not fully understood; be pragmatic from the start 
    - Research developmental unknowns or troublesome areas 
    - Plans are where placeholders would go, then discussed until filled in 
  + Often prompts and spec plans ask for solutions 
    - Don't presume to come up with this solution as part of the developmental process 
    - Presume that coming up with the solution is required for the plan 

---

## Conclusions & Next Steps 

  **STEP 1: Review materials and then discuss**

  + Please review the remaining three context priming materials and then help me understand the true state of things with this project. 
    - From what I can tell, the new architecture was built without a full understanding of how Vercel was playing a role and then Vercel was only patched in afterwards. 
    - However, I am guessing that this new language architecture is probably best to continue with to wrap up development and then testing. Please provide thoughts on if you agree with this, or if maybe the agent made an unnecessary jump that, even at this stage, would be better to back up from. 
  + Help Sean make sure he understands what is what in the repository for the new architecture 
    - I.e. what is the `dist/...` directory 
    - Why does it appear to literally just be a mirror of all the same files in the rest of the repository or in `src/...` 
    - Are we able to identify what files we do or don't need anymore, like in `assets/js/...` for example, or `assets/css/...` 

  **STEP 2: Evaluate completion of build frontend flow, then complete**

  + Development seems to remain; this is where the lesson regarding plans that require only execution comes from 
    - Instead of trying to sort out all of the unknowns, they used their best guess at how to put together the frontend user flow 
    - Process for initializing checkout sessions was not understood before implementation 
    - No apparent clear delineation between the phases for the first and second payments 
  + We should fully understand, adapt and/or fix, to otherwise perfect the frontend flow **before** we begin testing again 
    - Current frontend test results in login but when then when user should move to contract, nothing loads 
    - Current test results: `assets/docs/v5/TEST_uid-ilt-036.md` 
    - I could not proceed after this step in testing; the phase 2 steps are just a draft 
    - It is because **EVERY** bug in frontend testing is a complete block that we need to perfect frontend code **BEFORE** testing again 

  **STEP 3: Update PDF viewer to fit visual design mockups**
  + Current solution was meant to clean up the clunky iFrame, but is just as clunky 
    - I had done research using Dia Browser and created an implementation guide 
    - Whatever methodology was used doesn't fit design specs though did add a Pen and Canvas so User could literally sign 
  + Again, clear it was not fully implemented because the calendar dropdown selector and the space to type name were missing 
    - The more we tested, the more I wondered if simple HTML <embed> without iFrame might have worked 
    - Now I think it uses React, but if so, why is it so difficult to make it not look terrible 
  + PDF viewer mock-up images were provided and can be viewed here 
    - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-1.jpg`
    - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-2.jpg`
    - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-3.jpg`
  + Remember that each 'page' or 'phase' of the user flow should only get ONE action step as a gate 
    - These are defined in full inside of `PROJECT_OVERVIEW.md` 
    - The mockup example shows the "next" button as present, but with icons that indicate signing or acknowledging an invoice/balance 
  + Other mockup notes for super minimal and clean look 
    - PDF centered, stacked vertically, for user to scroll down to read more 
    - Behind PDF, as visible through shaded left and right of PDF paper, is Bauhaus art shapes `assets/media/pdf-viewer-bg-art-1.webp`, `assets/media/pdf-viewer-bg-art-2.webp`, `assets/media/pdf-viewer-bg-art-3.webp` 
    - Only other on-screen UI is a charcoal bar at the top with UX-emotionally-intelligent messaging greeting them or helping them along 
    - Text is white with AgencyFB font which is in repository here `assets/font/AgencyFB-RegularCompressed.otf` and `assets/font/AgencyFB-RegularCondensed.otf`

  **STEP 4: Use Stripe Docs "Build a checkout page with Checkout Sessions API" guide with human**
  + The last notable item I already know we need to do is set up checkout sessions properly 
    - The initialization for checkout_sessions_1 after the invoice and checkout_sessions_2 after the balance 
    - Each agent so far had issues, initially between different APIs and then between ui-type embedded (not what we want) and custom 
  + Let's just use this walkthrough on the Stripe set that is sort of human-centric UI so we'll have to do it together 
    - Interactive guide: `https://docs.stripe.com/payments/quickstart-checkout-sessions?lang=node` 
    - Let's you pick frontend language react and backend node.js (or other)
    - Then each step is interactive and I can input information and it will give us the exact code we need 
    - Steps start with setting up their server and end with them providing the `checkout_session_1.return_url`, `checkout_session_2.return_url` 
  + Last agent seemed very confused about needing the "checkout" or "pay" button action step on invoice/balance 
    - They seemed to think that button needed to call API 
    - The action step to the checkout page, which appears to also be one of the pages of code provided in the guide, can be a normal button 
    - When the actual checkout page loads, it would need to call the proper Stripe API 
  + The seemed to think that this could only be done if we had another GitHub Action Workflow setup 
    - Which is where the other API calls to create the Stripe catalog objects were created 
    - And for the checkout_session, all the details needed is also already on the JSON 
  + But I can see in the console when any random page loads, it starts with an API call 
    - So if the standard button just pushes to the next page, loading their provided code checkout page setup 
    - Then I'm pretty sure that the API call can be called as the first part of that page loading 
    - The checkout_sessions are created on-demand every time user wants to go to pay, even if they don't do it 
    - They expire and can't be made ahead of time like the other objects were created ahead of time when the JSON job file was originally added 

  **STEP 5: Finish testing document and add more specifics** 
  + Current test results shared earlier that stop after frontend login `assets/docs/v5/TEST_uid-ilt-036.md` 
    - After build of front end is confirm sound and fully understood, then we should finish testing and record each step there 
    - Under the steps already there and new steps I would like to indicate exactly what file(s) are responsible for facilitating that step 
  + This setup will help when trying to start the client project and translating the build to a web store 

---
*After reading this document please continue with the rest of the context priming documents before we get into the specific steps. Those documents include the PROJECT_OVERVIEW.md `assets/docs/v5/PROJECT_OVERVIEW.md`, then the AI_CONTEXT_PRIMER.md `assets/docs/v5/AI_CONTEXT_PRIMER.md`, and finally, the document created during the end of the last session after the architectural rebuild called CURRENT_STATE.md `assets/docs/v5/CURRENT_STATE.md`. Updated by Sean August Horvath 2026-01-14* 