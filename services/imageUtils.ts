import { PropItem, StoryboardFrame, StyleItem } from "../types";

const MAX_CANVAS_WIDTH = 2048; // Limit width for the model reference
const MAX_CANVAS_HEIGHT = 2048;

/**
 * Loads an image from a URL into an HTMLImageElement.
 * Handles CORS by attempting to load anonymously.
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => {
        // Fallback: If CORS fails, try without crossOrigin (will taint canvas, making toDataURL fail)
        // Ideally, we catch this earlier, but for this demo, we assume valid inputs.
        // If it's a blob URL (upload), it works fine.
        console.warn("Image load error, retrying without CORS might taint canvas", e);
        reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
};

/**
 * Merges storyboard frames into a comic-strip style layout with labels.
 */
export const mergeStoryboard = async (frames: StoryboardFrame[]): Promise<string> => {
  if (frames.length === 0) return '';

  // Sort by order
  const sortedFrames = [...frames].sort((a, b) => a.order - b.order);
  
  // Calculate grid
  const cols = Math.min(sortedFrames.length, 3);
  const rows = Math.ceil(sortedFrames.length / cols);
  
  // Assume consistent frame size for simplicity, or scale to fit
  // We'll base unit size on the first frame or a default
  const frameWidth = 640;
  const frameHeight = 360; // 16:9 aspect mostly
  const padding = 40;
  const labelHeight = 40;

  const canvasWidth = (frameWidth * cols) + (padding * (cols + 1));
  const canvasHeight = (frameHeight * rows) + (labelHeight * rows) + (padding * (rows + 1));

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';

  for (let i = 0; i < sortedFrames.length; i++) {
    const frame = sortedFrames[i];
    const img = await loadImage(frame.imageData);
    
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = padding + col * (frameWidth + padding);
    const y = padding + row * (frameHeight + labelHeight + padding);

    // Draw Image (scale to fit target box)
    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, frameWidth, frameHeight);
    
    // Draw Label
    const labelY = y + frameHeight + 30;
    ctx.fillText(`Frame ${i + 1}`, x + frameWidth / 2, labelY);
  }

  return canvas.toDataURL('image/png');
};

/**
 * Merges props into a single sheet with descriptions.
 */
export const mergeProps = async (props: PropItem[]): Promise<string> => {
  if (props.length === 0) return '';

  const cols = Math.min(props.length, 2);
  const rows = Math.ceil(props.length / cols);

  const boxWidth = 500;
  const boxHeight = 500;
  const padding = 20;
  const textSpace = 100; // Space for description

  const canvasWidth = (boxWidth * cols) + (padding * (cols + 1));
  const canvasHeight = (boxHeight * rows) + (textSpace * rows) + (padding * (rows + 1));

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context error");

  ctx.fillStyle = '#f3f4f6'; // Light gray background
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.fillStyle = '#111827';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    try {
      const img = await loadImage(prop.url);
      
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const x = padding + col * (boxWidth + padding);
      const y = padding + row * (boxHeight + textSpace + padding);

      // Maintain aspect ratio within box
      const scale = Math.min(boxWidth / img.width, boxHeight / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const offsetX = (boxWidth - w) / 2;
      const offsetY = (boxHeight - h) / 2;

      // Draw white bg for image
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, boxWidth, boxHeight);
      
      ctx.drawImage(img, 0, 0, img.width, img.height, x + offsetX, y + offsetY, w, h);
      
      // Text
      ctx.fillStyle = '#000000';
      // Simple text wrapping or truncation
      const label = `Prop ${i + 1}: ${prop.description}`;
      ctx.fillText(label, x + boxWidth / 2, y + boxHeight + 10, boxWidth);
    } catch (e) {
      console.error("Skipping prop due to load error", prop);
    }
  }

  return canvas.toDataURL('image/png');
};

/**
 * Merges style images into a collage.
 */
export const mergeStyles = async (styles: StyleItem[]): Promise<string> => {
  if (styles.length === 0) return '';

  const cols = Math.min(styles.length, 3);
  const rows = Math.ceil(styles.length / cols);

  const boxSize = 400;
  const padding = 0; // Collage style, tight packing

  const canvasWidth = boxSize * cols;
  const canvasHeight = boxSize * rows;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context error");

  for (let i = 0; i < styles.length; i++) {
    try {
        const img = await loadImage(styles[i].url);
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Center crop
        const scale = Math.max(boxSize / img.width, boxSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (col * boxSize) - (w - boxSize) / 2;
        const y = (row * boxSize) - (h - boxSize) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.rect(col * boxSize, row * boxSize, boxSize, boxSize);
        ctx.clip();
        ctx.drawImage(img, 0, 0, img.width, img.height, x, y, w, h);
        ctx.restore();
    } catch (e) {
        console.error("Skipping style image", styles[i]);
    }
  }

  return canvas.toDataURL('image/png');
};