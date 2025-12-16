# Development Planning of Freelance Payment Micro-Site 
*Updated 16 December 2025* 

## Objective 

- Acquire experience building Stripe custom integrations for client projects by creating a reusable micro-site at the subdomain `payments.august.style` that is designed to allow my freelance clients to access payment processing by entering their invoice number. 

### Overview 

  + Review and understand the current client website build as inspired by my portfolio architecture  
  + Comprehend current portfolio build automations that allow for dynamic content to display and update on static web hosts 
  + Understand use case of Stripe for current client project, using JSON files for products in the online shop 
  + See how automations must be adapted for the current client's online store's Stripe use case 
  + Understand my freelance contract with design scope, invoice production, and payment needs 
  + Use understanding of concepts, architecture, and automations possible to create best possible integrated plan for the micro-site 
  + See considerations section below for thoughts on what to explore as possible for micro-site build 
  + Ensure complete understanding of most up-to-date Stripe Development Documentation using their LLM.txt linked below 

### Tech Stack & Page Design 

  + This is a GitHub Pages website build 
    - We have done a million of these and have the files needed prepared already 
    - Both `./CNAME` and the `./_config.yml` 
      `/Users/seanivore/Development/freelance-payments/CNAME` 
      `/Users/seanivore/Development/freelance-payments/_config.yml` 
  + Use the included style guide `styles.css` to match my portfolio which lives at the apex of the domain `august.style` 
  + READ: `/Users/seanivore/Development/freelance-payments/assets/docs/planning-resources/styles.css`
  + We will probably need to update the `./.env` and `./.example.env` 
    - Both are empty 
    - I know we'll need Stripe but I think that is it 
  + Please make sure the HTML includes all META essentials 
    - Favicon formats are here:
    `/Users/seanivore/Development/freelance-payments/assets/favicon/apple-touch-icon.png`
    `/Users/seanivore/Development/freelance-payments/assets/favicon/favicon-96x96.png`
    `/Users/seanivore/Development/freelance-payments/assets/favicon/favicon.ico`
    `/Users/seanivore/Development/freelance-payments/assets/favicon/favicon.svg`
    `/Users/seanivore/Development/freelance-payments/assets/favicon/site.webmanifest`
    `/Users/seanivore/Development/freelance-payments/assets/favicon/web-app-manifest-192x192.png`
    `/Users/seanivore/Development/freelance-payments/assets/favicon/web-app-manifest-512x512.png`
    - Meta thumbnail is here: 
    `/Users/seanivore/Development/freelance-payments/assets/media/thumbnail-image-sean-august-horvath-freelance-payments.webp`
    - Meta title and description are already included in the `_config.yml` file that GitHub Pages/Jekyll uses to make the website URL proper 

### Client Project Scope 

  * **Overview of our Single-JSON architecture for building dynamic SPA on static site host** 

    - Client website we're developing is a small online store to sell artfully created miniature scenes 
    - The unique architecture was originally designed for building my portfolio 
    - Conceptually we're just replacing the "Project" JSON entries with "Product" JSON entries 
    - Using a 404-redirect trick, JS tells the site what content to dynamic load from JSON entries 
    - A GitHub Workflow and Claude Code GitHub automation updates the site's manifest.json 
    - Manifest.json and our JS tells the website what JSON entries there are and how to display their URLs 
    - A couple of HTML templates dynamically populate creating as many unique pages as there are JSON entries 
    - In this way we effectively run a SPA on a static web host 

  * **Detailed breakdown of Single-JSON architecture via the portfolio build's `AI_CONTEXT_PRIMER.md`** 

    - Read this document to fully understand how this architecture works for the portfolio 
    - You'll then need to understand how we'll be adjusting it for the client 
    - In understanding both we'll be able to investigate parallels to build into our payments micro-site
    - READ: `/Users/seanivore/Development/freelance-payments/assets/docs/planning-resources/AI_CONTEXT_PRIMER.md` 

  * **Specifics detailing the automation currently functional on the the portfolio `august.style` site** 

    - This is from the website described in the `AI_CONTEXT_PRIMER.md` you just read above 
    - Review the details and location of this file in the repository 
    - When planning "Payments Micro-Site Automations" section below reference when creating payment micro-site automations, if any
    - REMOVED FROM: `/Users/seanivore/Development/freelance-payments/.github/workflows/...` 
    - READ: `/Users/seanivore/Development/freelance-payments/assets/docs/planning-resources/manifest.yml`

  * **Comprehensive understanding of Stripe Development capabilities via their `llm.txt`** 

    - Stripe has robust development documentation and an API for all our needs 
    - It has been confirmed to work on static web hosts, specifically GitHub Pages that we'll be using 
    - READ: `/Users/seanivore/Development/freelance-payments/assets/docs/stripe_docs_llm.txt`

  * **Unique adjustments to build and automation for the client's store with Stripe**

  - Integrating payments to the client's site will require two updates to our JSON-file-update triggered manifest build automation

    1. **Stripe Webhook from Product Sale** triggers JSON file update, followed by original automation logic flow 
      - The Stripe event for a product sale must trigger a Stripe webhook 
      - Stripe webhook must activate Claude Code in GitHub to change the SKU-associated JSON file from "Quantity" "1" available to "0" available
      - After that change the repository will need to be pushed so the website reflects that product's JSON file change
      - The rest of the automation would run just like the original automation after a manual push
      - HTML Templates and JS that creates the dynamic content will interpret JSON file quantity value '0' as 'SOLD OUT' wherever defined 

    2. Original automation logic flow but first **update Stripe Catalog using Stripe API Call** 
      - Edited JSON directory repository push first triggers Stripe API call to add or update Stripe catalog, mirroring the JSON directory changes 
      - After call success, the current automation logic flow would run the same, having Claude Code write a new manifest.json the rebuild site 
      - This way any purchase button/page on the website will pull the proper price from the SKU match-up when someone goes to checkout 

