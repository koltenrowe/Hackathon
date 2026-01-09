import { GoogleGenAI } from "@google/genai";

// Use the provided key as a fallback if the environment variable is missing
const API_KEY = process.env.API_KEY || "AIzaSyDm9sZ8HSEIv7_Z6Y3us85uykGdr7OIBxA";

/**
 * Uses Gemini 3 Flash to enhance the user's simple prompt into a detailed visual description.
 */
export const optimizePrompt = async (
  userPrompt: string,
  propDescriptions: string[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const context = propDescriptions.length > 0 
        ? `The scene involves these specific props which have been provided as reference images: ${propDescriptions.join(', ')}.`
        : '';

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert storyboard artist assistant.
        
        Task: Rewrite the user's scene description into a highly detailed, visually rich prompt suitable for a high-end image generation model. 
        Focus on composition, lighting, camera angle, and action.
        ${context}
        
        Original Description: "${userPrompt}"
        
        Output ONLY the enhanced description text. Do not include explanations.`
    });

    return response.text?.trim() || userPrompt;
  } catch (e) {
    console.warn("Prompt optimization failed, falling back to original prompt", e);
    return userPrompt;
  }
}

/**
 * Uses Gemini 3 Pro Image Preview to generate the final storyboard sheet.
 */
export const generateStoryboardImage = async (
  prompt: string,
  storyboardBase64: string,
  propsBase64: string,
  styleBase64: string
): Promise<string> => {
  // Use a fresh instance with the resolved key
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Construct the prompt with clear instructions for each input
  const textPrompt = `Generate a high-fidelity, production-ready storyboard sheet based on the provided reference images.
  
  STRICTLY FOLLOW THESE REFERENCE ROLES:
  1. LAYOUT REFERENCE (The image with panels labeled "Frame X"): Use this strictly for composition, camera angles, and sequence. Preserve the number of panels and their arrangement.
  2. PROP REFERENCE (The image with items labeled "Prop X"): Use these specific character/object designs within the scene.
  3. STYLE REFERENCE (The collage/artistic image): Apply this visual art style (rendering, lighting, textures) to the final output.

  SCENE DESCRIPTION: ${prompt}`;

  const parts: any[] = [{ text: textPrompt }];

  // Append images. The model is multimodal and will analyze all image parts.
  if (storyboardBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: storyboardBase64.split(',')[1]
      }
    });
  }

  if (propsBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: propsBase64.split(',')[1]
      }
    });
  }

  if (styleBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: styleBase64.split(',')[1]
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: '16:9', // Wide format for the storyboard sheet
          imageSize: '2K'      // High quality
        }
      }
    });

    // Check for image in the response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image was generated. The model might have refused the request due to safety policies.");

  } catch (error: any) {
    console.error("Gemini Image Gen Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API Key invalid or expired. Please re-select key.");
    }
    throw error;
  }
};