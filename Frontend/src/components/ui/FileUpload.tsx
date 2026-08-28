import React, { useRef, useState } from 'react';
import { UploadCloudIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ACCEPTED_EXTENSIONS, formatBytes, MAX_FILE_BYTES } from '../../services/documentService';

export function FileUpload({
  onSelect,
  disabled,
  className,
  id = 'file-upload'





}: {onSelect: (file: File) => void;disabled?: boolean;className?: string;id?: string;}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (file: File | undefined) => {
    if (file) onSelect(file);
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-dashed p-6 text-center transition-colors duration-150 ease-smooth',
        dragging ? 'border-navy-500 bg-navy-50' : 'border-slate-300 bg-slate-50/50',
        disabled && 'opacity-60',
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handle(e.dataTransfer.files?.[0]);
      }}>
      
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="sr-only"
        accept={ACCEPTED_EXTENSIONS}
        disabled={disabled}
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = '';
        }} />
      
      <UploadCloudIcon className="mx-auto h-6 w-6 text-slate-400" aria-hidden />
      <p className="mt-2 text-[13px] text-navy-900">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="font-medium text-navy-600 underline underline-offset-2 hover:text-navy-800 disabled:no-underline">
          
          Choose a file
        </button>{' '}
        or drag it here
      </p>
      <p className="mt-1 text-[12px] text-slate-500">
        PDF, DOC, DOCX, JPG or PNG · up to {formatBytes(MAX_FILE_BYTES)}
      </p>
    </div>);

}