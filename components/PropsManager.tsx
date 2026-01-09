import React, { useState } from 'react';
import { PropItem } from '../types';
import { Trash2, Plus, Upload, Link } from 'lucide-react';

interface Props {
  propsList: PropItem[];
  setPropsList: React.Dispatch<React.SetStateAction<PropItem[]>>;
}

export const PropsManager: React.FC<Props> = ({ propsList, setPropsList }) => {
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [inputType, setInputType] = useState<'url' | 'file'>('url');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      const newItem: PropItem = {
        id: crypto.randomUUID(),
        url: blobUrl,
        description: newDesc || file.name,
        isUpload: true
      };
      setPropsList([...propsList, newItem]);
      setNewDesc('');
      // Reset file input value manually if needed, but here simple is fine
    }
  };

  const handleUrlAdd = () => {
    if (!newUrl) return;
    const newItem: PropItem = {
      id: crypto.randomUUID(),
      url: newUrl,
      description: newDesc,
      isUpload: false
    };
    setPropsList([...propsList, newItem]);
    setNewUrl('');
    setNewDesc('');
  };

  const removeItem = (id: string) => {
    setPropsList(propsList.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <h2 className="text-xl font-bold text-white">Props Manager</h2>
       <p className="text-zinc-400 text-sm">Add images of objects, characters, or items you want in the animation. Add a description for better labeling.</p>

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
                    placeholder="https://example.com/image.png"
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
          </div>
          
          <div className="flex gap-4">
             <input 
                type="text" 
                placeholder="Description (e.g., 'Red futuristic sword')"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-indigo-500 focus:outline-none"
             />
             {inputType === 'url' && (
                <button 
                    onClick={handleUrlAdd}
                    disabled={!newUrl}
                    className="bg-indigo-600 text-white px-6 rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus size={20} />
                </button>
             )}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {propsList.map((item) => (
            <div key={item.id} className="bg-zinc-800 rounded-lg overflow-hidden flex flex-col border border-zinc-700 group relative">
                <div className="h-40 bg-zinc-950 flex items-center justify-center overflow-hidden">
                    <img src={item.url} alt={item.description} className="h-full w-full object-contain" />
                </div>
                <div className="p-3">
                    <p className="text-white font-medium text-sm truncate" title={item.description}>{item.description || "No description"}</p>
                    <p className="text-zinc-500 text-xs truncate">{item.isUpload ? 'Local Upload' : 'Web URL'}</p>
                </div>
                <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-500"
                >
                    <Trash2 size={14} />
                </button>
            </div>
          ))}
          
          {propsList.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center h-40 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-lg">
                <p>No props added yet.</p>
             </div>
          )}
       </div>
    </div>
  );
};