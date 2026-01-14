# Required Reading to Move Forward Smoothly 

  + Below you'll find *why* certain directional choices were taken during development. This is *necessary context* for understanding the current state of the project build, so that you know how to plan the remaining tasks required. Please review thoroughly so that we can execute our final stretch of development smoothly. 

    - **HOW**: Quick project architectural overview followed by a breakdown of the development history to see how we needed to adapt this build over time. 
    - **WHAT**: A recent build session created a new architecture for the project that wasn't completed and could be given better grounding. 
    - **WHY**: Understand what in the project directory is necessary, what might have been neglected in the transition, and what is not longer relevant. 

## Project's Dual Purpose

  1. A micro-site SPA for my freelance clients to login, view and sign their contract, download their invoices, and pay for my services.
  2. A project where we can learn how to repurpose my portfolio website architecture to be used in a client's online art store website. 

### The Architecture Plan

  + Portfolio base architecture 
    - Simple HTML/CSS/JS build with 2 HTML template pages that load data from a directory of 30+ JSON files, each representing a project
    - SPA-style routing using a 404-redirect trick to host a dynamic site on our free, static, GitHub Pages host 
    - GitHub Action Workflow auto-builds an `assets/js/manifest.json` file to inform what a page build's content and URL are
    - **PLEASE READ TO UNDERSTAND OUR ORIGINAL BASE ARCHITECTURE**: `assets/docs/RESOURCES/OG_JSON_ARCH_PORTFOLIO.md`

  + New payment site requirements
    - Integrate payments using Stripe Custom UI Components, built from and facilitated by a single JSON file data per job 
    - Produce, store artifacts for display and download, job Contract/Invoice PDFs using G.Docs Template and data from job JSON file
    - Automations expanded to facilitate Stripe and PDF assets, while recording state and user-behavior events on job JSON file 

  + How payment site fulfills learning needs for client's art store website 
    - Increased automations to manage backend, facilitating payments and keeping inventory details up-to-date for frontend dynamic display
    - Learning to implement Stripe Payments using their Custom UI Components to fulfill any possible client payment needs 
    - Updates from frontend user-behavior stored as backend data to fulfill any custom analytics needs, or dynamic personalized page updates 

---

## Build History 

### Putting It All Together 

  **ORIGINAL BUILD RESEMBLED PORTFOLIO SYSTEM** 

  + Portfolio structure with minimal changes, JSON files in directory `assets/jobs/...` provided data
    - Same single-JSON per job, new types of data and different data use-case purposes 
    - Manifest identifies client's job JSON using login information; only one JSON data to display at a time, JSON updated with user state progress 
    - GitHub Action Workflows use JSON data to create Stripe, PDF assets; record object artifacts needed to build checkout user session 
  + Same `404.html` redirect, using HTML templates, `index.html` and `job.html` build from JSON, coordinated by `assets/js/...` files 

  **ADAPTIVE LEARNING OUTPACED CODING IN DEVELOPMENT** 

  + Under-anticipated necessary iterative revisions of new functionality 
    - Refactoring repeatedly for continuously simplified and eventual foolproof logic to be identified 
    - Increased GitHub Action Workflow Complexity required full map understanding to find more efficient logic 
    - These iterative changes required numerous JSON schema changes, requiring all code to be updated 
  + This eventually resulted in form no longer following function of code and system design 
    - Original code was written with different planning intentions and understanding of system design 
    - Eventually resulted in "patching" together code that would be very different if written for best, final purpose and system design understanding 
  + Unexpected changes of a build that is conceptually simple from a high-level meant documentation was not adequate until complexity was recognized 

  **BUGGY RESULTS OF DEVELOPMENT BUILDING LIKE AN ARTIST** 

  + Unending wall of bugs, each fully stopped other testing, took days to handle one-by-one for every function 
    - AI stopped implementing patches in pragmatic way by looking for conceptually similar bugs proactively 
    - When complexity was recognized we set up versioning, but only v4 and (current) v5 are anywhere near helpful for storing old documentation 

