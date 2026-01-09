import React, { useState } from 'react';
import { AppStep, StoryboardFrame, PropItem, StyleItem } from './types';
import { StoryboardEditor } from './components/StoryboardEditor';
import { PropsManager } from './components/PropsManager';
import { StyleManager } from './components/StyleManager';
import { Generator } from './components/Generator';
import { Layout, Palette, PenTool, Image as ImageIcon } from 'lucide-react';

const App = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.STORYBOARD);
  
  // State for all inputs
  const [storyboardFrames, setStoryboardFrames] = useState<StoryboardFrame[]>([]);
  const [propsList, setPropsList] = useState<PropItem[]>([]);
  const [stylesList, setStylesList] = useState<StyleItem[]>([]);

  const steps = [
    { id: AppStep.STORYBOARD, label: 'Storyboard', icon: PenTool },
    { id: AppStep.PROPS, label: 'Props', icon: Layout },
    { id: AppStep.STYLE, label: 'Style', icon: Palette },
    { id: AppStep.GENERATE, label: 'Generate', icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">S</div>
            <h1 className="text-lg font-bold tracking-tight">Gemini Storyboard Studio</h1>
         </div>
         <nav className="hidden md:flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {steps.map(step => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                return (
                    <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${
                            isActive 
                            ? 'bg-zinc-800 text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <Icon size={16} />
                        {step.label}
                    </button>
                )
            })}
         </nav>
      </header>
      
      {/* Mobile Nav */}
      <nav className="md:hidden flex overflow-x-auto border-b border-zinc-800 bg-zinc-900 p-2 gap-2">
         {steps.map(step => (
             <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`whitespace-nowrap px-4 py-2 rounded text-sm ${currentStep === step.id ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}
             >
                {step.label}
             </button>
         ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-4 md:p-6 max-w-7xl mx-auto w-full">
        {currentStep === AppStep.STORYBOARD && (
            <StoryboardEditor frames={storyboardFrames} setFrames={setStoryboardFrames} />
        )}
        {currentStep === AppStep.PROPS && (
            <PropsManager propsList={propsList} setPropsList={setPropsList} />
        )}
        {currentStep === AppStep.STYLE && (
            <StyleManager stylesList={stylesList} setStylesList={setStylesList} />
        )}
        {currentStep === AppStep.GENERATE && (
            <Generator 
                storyboard={storyboardFrames}
                propsList={propsList}
                stylesList={stylesList}
            />
        )}
      </main>
    </div>
  );
};

export default App;