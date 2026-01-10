# Getting started with PDF.js

1. Install PDF.js

```bash
npm install pdfjs-dist
```

2. Create a useEffect hook to load and render a PDF page in your React component

```javascript
"use client";
import { useEffect, useRef } from "react";

export default function App() {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null); // Ref to store the current render task.

  useEffect(() => {
    let isCancelled = false;

    (async function () {
      // Import pdfjs-dist dynamically for client-side rendering.
      const pdfJS = await import("pdfjs-dist/build/pdf");

      // Set up the worker.
      pdfJS.GlobalWorkerOptions.workerSrc =
        window.location.origin + "/pdf.worker.min.mjs";

      // Load the PDF document.
      const pdf = await pdfJS.getDocument("example.pdf").promise;

      // Get the first page.
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });

      // Prepare the canvas.
      const canvas = canvasRef.current;
      const canvasContext = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Ensure no other render tasks are running.
      if (renderTaskRef.current) {
        await renderTaskRef.current.promise;
      }

      // Render the page into the canvas.
      const renderContext = { canvasContext, viewport };
      const renderTask = page.render(renderContext);

      // Store the render task.
      renderTaskRef.current = renderTask;

      // Wait for rendering to finish.
      try {
        await renderTask.promise;
      } catch (error) {
        if (error.name === "RenderingCancelledException") {
          console.log("Rendering cancelled.");
        } else {
          console.error("Render error:", error);
        }
      }

      if (!isCancelled) {
        console.log("Rendering completed");
      }
    })();

    // Cleanup function to cancel the render task if the component unmounts.
    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, []);

  return <canvas ref={canvasRef} style={{ height: "100vh" }} />;
}