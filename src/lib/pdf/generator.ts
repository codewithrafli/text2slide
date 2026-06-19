import jsPDF from 'jspdf';
import { toCanvas } from 'html-to-image';

// PDF dimensions in mm (4:5 aspect ratio like LinkedIn carousel)
const PDF_WIDTH = 108; // mm (1080px / 10)
const PDF_HEIGHT = 135; // mm (1350px / 10)

export type CarouselStyle = 'minimalist' | 'dark' | 'storyteller';

/**
 * Generate a high-resolution LinkedIn carousel PDF by capturing DOM elements
 */
export async function generateLinkedInPDF(
  slideElementIds: string[],
  style: CarouselStyle = 'minimalist'
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [PDF_WIDTH, PDF_HEIGHT],
    compress: true,
  });

  for (let i = 0; i < slideElementIds.length; i++) {
    const element = document.getElementById(slideElementIds[i]);
    if (!element) continue;

    if (i > 0) {
      pdf.addPage([PDF_WIDTH, PDF_HEIGHT]);
    }

    // Capture the element as a high-resolution canvas (Retina standard)
    const canvas = await toCanvas(element, {
      pixelRatio: 2.0, // 2x is the sweet spot for HD without massive file size
      skipFonts: false,
      backgroundColor: style === 'minimalist' ? '#ffffff' : '#000000',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG for speed & sharpness
    pdf.addImage(
      imgData,
      'JPEG',
      0,
      0,
      PDF_WIDTH,
      PDF_HEIGHT,
      undefined,
      'FAST' // Fast embedding to prevent browser hang
    );
  }

  return pdf.output('blob');
}

export function downloadPDF(
  blob: Blob,
  filename: string = 'link2slide-post.pdf'
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