### Identifying New Path Forward 

  **CAPITALIZING ON RECOGNIZABLE PATTERNS** 

  + Creating proper context primer and tapping in new agent solved larger, more troublesome functionality issues more effectively 
    - Getting a 'new perspective' or 'set of eyes' resulted in faster repair but only with proper documentation 
  + Modern tools and process do not match historic 'development' and then 'debug and patch' process that is so ingrained in training data 
    - Old processes valued maintaining written code INCREDIBLY HIGH compared to today, as it was resource intensive to produce any code 
    - Old process therefor greatly valued the 'spotting single bug' and 'patching together until it works' mess we found ourselves in 
  + Contrary to this process, LLM limitations where output can 'go down the wrong path' encourage retrying same prompt over fixing singular output 
    - Impact of this compounds when you consider writing 20+ files in an entire directory, in minutes, can sometimes turn out bug-free 
  + Significant tool capability shift has significant implications for applied process 
    - We learned as we built, but when AI has full understanding and final function logic, they can quickly create error-free work 
    - Exclusively executable implementation plans that aren't adaptive should logically result in faster completion with AI retrying full rewrites 
  + This has been seen in 'one-shotting' websites and apps; we should adapt our process accordingly instead of hammering away at outdated methodology

  **APPLYING THESE IMPLICATIONS TO OUR PROCESS** 

  + Imagine function that uses 3 scripts, each with 5 blocking bugs 
    - Instead of spending upwards of 15 hours fixing this one function, step back and take a big picture review 
    - Examine and understand necessary data flow for functions, consider how they work together and to do what, then rewrite the script 
    - Doesn't even need to result in 3 scripts again; if it functions, then fitting it into your overall design will still be quicker than the debugging 
  + Take inventory of development state, all finalized, simplified function logic, and perfected flow sequence for processes 
    - Recognize when process of climbing new learning curves is complete 
    - Stop over-valuing current code, over-extending time spent making patchwork debugging attempts 
  + Take these discovered constants and create an exclusively executable implementation plan 

### Rebuilding From Ground Up 

  **SETTING UP A NEW AGENT, FOR THIS NEW APPROACH** 

  + Above rationale and logic for new process explained, though not nearly as effectively and concise as above 
    - Agent asked to do what the 3-scripts-5-bugs-each example conceptually did by taking in entire project's constants and logic 
    - Asked to then create new implementation plan, though again, unfortunately before coining 'exclusively executable' 
    - Agent asked to then finish reading all context priming documents about current state, compare to their new plan, come up with path forward 
  
  **RESULT OF THIS FIRST ATTEMPT** 

  + Didn't have a proper process for identifying and compiling all the constants, final function logic, workflow sequence perfections 
    - They sort of winged it, which inevitably resulted in an incomplete solution; the solution might still be logical, but needs completion 
    - In future will need emphasis on language for creating an 'exclusively executable implementation plan' 
    - Instead of creating a plan to create solutions, all solutions should be completed for the plan; front-loading the work in more complete way 
  + Current state details will show how frontend user flow implementation was not as complete as the fully detailed documentation 
    - Agent kept forgetting that we were already deployed on and using Vercel stateless functions 
    - Agent made a large shift in architecture language, which is much more literal than the conceptual rebuild we wanted 
    - It might make sense to keep with react and typescript; it makes sense for payments platform and the backend setup flow is done 

### Final Session Work Starts To Show Itself 

  + Hopefully this already illustrates, conceptually, what the starting point will be for our final session: We need to fully understand and then detail all of the frontend user-behavior flow functionality, logic, and flow sequence to create a fully exclusively executable implementation plan. 
  + We're almost there in the documentation, but will need to carefully work together creating `checkout_session_1` and `checkout_session_2` collection of script files which we'll complete using an interactive Stripe guide specifically for choosing things like language, and other variables, and then going step-by-step to get actual completed code for our use-case. 
  + The other main functionality needing repair is the PDF viewer. However, the actual movement from phase to phase, as of the last test, is not functional beyond user login. All of this will become much more clear and actionable when reading the context priming and project overview and current state documents to follow this one. 

---

## Core Lesson of Late-Stage Development Audit & Rebuild 

  + When development is adaptive, involves learning, and results in iterative perfection as part of the process, a well planned late-stage audit of application functionality and fresh code rewrite should be extremely valuable and eliminate a lot of debugging. 

  + Wording used in directing this process will be extremely important and should be conveyed as carefully as was detailed above. For example "new architecture" is probably much larger than what is actually needed; what is needed is an evaluation of how the functions work together and how the data flows through the system, so that current code files can be rewritten either in their current system design, or with a new repository structure that makes more sense.

  + Planning phase must be communication heavy and be continued until understanding is complete and any question marks are identified and solutions for them are found then detailed. Plans should require only execution. All details should be completely sorted out; all variables discussed and any areas not understood discussed in advance rather than expecting things will come together accurately in the moment. 

  + When prompts or spec plans ask for solutions, don't presume to come up with solutions as part of the development process; instead presume that coming up with the solution is required for the development plan, before development even starts. Conceptually, it just means that the 'production ready' version of the product should be the development plan, before development even starts. 

