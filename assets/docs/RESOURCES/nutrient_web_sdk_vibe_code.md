# Vibe code with Nutrient Web SDK

This guide shows how to use AI code assistants to [vibe code](https://x.com/karpathy/status/1886192184808149383?s=61) with Nutrient Web SDK to:

- Embed [Nutrient Web SDK viewer](https://www.nutrient.io/guides/web/viewer/) to render, annotate, and edit PDFs directly in the browser.

- Customize the viewer’s user interface (UI) and behavior with minimal human-written code.

**Test without installing**

You can test the SDK capabilities in our playground.

[Read more](https://www.nutrient.iohttps://nutrient.io/playground/)

**View example**

Prefer to jump straight into code? View the example repo on GitHub.

[Read more](https://www.nutrient.iohttps://github.com/PSPDFKit/nutrient-web-examples/tree/main?tab=readme-ov-file#nutrient-web-sdk-examples)

## How AI-powered coding works with Nutrient Web SDK

**Steps:**

1. **Set up your environment** — Choose a development environment such as [Claude Code](https://www.anthropic.com/claude-code), [Replit](https://replit.com/), or [Lovable.dev](https://lovable.dev/). This guide focuses on the CLI tool [Claude Code](https://www.anthropic.com/claude-code).

2. **Prime the prompt** — Use the template below to set up your initial prompt, adjusting it as desired:

   ```

   1. Use the documentation from these URLs: [Nutrient Web SDK top-level guide](https://www.nutrient.io/guides/web/), [API reference](https://www.nutrient.io/api/web/), and [getting started guides](https://www.nutrient.io/sdk/web/getting-started/). Read and crawl them thoroughly to understand available classes and methods.
   2. Create a minimal React + Vite application.
   3. Integrate Nutrient Web SDK using the documentation provided. Use an empty string for the license key.
      > Pro tip: Refer to the [troubleshooting guide](https://www.nutrient.io/guides/web/troubleshooting/common-issues/) to find solutions if you encounter any issues when integrating Nutrient Web SDK.
   4. Display a [sample PDF](https://www.nutrient.io/downloads/nutrient-web-demo.pdf) in the browser on localhost.
   ```

> Alternatively you can include the prompt above in your [`CLAUDE.md`](https://www.anthropic.com/engineering/claude-code-best-practices) file, alongside any other prompts for your project. Note that PDFs rendered in trial mode include a watermark. For production use, contact our [Sales team](https://www.nutrient.io/contact-sales).

## SDK customization prompts

Once the basic setup is complete, you can try the following sample prompts to customize the Nutrient Web SDK viewer as per your needs.

| Task                                                                                                                                | One-line prompt to instruct the LLM                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI customization**                                                                                                                |                                                                                                                                                                                                                                                                   |
| [Toggle dark mode](https://www.nutrient.io/guides/web/knowledge-base/how-do-i-toggle-the-theme/)                                    | Add a button that switches the viewer between light and dark themes. For more information, refer to the [toggle dark mode](https://www.nutrient.io/guides/web/knowledge-base/how-do-i-toggle-the-theme/) guide.                                                   |
| [Limit toolbars](https://www.nutrient.io/guides/web/user-interface/annotation-toolbar/remove-a-tool/)                               | Hide all annotation tools except the highlighter and free text note. For more information, refer to the [limit toolbars](https://www.nutrient.io/guides/web/user-interface/annotation-toolbar/remove-a-tool/) guide.                                              |
| [Localize the UI](https://www.nutrient.io/guides/web/features/localization/)                                                        | Load the German language pack (or any of your preferred languages) and default the viewer to it. For more information, refer to the [localization](https://www.nutrient.io/guides/web/features/localization/) guide.                                              |
| **Features and functionality**                                                                                                      |                                                                                                                                                                                                                                                                   |
| [Signature capture](https://www.nutrient.io/guides/web/signatures/adding-an-electronic-signature/)                                  | Add a **Sign** button that inserts a hand-drawn signature on the current page. For more information, refer to the [signature capture](https://www.nutrient.io/guides/web/signatures/adding-an-electronic-signature/) guide.                                       |
| [Form filling](https://www.nutrient.io/guides/web/forms/form-filling/)                                                              | Enable interactive PDF form filling with validation and data persistence. For more information, refer to the [form filling](https://www.nutrient.io/guides/web/forms/form-filling/) guide.                                                                        |
| [Annotation tools](https://www.nutrient.io/guides/web/annotations/create-edit-and-remove/create/)                                   | Set up comprehensive annotation toolbars with highlights, notes, stamps, and drawing tools. For more information, refer to the [annotation tools](https://www.nutrient.io/guides/web/annotations/create-edit-and-remove/create/) guide.                           |
| [Document editing](https://www.nutrient.io/guides/web/features/document-editor-ui/#entering-document-editing-mode-programmatically) | Enable PDF document editing features like merging, splitting, and reordering pages. For more information, refer to the [document editing](https://www.nutrient.io/guides/web/features/document-editor-ui/#entering-document-editing-mode-programmatically) guide. |

> When Claude Code makes errors or uses outdated code, manually copy the correct code snippet from the official guides and paste it in your prompt with instructions like “Use this exact code instead” to correct the implementation.

## Next steps

You can also explore the following resources to enhance your Nutrient Web SDK experience:

- [View all get started options](https://www.nutrient.io/sdk/web/getting-started/)

- [Browse guides](https://www.nutrient.io/guides/web/intro/#guides)

- [Browse code samples](https://www.nutrient.io/guides/web/samples/)
