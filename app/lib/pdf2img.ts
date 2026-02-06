export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  isLoading = true;
  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    // Use the worker from node_modules to ensure version compatibility
    import.meta.url;
    lib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    console.log("PDF.js loaded successfully with worker:", lib.GlobalWorkerOptions.workerSrc);
    pdfjsLib = lib;
    isLoading = false;
    return lib;
  }).catch((err) => {
    console.error("Failed to load PDF.js:", err);
    isLoading = false;
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    console.log("Starting PDF conversion for:", file.name);
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    console.log("PDF file buffer size:", arrayBuffer.byteLength);
    
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    console.log("PDF loaded, pages:", pdf.numPages);
    
    const page = await pdf.getPage(1);
    console.log("Page 1 retrieved");

    const viewport = page.getViewport({ scale: 4 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Failed to get 2D canvas context");
      return {
        imageUrl: "",
        file: null,
        error: "Failed to get canvas context",
      };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    console.log("Rendering page, canvas size:", canvas.width, "x", canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    console.log("Page rendered successfully");

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("Blob created, size:", blob.size);
            // Create a File from the blob with the same name as the pdf
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            console.error("Failed to create blob from canvas");
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob",
            });
          }
        },
        "image/png",
        1.0
      ); // Set quality to maximum (1.0)
    });
  } catch (err) {
    console.error("PDF conversion error:", err);
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}