---

## Conclusions & Next Steps 

  **STEP 1: Review materials and then discuss**

  + Please review the remaining three context priming materials and then help me understand the true state of things with this project. 
    - From what I can tell, the new architecture was built without a full understanding of how Vercel was playing a role 
    - And then Vercel was only patched in afterwards 

  + Pay special attention to the "Documentation Discrepancies" listed in the `assets/docs/v5/CURRENT_STATE.md` document 
    - We will probably want to discuss them particularly #4 I do not think it accurately implemented 
    - I mention throughout the steps below, but I think we should understand and rewrite front end script rather than try to debug this agent's work 

  + This seems like it should explain why the first half, backend setup and build automations, of the application functionality works perfectly 
    - Those were completely debugged and probably even left to function using the same previous python and JS files 

  + Would also explain why second half of the application functioning, the frontend user flow through documents and payments, is completely bug ridden 
    - It is likely that they wrote new language files for language appropriate frontend build 
    - But didn't actually improve any of the existing files; they just translated them over, probably missing some 
    - This left the frontend even less functional than it was before the conversion 
    - Hopefully can be finished in this new architecture and avoid the massive number of bugs we encountered in the old architecture 

  + Here I am guessing that this new language architecture is probably best to continue with to wrap up development and then testing with 
    - Please provide thoughts on if you agree with this 
    - Of if maybe the agent made an unnecessary jump that, even at this stage, would be better to back up from 

  + Assuming with stick with react build, then please help Sean understand what is what in the repository for the new architecture 
    - All of my experience has been with HTML/CSS/JS development or with python scripts 
    - So things like, what is the `dist/...` directory, makes no sense to me, it is like a mirror of the repository 
    - Are we able to identify what files we do or don't need anymore, like in `assets/js/...` for example, or `assets/css/...` what are we using 
    - How does it all work, basically 

  **STEP 2: Evaluate frontend flow build, create exclusively executable plan to adapt and complete**

  + This is where our lesson regarding creating plans that require only execution starts 
    - Instead of trying to sort out all of the unknowns, they used their best guess at how to put together the frontend user flow 
    - Process for initializing checkout sessions was not understood before implementation 
    - No apparent clear delineation between the phases for the first and second payments 

  + It seems like it might even make the most sense if you are to take in the full functionality understanding 
    - Discuss things we don't understand or have planned out, including the PDF viewer in STEP 3 and the Stripe checkout session in STEP 4 below 
    - Create an implementation plan and then we will add in details for STEP 3 and STEP 4 and we will make sure it is polished 

  + THEN we can essentially build it fresh, rather than trying to pick apart what was and wasn't done 
    - It would ensure that if YOU know what you're doing then we don't need to check and validate the previous work 
    - Since we NEED to reach that level of understanding regardless, it is logically a safer route creating our own code 

  + In any case, we need to fully understand, create and implementation plan for, and then COMPLETE the frontend in its entirety **before** any testing begins 
    - Current frontend test results in login but when then when user should move to contract, nothing loads 
    - The homepage is terribly ugly and doesn't match the portfolio anyway 
    - Current test results: `assets/docs/v5/TEST_uid-ilt-036.md` 
    - I could not proceed after this step in testing; the phase 2 steps are just a draft 
    - It is because **EVERY** bug in frontend testing is a complete block that we need to perfect frontend code **BEFORE** testing again 

  **STEP 3: Update PDF viewer to fit visual design mockups**

  + Current solution was meant to clean up the clunky iFrame, but it is just as clunky 
    - I had done research using Dia Browser and created an implementation guide 
    - Whatever methodology was used doesn't fit design specs though did add a Pen and Canvas so User could literally sign 
    - However the user needs to be able to type in their name and use a calendar selector for adding the date, all of which is missing 

  + The more we tested, the more I wondered if simple HTML <embed> without iFrame might have worked 
    - Now I think it uses React, but if so, why is it so difficult to make it not look terrible 

  + PDF viewer mock-up images can be viewed here 
    - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-1.jpg`
    - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-2.jpg`
    - `assets/docs/RESOURCES/EXAMPLE_IMG/pdf-viewer-design-mock-up-3.jpg`

  + Remember that each 'page' or 'phase' of the user flow should only get ONE action step button/step for the user as a gate 
    - You will find these are all fully defined in `PROJECT_OVERVIEW.md` 
    - The mockup example even uses the "next" button as direction to the action step 

  + Other mockup notes for super minimal and clean look 
    - PDF centered, stacked vertically, for user to scroll down to read more 
    - Behind PDF, as visible through shaded left and right of PDF paper, is Bauhaus art shapes 
      `assets/media/pdf-viewer-bg-art-1.webp` 
      `assets/media/pdf-viewer-bg-art-2.webp` 
      `assets/media/pdf-viewer-bg-art-3.webp` 
    - Only other on-screen UI is a charcoal bar at the top with UX-emotionally-intelligent messaging greeting them and helping them along 
    - Text is white with AgencyFB font which is in repository here 
      `assets/font/AgencyFB-RegularCompressed.otf` 
      `assets/font/AgencyFB-RegularCondensed.otf`

  **STEP 4: Use Stripe Docs "Build a checkout page with Checkout Sessions API" guide with human**

  + The last notable item I already know we need to do is set up checkout sessions properly 
    - The initialization for checkout_sessions_1 after the invoice and checkout_sessions_2 after the balance 
    - Each agent so far had issues, initially between different APIs and then between ui-type embedded (not what we want) and custom 

  + Let's just use this walkthrough on the Stripe set that is sort of human-centric UI so we'll have to do it together 
    - Interactive guide: `https://docs.stripe.com/payments/quickstart-checkout-sessions?lang=node` 
    - Let's you pick frontend language react and backend node.js (or other)
    - Then each step is interactive and I can input information and it will give us the exact code we need 
    - Steps start with setting up their server code file, then checkout 
    - Then end with them providing the `checkout_session_1.return_url`, `checkout_session_2.return_url` 

  + Last agent seemed very confused about needing the "checkout" or "pay" button action step on invoice/balance 
    - They seemed to think that button itself needed to call API — but this doesn't logically vibe with the entire idea of UI components 
    - The action step to the checkout page, which appears to also be one of the pages of code provided in the guide, can be a normal button 
    - In fact in the mock up the "next page" type button that would got to the payments page forces the user to "OK" acknowledge the invoice/balance 
    - And then we should also set things up so that if they download the document at that point, it works instead of "OK", and pushes them to check page 
    - When the actual checkout page is triggered to load, then it would need to call the proper Stripe API 

  + I'm sure all of this will become abundantly clear once we do the walk through and it literally gives us the files we need 

  + The agent before seemed to think that this could only be done if we had another GitHub Action Workflow setup with a build/deploy 
    - But that doesn't make any logical sense with the fact that the entire project is dynamic regardless of what JSON is selected 
    - The other stripe object catalog API calls are in the admin-push workflow, but the only thing the 'build/deploy' is for is the manifest and artifacts 
    - And the checkout_session_1 and _2 details for creating that object are all already on the JSON 
    - So I'm pretty sure they just didn't understand how it worked and hopefully me recounting this isn't confusing things 
  
  + Because I figure, I can see in the console when any random page loads, it starts with an API call 
    - So if the standard button just pushes to the next page, loading their provided code checkout page setup 
    - Then I'm pretty sure that the API call can be called as the first part of that page loading 
    - The checkout_sessions are created on-demand every time user wants to go to pay, even if they don't do it 
    - They expire and can't be made ahead of time like the other objects were created ahead of time when the JSON job file was originally added 

  + I guess we will better understand after we create those files from the guide 

  **STEP 2 AGAIN — because we need to make sure the PDF and checkout and anything else are all planned out**

  + Mentioning again here just because of the order of these steps 
    - Technically step 3 PDF viewer and step 4 checkout need to be finished to finish step 2 in full 

  + I'm a broken record but we will want to have a completely finished implementation plan/guide before we even rebuild 
    - Then we should rebuild from scratch because if we have the full understanding then there is no reason to even try to trust the previous agents script 
    - Only after it is all polished should we restart testing in STEP 5 

  **STEP 5: Finish testing document and add more specifics** 

  + Current test results shared earlier that stop after frontend login `assets/docs/v5/TEST_uid-ilt-036.md` 

    - After build of front end is confirm sound and fully understood, then we should finish testing and record each step there 
    - Under the steps already there and new steps I would like to indicate exactly what file(s) are responsible for facilitating that step 

  + This setup will help when trying to start the client project and translating the build to a web store 

---
*After reading this document please continue with the rest of the context priming documents before we get into the specific steps. Those documents include the PROJECT_OVERVIEW.md `assets/docs/v5/PROJECT_OVERVIEW.md`, then the AI_CONTEXT_PRIMER.md `assets/docs/v5/AI_CONTEXT_PRIMER.md`, and finally, the document created during the end of the last session after the architectural rebuild called CURRENT_STATE.md `assets/docs/v5/CURRENT_STATE.md`. Updated by Sean August Horvath 2026-01-14* 