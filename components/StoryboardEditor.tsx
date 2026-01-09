import React, { useRef, useState, useEffect } from 'react';
import { StoryboardFrame } from '../types';
import { Trash2, Plus, ArrowLeft, ArrowRight, Eraser, Pen } from 'lucide-react';

interface Props {
  frames: StoryboardFrame[];
  setFrames: React.Dispatch<React.SetStateAction<StoryboardFrame[]>>;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;

export const StoryboardEditor: React.FC<Props> = ({ frames, setFrames }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(5);
  
  // Initialize first frame if empty
  useEffect(() => {
    if (frames.length === 0) {
      const blank = document.createElement('canvas');
      blank.width = CANVAS_WIDTH;
      blank.height = CANVAS_HEIGHT;
      const ctx = blank.getContext('2d');
      if (ctx) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      setFrames([{
        id: crypto.randomUUID(),
        imageData: blank.toDataURL(),
        order: 0
      }]);
    }
  }, [frames.length, setFrames]);

  // Load current frame into canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (frames[currentFrameIndex]) {
        const img = new Image();
        img.src = frames[currentFrameIndex].imageData;
        img.onload = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.drawImage(img, 0, 0);
        };
    }
  }, [currentFrameIndex, frames]);

  const saveCurrentFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newData = canvas.toDataURL();
    
    setFrames(prev => prev.map((f, i) => 
      i === currentFrameIndex ? { ...f, imageData: newData } : f
    ));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if(canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.beginPath(); // Reset path
    }
    saveCurrentFrame();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : '#000000';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const addNewFrame = () => {
    // Save current before switching just in case
    saveCurrentFrame();
    
    const blank = document.createElement('canvas');
    blank.width = CANVAS_WIDTH;
    blank.height = CANVAS_HEIGHT;
    const ctx = blank.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    const newFrame: StoryboardFrame = {
      id: crypto.randomUUID(),
      imageData: blank.toDataURL(),
      order: frames.length
    };
    
    setFrames(prev => [...prev, newFrame]);
    setCurrentFrameIndex(frames.length);
  };

  const deleteFrame = () => {
    if (frames.length <= 1) return; // Keep at least one
    const newFrames = frames.filter((_, i) => i !== currentFrameIndex);
    setFrames(newFrames);
    setCurrentFrameIndex(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Storyboard Creator</h2>
        <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">Frame {currentFrameIndex + 1} of {frames.length}</span>
            <button onClick={deleteFrame} disabled={frames.length <= 1} className="p-2 bg-red-900/50 text-red-200 rounded hover:bg-red-900 disabled:opacity-50">
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative">
         <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onMouseMove={draw}
            className="cursor-crosshair bg-white shadow-lg"
         />
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-900 p-4 rounded-lg flex items-center justify-between">
        <div className="flex gap-4 items-center">
            <div className="flex bg-zinc-800 rounded p-1">
                <button 
                    onClick={() => setTool('pen')}
                    className={`p-2 rounded ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                    <Pen size={20} />
                </button>
                <button 
                    onClick={() => setTool('eraser')}
                    className={`p-2 rounded ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                    <Eraser size={20} />
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase font-bold">Size</span>
                <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24 accent-indigo-500"
                />
            </div>
        </div>

        <div className="flex gap-2">
             <button 
                onClick={() => {saveCurrentFrame(); setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}} 
                disabled={currentFrameIndex === 0}
                className="p-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 disabled:opacity-30"
            >
                <ArrowLeft size={20} />
            </button>
            <button 
                onClick={() => {saveCurrentFrame(); setCurrentFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1))}} 
                disabled={currentFrameIndex === frames.length - 1}
                className="p-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 disabled:opacity-30"
            >
                <ArrowRight size={20} />
            </button>
            <button 
                onClick={addNewFrame}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-500"
            >
                <Plus size={18} /> Add Frame
            </button>
        </div>
      </div>
    </div>
  );
};