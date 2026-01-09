import React, { useState } from 'react';
import { StyleItem } from '../types';
import { Trash2, Plus, Upload, Link } from 'lucide-react';

interface Props {
  stylesList: StyleItem[];
  setStylesList: React.Dispatch<React.SetStateAction<StyleItem[]>>;
}

export const StyleManager: React.FC<Props> = ({ stylesList, setStylesList }) => {
  const [newUrl, setNewUrl] = useState('');
  const [inputType, setInputType] = useState<'url' | 'file'>('url');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      const newItem: StyleItem = {
        id: crypto.randomUUID(),
        url: blobUrl,
        isUpload: true
      };
      setStylesList([...stylesList, newItem]);
    }
  };

  const handleUrlAdd = () => {
    if (!newUrl) return;
    const newItem: StyleItem = {
      id: crypto.randomUUID(),
      url: newUrl,
      isUpload: false
    };
    setStylesList([...stylesList, newItem]);
    setNewUrl('');
  };

  const removeItem = (id: string) => {
    setStylesList(stylesList.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <h2 className="text-xl font-bold text-white">Style Reference</h2>
       <p className="text-zinc-400 text-sm">Add images that represent the artistic style, color palette, or mood you want.</p>

       <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 flex flex-col gap-4">
          <div className="flex gap-4 border-b border-zinc-800 pb-4 mb-2">
             <button 
                onClick={() => setInputType('url')}
                className={`flex items-center gap-2 pb-2 px-2 border-b-2 transition-colors ${inputType === 'url' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500'}`}
             >
                <Link size={16} /> Web URL
             </button>
             <button 
                onClick={() => setInputType('file')}
                className={`flex items-center gap-2 pb-2 px-2 border-b-2 transition-colors ${inputType === 'file' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500'}`}
             >
                <Upload size={16} /> File Upload
             </button>
          </div>

          <div className="flex gap-4">
             {inputType === 'url' ? (
                 <input 
                    type="text" 
                    placeholder="https://example.com/style.jpg"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-indigo-500 focus:outline-none"
                 />
             ) : (
                 <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded p-1.5 text-zinc-400 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                 />
             )}
              {inputType === 'url' && (
                <button 
                    onClick={handleUrlAdd}
                    disabled={!newUrl}
                    className="bg-indigo-600 text-white px-6 rounded hover:bg-indigo-500 disabled:opacity-50"
                >
                    <Plus size={20} />
                </button>
             )}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
          {stylesList.map((item) => (
            <div key={item.id} className="aspect-square bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 group relative">
                <img src={item.url} alt="Style Ref" className="h-full w-full object-cover" />
                <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-500"
                >
                    <Trash2 size={14} />
                </button>
            </div>
          ))}
          
           {stylesList.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center h-40 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-lg">
                <p>No style references added.</p>
             </div>
          )}
       </div>
    </div>
  );
};