### Freelance Project Payment Scope 

  * **Review resources and prepare contract template and invoice** 

    + Review collection of different templates I pulled from online sites for a variety of contract types 
      - Without getting over-the-top as one of the examples might have been, draft a new contract template 
      - Template should be worded broad enough to apply to website development, ongoing upkeep, broader consulting and contracting, marketing, etc. 
      - Leave space for the necessary details to be added in, and especially the larger gap for the Project Scope section 
    + Consider if there is a way for me to create the PDF with blanks to be filled in 
      - Provide a numbered list of the details for what is needed to complete the contract, before signing, for any project 
      - If we had those details, is there a Claude Code headless/GitHub automation possible to create 
      - We would need to end product to be a PDF; says online just "Generate a PDF" might work 
      - Or we should explore: *Third-Party Skills: Leverage custom skills, such as those converting Markdown to PDF with better typography, by triggering them with phrases like 'convert to PDF' or 'complete contract PDF'*
      - There are skills about making skills which might even be a good option 
    + In production of the contract, how can we automate the setup of Stripe using their API and Catalog for one-time charges 
      - There is a 'Stripe Invoice' built into their Dashboard, but it would not be free 
      - Ideally we'd be able to create the invoice at the same time as the contract, with the same input information 
      - Along with these things produced, we could create whatever format of file is needed to use the API setup 

    + Collection of templates with varying degrees of detail to pull from in creating our template: 
      `/Users/seanivore/Development/freelance-payments/assets/docs/contract-template-drafts/atpExample.md`
      `/Users/seanivore/Development/freelance-payments/assets/docs/contract-template-drafts/ClickUp Freelancing Contract Template.md`
      `/Users/seanivore/Development/freelance-payments/assets/docs/contract-template-drafts/Consulting Agreement Template.md`
      `/Users/seanivore/Development/freelance-payments/assets/docs/contract-template-drafts/Consulting agreement.md`
      `/Users/seanivore/Development/freelance-payments/assets/docs/contract-template-drafts/CONTRACT_TEMPLATE.md`
      `/Users/seanivore/Development/freelance-payments/assets/docs/contract-template-drafts/CONTRACTOR_AGREEMENT.md`
      `/Users/seanivore/Development/freelance-payments/assets/docs/contract-template-drafts/termsExample.md`

    + My information can be "Hardcoded" so to speak 
      - I'm no longer running thing through an LLC for now it is just Sole Proprietorship, not sure I need to include that detail, but I do know in Massachusetts it must be under my name (they charge for a sole proprietorship DBA here which is new to me) 
      - Details are as follows

      ```plaintext 
      Sean August Horvath 
      102 Lunenburg Ave 
      West Townsend MA 01474 
      +1 424-744-7687 
      sean@august.style 
      https://august.style 
      ```

  * **Consider means of adding custom one-time charge options to Stripe Catalog** 

    + We would need to have things like, first and second payment 
      - The SKU or client's last name could be used for them to find the "product" with their price 
      - But if we do this then is there a way to set it up that they'd just type it in to "find" their fee? their 'product'? 
      - I imagine someone must have done this before and using the custom Stripe UI development tools it feels like it should be possible 
    + Please research thoroughly before we finalize our plan so that we can hopefully figure out something as automated as possible 

  * **Once figured out and tested, we must use it for current client** 

    + We should then create a contract for the current client 
    + The copy of the Project Scope already created is far larger than we needed 
      READ: `/Users/seanivore/Development/freelance-payments/assets/docs/planning-resources/draft_long_PROJECT_SCOPE.md` 
    + And we have the costs to charge, which is paid part now, then a smaller remaining amount before going live 

### Payments Micro-Site Automations 

  * **Given what has been learned, what can we do to automate freelance billing needs, if anything** 

    + Create any `./github/workflows/<automation>.yml` needed that can help 
    + Record the plan as you would need if you picked up from here with no context 
    + Prepare any other documentation or templates or automation as needed 

  * **Implement, test, perfect, and then document again**

    + Update any of the above documentation to keep it accurate if any changed needed to be made to address bugs 
    + Then immediately to next section below to record any information learned here that will help the client's website build 
    + Write up the necessary automations if possible, fyc on these named .yml files: 
    `./github/workflows/product-sold-manifest-update.yml` and `./github/workflows/manifest-build-stripe-catalog-update.yml` 
    + Do any possible advanced legwork regarding the Stripe Webhook-based action triggering Claude Code in GitHub etc. 

### Retrospect After Completion 

  * **Create detailed documentation to help give client project a jump start** 
  
  + Based on what we learned and accomplished here 
  + Along with all the specific details provided regarding the two types of automations we'll need on the client site 
  + Record everything that will help AI do what needs to be done, knowing what you know now
  + Write what you would need to accomplish it if you didn't have any other context 
