import React, { useState, useEffect, useRef } from 'react';
import { useCms } from '../context/CmsContext';
import { cn } from '../../utils/cn';
import { ImagePlus, Link } from 'lucide-react';

export { cn };

interface EditableTextProps {
  path: string;
  className?: string;
  multiline?: boolean;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}

export const EditableText: React.FC<EditableTextProps> = ({ path, className, multiline, tag: Tag = 'span' }) => {
  const { data, updateData } = useCms();
  const isAdmin = data.isAdmin;
  
  // Resolve value from path
  const keys = path.split('.');
  let value = data as any;
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    }
  }

  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || '');
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempValue !== value) {
      updateData(path, tempValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    }
    if (e.key === 'Escape') {
      setTempValue(value || '');
      setIsEditing(false);
    }
  };

  const displayValue = (typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''));

  if (isAdmin) {
    if (isEditing) {
      const stringValue = typeof tempValue === 'object' ? JSON.stringify(tempValue) : String(tempValue ?? '');
      return multiline ? (
        <textarea
          ref={inputRef}
          value={stringValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn('w-full bg-slate-800 text-white border border-emerald-500 rounded p-1 outline-none min-h-[100px]', className)}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={stringValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn('w-full bg-slate-800 text-white border border-emerald-500 rounded p-1 outline-none', className)}
        />
      );
    }

    return (
      <Tag
        onClick={() => setIsEditing(true)}
        className={cn('cursor-pointer hover:outline hover:outline-dashed hover:outline-emerald-500 hover:outline-2 rounded transition-all inline-block min-w-[20px] min-h-[1em]', className)}
        title="Klik untuk mengedit"
      >
        {displayValue}
      </Tag>
    );
  }

  return <Tag className={className}>{displayValue}</Tag>;
};

// Simple Editable List string array renderer
export const EditableList: React.FC<{
    path: string; // Path to array of strings
    className?: string;
    itemClassName?: string;
    renderItem: (text: string, index: number) => React.ReactNode;
}> = ({ path, className, itemClassName, renderItem }) => {
    const { data, updateData } = useCms();
    const isAdmin = data.isAdmin;
    
    const keys = path.split('.');
    let items = data as any;
    for (const k of keys) {
        if (items && typeof items === 'object') {
            items = items[k];
        }
    }

    if (!Array.isArray(items)) return null;

    // Only show default editable list for simple string arrays
    const isStringArray = items.length === 0 || typeof items[0] === 'string';

    if (isAdmin && isStringArray) {
        return (
            <div className={cn("space-y-2", className)}>
                {items.map((_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <EditableText path={`${path}.${i}`} tag="div" multiline className={itemClassName} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={className}>
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    {renderItem(item, i)}
                </React.Fragment>
            ))}
        </div>
    );
};

interface EditableImageProps {
  path: string;
  alt: string;
  className?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({ path, alt, className }) => {
  const { data, updateData } = useCms();
  const isAdmin = data.isAdmin;

  // Resolve value from path
  const keys = path.split('.');
  let value = data as any;
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    }
  }

  const handleEdit = () => {
    if (!isAdmin) return;
    const newUrl = prompt('Masukkan URL gambar baru (atau kosongkan untuk membatalkan):', value);
    if (newUrl !== null && newUrl.trim() !== '') {
      updateData(path, newUrl.trim());
    }
  };

  if (isAdmin) {
    return (
      <div 
        className={cn('relative group cursor-pointer inline-block overflow-hidden rounded-xl', className)}
        onClick={handleEdit}
      >
        <img src={value} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ImagePlus className="w-8 h-8 text-white mb-2" />
          <span className="text-white text-sm font-medium">Ubah Gambar</span>
        </div>
      </div>
    );
  }

  return <img src={value} alt={alt} className={cn('object-cover rounded-xl', className)} />;
};

interface EditableVideoProps {
  pathUrl: string; 
  pathIsVideo: string; 
  className?: string;
}

export const EditableVideo: React.FC<EditableVideoProps> = ({ pathUrl, pathIsVideo, className }) => {
    const { data, updateData } = useCms();
    const isAdmin = data.isAdmin;
  
    // Resolve URL
    const keysUrl = pathUrl.split('.');
    let url = data as any;
    for (const k of keysUrl) {
      if (url && typeof url === 'object') {
        url = url[k];
      }
    }
    
    // Resolve isVideo
    const keysIsVideo = pathIsVideo.split('.');
    let isVideo = data as any;
    for (const k of keysIsVideo) {
      if (isVideo && typeof isVideo === 'object') {
        isVideo = isVideo[k];
      }
    }
  
    const handleEdit = () => {
      if (!isAdmin) return;
      const newUrl = prompt('Masukkan URL YouTube/Vimeo embed atau URL gambar:', url);
      if (newUrl !== null && newUrl.trim() !== '') {
        updateData(pathUrl, newUrl.trim());
        updateData(pathIsVideo, newUrl.includes('youtube') || newUrl.includes('vimeo'));
      }
    };
  
    if (isAdmin) {
      return (
        <div 
          className={cn('relative group cursor-pointer w-full overflow-hidden rounded-xl', className)}
          onClick={handleEdit}
        >
          {isVideo ? (
            <div className="aspect-video w-full pointer-events-none opacity-80">
              <iframe src={url} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
            </div>
          ) : (
            <img src={url} alt="Media" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Link className="w-8 h-8 text-white mb-2" />
            <span className="text-white text-sm font-medium">Ubah URL Video/Gambar</span>
          </div>
        </div>
      );
    }
  
    if (isVideo) {
      return (
         <div className={cn('aspect-video w-full rounded-xl overflow-hidden', className)}>
           <iframe src={url} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
         </div>
      );
    }
  
    return <img src={url} alt="Media" className={cn('object-cover rounded-xl', className)} />;
};
