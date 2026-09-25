import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  RefreshCw,
  CheckCircle2,
  FileImage,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  processAndCompressImage,
  validateImageFile,
  ACCEPTED_FILE_EXTENSIONS,
  ProcessedImageResult,
} from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GoalImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | undefined) => void;
  color?: string;
  goalName?: string;
}

export function GoalImageUpload({
  currentImageUrl,
  onImageChange,
  color = '#3b82f6',
  goalName = 'Goal',
}: GoalImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ProcessedImageResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    try {
      setIsProcessing(true);
      const result = await processAndCompressImage(file, 400, 0.88);
      setLastResult(result);
      onImageChange(result.dataUrl);
      toast.success(
        `Optimized & loaded ${result.format} (${result.width}x${result.height}px, ${result.compressedSizeKb} KB)`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing image';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(undefined);
    setLastResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Custom picture removed. Reverted to standard icon.');
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_EXTENSIONS}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
          }
        }}
      />

      {currentImageUrl ? (
        /* Preview state with replace and clear controls */
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
          <div
            className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border shadow-xs group"
            style={{ borderColor: `${color}60` }}
          >
            <img
              src={currentImageUrl}
              alt={goalName}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] text-white font-medium">Custom</span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Custom Goal Picture Active</span>
              {lastResult && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-primary/10 text-primary border border-primary/20">
                  {lastResult.format}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastResult
                ? `Size: ${lastResult.compressedSizeKb} KB (${lastResult.width}×${lastResult.height}px)`
                : 'Custom photo will be shown on goal cards, lists, and detail page.'}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <RefreshCw className="h-3 w-3" />
                Replace Picture
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                onClick={handleRemoveImage}
              >
                <X className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center',
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 bg-muted/10',
            isProcessing && 'pointer-events-none opacity-60'
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2 transition-transform group-hover:scale-110">
            {isProcessing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
          </div>

          <p className="text-xs font-semibold text-foreground">
            {isDragging ? 'Drop your image here' : 'Drag & drop your goal photo, or browse'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Supported: <span className="font-semibold text-foreground">PNG</span>,{' '}
            <span className="font-semibold text-foreground">JPG/JPEG</span>,{' '}
            <span className="font-semibold text-foreground">WebP</span> (Max 8MB)
          </p>

          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border text-muted-foreground font-mono">
              PNG (with alpha)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border text-muted-foreground font-mono">
              JPG
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border text-muted-foreground font-mono">
              WebP
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
