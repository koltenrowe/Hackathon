import React, { useEffect, useState } from 'react';
import { StoryboardFrame, PropItem, StyleItem } from '../types';
import { mergeStoryboard, mergeProps, mergeStyles } from '../services/imageUtils';
import { generateStoryboardImage, optimizePrompt } from '../services/gemini';
import { Loader2, Image as ImageIcon, AlertTriangle, CheckCircle2, Download, Wand2 } from 'lucide-react';

interface Props {
  storyboard: StoryboardFrame[];
  propsList: PropItem[];
  stylesList: StyleItem[];
}

export const Generator: React.FC<Props> = ({ storyboard, propsList, stylesList }) => {
  const [combinedStoryboard, setCombinedStoryboard] = useState<string>('');
  const [combinedProps, setCombinedProps] = useState<string>('');
  const [combinedStyle, setCombinedStyle] = useState<string>('');
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'idle' | 'enhancing' | 'rendering'>('idle');
  const [resultImageUrl, setResultImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processImages = async () => {
      setIsLoadingImages(true);
      setError(null);
      try {
        const [sb, pr, st] = await Promise.all([
          mergeStoryboard(storyboard),
          mergeProps(propsList),
          mergeStyles(stylesList)
        ]);
        setCombinedStoryboard(sb);
        setCombinedProps(pr);
        setCombinedStyle(st);
      } catch (err: any) {
        setError("Failed to process reference images. Ensure web URLs allow CORS or use file uploads.");
        console.error(err);
      } finally {
        setIsLoadingImages(false);
      }
    };
    processImages();
  }, [storyboard, propsList, stylesList]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
        setError("Please enter a text prompt to describe the scene.");
        return;
    }
    setError(null);
    setIsGenerating(true);
    setGenerationStep('enhancing');

    try {
        // Ensure API Key selection if running in AI Studio environment
        // If not in AI Studio, we assume the fallback key in services/gemini.ts is used
        if ((window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
            }
        }

        // Step 1: Optimize Prompt using Gemini 3 Flash
        const propDescs = propsList.map(p => p.description).filter(Boolean);
        const enhancedPrompt = await optimizePrompt(prompt, propDescs);
        console.log("Enhanced Prompt:", enhancedPrompt);
        
        setGenerationStep('rendering');

        // Step 2: Generate Image using Gemini 3 Pro Image
        const imageUrl = await generateStoryboardImage(
            enhancedPrompt,
            combinedStoryboard,
            combinedProps,
            combinedStyle
        );
        setResultImageUrl(imageUrl);
    } catch (err: any) {
        // Handle race condition or expired key in AI Studio environment
        if (err.message && err.message.includes("Requested entity was not found") && (window as any).aistudio) {
            try {
                // Retry key selection
                await (window as any).aistudio.openSelectKey();
                
                // Retry flow
                const propDescs = propsList.map(p => p.description).filter(Boolean);
                const enhancedPrompt = await optimizePrompt(prompt, propDescs);
                setGenerationStep('rendering');
                const imageUrl = await generateStoryboardImage(enhancedPrompt, combinedStoryboard, combinedProps, combinedStyle);
                setResultImageUrl(imageUrl);
                return;
            } catch (retryErr: any) {
                setError(retryErr.message || "Failed to generate image.");
            }
        } else {
            setError(err.message || "An unknown error occurred.");
        }
    } finally {
        setIsGenerating(false);
        setGenerationStep('idle');
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <h2 className="text-xl font-bold text-white">Generate Final Storyboard</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto pr-2 pb-20">
          
          {/* Left Col: Inputs & Preview */}
          <div className="flex flex-col gap-6">
             <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                <label className="block text-zinc-400 text-sm font-bold mb-2">Scene Description</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-indigo-500 focus:outline-none resize-none"
                    placeholder="Describe the action, lighting, mood, and specific details you want in the final rendered storyboard..."
                />
                
                {error && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded flex items-center gap-2 text-sm">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || isLoadingImages}
                    className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isGenerating ? (
                        <>
                          <Loader2 className="animate-spin" /> 
                          {generationStep === 'enhancing' ? 'Enhancing Prompt (Gemini Flash)...' : 'Rendering (Gemini Pro Image)...'}
                        </>
                    ) : (
                        <><Wand2 size={18} /> Generate Storyboard</>
                    )}
                </button>
                
                <p className="mt-2 text-xs text-zinc-500 text-center">
                    Uses <span className="text-zinc-300">gemini-3-flash-preview</span> for prompt refinement and <span className="text-zinc-300">gemini-3-pro-image-preview</span> for generation.
                </p>
             </div>

             {/* Previews of the merged inputs */}
             <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-300">Reference Inputs (Merged)</h3>
                
                {isLoadingImages ? (
                    <div className="p-8 text-center text-zinc-500"><Loader2 className="animate-spin inline mr-2"/> Compiling references...</div>
                ) : (
                    <>
                        <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                            <span className="text-xs text-zinc-500 mb-1 block">Ref 1: Layout (Structure)</span>
                            {combinedStoryboard ? (
                                <img src={combinedStoryboard} alt="Storyboard Merged" className="w-full rounded bg-white" />
                            ) : <span className="text-zinc-600 text-xs italic">No storyboard data</span>}
                        </div>
                         <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                            <span className="text-xs text-zinc-500 mb-1 block">Ref 2: Props (Assets)</span>
                            {combinedProps ? (
                                <img src={combinedProps} alt="Props Merged" className="w-full rounded bg-white" />
                            ) : <span className="text-zinc-600 text-xs italic">No props data</span>}
                        </div>
                         <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                            <span className="text-xs text-zinc-500 mb-1 block">Ref 3: Style (Look & Feel)</span>
                            {combinedStyle ? (
                                <img src={combinedStyle} alt="Style Merged" className="w-full rounded bg-white" />
                            ) : <span className="text-zinc-600 text-xs italic">No style data</span>}
                        </div>
                    </>
                )}
             </div>
          </div>

          {/* Right Col: Result */}
          <div className="bg-black rounded-lg border border-zinc-800 flex flex-col items-center justify-center min-h-[400px] lg:h-auto sticky top-0 overflow-hidden">
             {resultImageUrl ? (
                <div className="w-full h-full flex flex-col p-4">
                     <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><CheckCircle2 /> Render Complete</h3>
                     <div className="relative group">
                        <img 
                            src={resultImageUrl} 
                            alt="Generated Storyboard" 
                            className="w-full h-auto rounded-lg shadow-2xl border border-zinc-700"
                        />
                        <a 
                            href={resultImageUrl} 
                            download="storyboard_render.png" 
                            className="absolute bottom-4 right-4 bg-zinc-900/80 text-white p-2 rounded-full hover:bg-indigo-600 transition-colors shadow-lg"
                            title="Download"
                        >
                            <Download size={20} />
                        </a>
                     </div>
                </div>
             ) : (
                <div className="text-center p-8">
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 border-4 border-indigo-900 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-zinc-400 animate-pulse">
                                {generationStep === 'enhancing' ? 'Refining your ideas...' : 'Synthesizing Storyboard...'}
                            </p>
                            <p className="text-zinc-600 text-xs max-w-xs">
                                {generationStep === 'enhancing' 
                                    ? 'Gemini Flash is optimizing your prompt...' 
                                    : 'Gemini Pro Image is generating the final visual...'}
                            </p>
                        </div>
                    ) : (
                        <div className="text-zinc-600 flex flex-col items-center">
                            <ImageIcon size={48} className="mb-4 opacity-50" />
                            <p>Your generated storyboard will appear here.</p>
                        </div>
                    )}
                </div>
             )}
          </div>

       </div>
    </div>
  );
};