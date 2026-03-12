import { logToSystem } from '../utils/logger';

export const CHARACTER_PROMPT_PREFIX = `iPhone 15 Pro Max 50mm lens. 
STRICT ADHERENCE TO REFERENCE PHOTOS: Always refer to the 10 uploaded reference images (5 of JAKOB, 5 of CRIX) for exact visual biometrics. The generated images must perfectly match the faces, physiques, and fur patterns shown in those specific photos.
JAKOB (Source of Truth): 186cm, 135kg power-builder physique, massive biceps, thick shoulders, natural prominent belly. Square jaw, thick well-groomed brown beard, wearing a signature blue baseball cap and white ribbed muscle tank. Face must be identical to the 5 reference photos of Jakob.
CRIX (Source of Truth): Majestic light-grey long-haired cat, silver tabby markings, extremely fluffy tail, regal and inquisitive expression, yellow-green eyes. Appearance must be identical to the 5 reference photos of Crix.
Lighting: Floor-level phone flash ('Creeper Flash'), high-contrast, dramatic shadows.
Environment: Varied urban and domestic settings. Home and garden, lush green suburbs, downtown high-rise with floor-to-ceiling glass, cozy basement apartment, industrial loft, raw concrete, minimalist urban transit. modern color real hyper real amateur photos`;

export interface GenerationSettings {
  model: string;
  aspectRatio: string;
  imageSize: string;
  safetySetting?: string;
  negativePrompt?: string;
  seed?: number | null;
  enhancePrompt?: boolean;
  promptEnhancementModel?: string;
  personGeneration?: string;
  referenceImages?: { url: string, mimeType: string }[];
  output_format?: string;
}

export async function generateLookbookImage(
  prompt: string, 
  settings: GenerationSettings = { model: 'flux-2-pro', aspectRatio: '1:1', imageSize: '1K' }
): Promise<{ url: string, model: string, id: string } | null> {
  const currentModel = settings.model;
  
  let fullPrompt = `${CHARACTER_PROMPT_PREFIX}\n\nSubject: ${prompt}`;

  if (settings.negativePrompt) {
    fullPrompt += `\n\nDO NOT INCLUDE: ${settings.negativePrompt}`;
  }

  if (currentModel === 'hidream' && fullPrompt.length > 1500) {
    fullPrompt = fullPrompt.substring(0, 1497) + "...";
  }

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        model: currentModel,
        aspectRatio: settings.aspectRatio,
        imageSize: settings.imageSize,
        seed: settings.seed,
        output_format: settings.output_format
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Backend returned ${response.status}`);
    }

    const data = await response.json();
    logToSystem(`Successfully generated with ${currentModel}`, 'success');
    let url = data.imageUrl;
    if (!url.startsWith('data:')) {
      url = `data:image/${settings.output_format || 'webp'};base64,${url}`;
    }
    return { url, model: data.model, id: data.id };
  } catch (error: any) {
    logToSystem(`Model ${currentModel} failed: ${error.message}`, 'error');
    throw error;
  }
}

export async function editImage(prompt: string, image: string, settings?: Partial<GenerationSettings>) {
  let finalPrompt = prompt;
  if (settings?.model === 'hidream' && finalPrompt.length > 1500) {
    finalPrompt = finalPrompt.substring(0, 1497) + "...";
  }

  const response = await fetch('/api/edit-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      prompt: finalPrompt, 
      image, 
      model: settings?.model,
      aspectRatio: settings?.aspectRatio,
      seed: settings?.seed,
      output_format: settings?.output_format
    })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Edit failed');
  }
  const data = await response.json();
  let url = data.imageUrl;
  if (!url.startsWith('data:')) {
    url = `data:image/${settings?.output_format || 'webp'};base64,${url}`;
  }
  return { ...data, imageUrl: url };
}
