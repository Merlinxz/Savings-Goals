import React, { useState } from 'react';
import { Tag as TagIcon, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TagBadge } from '@/components/common/TagBadge';
import { POPULAR_TAGS, CATEGORY_CONFIG } from '@/lib/categories';
import { GoalCategory } from '@/types';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
  category?: GoalCategory;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  category,
  maxTags = 10,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const tags = value || [];

  const handleAddTag = (rawTag: string) => {
    const trimmed = rawTag.trim().replace(/^#/, '');
    if (!trimmed) return;

    if (trimmed.length > 25) {
      setError('Tag must be 25 characters or fewer');
      return;
    }

    if (tags.length >= maxTags) {
      setError(`Maximum of ${maxTags} tags reached`);
      return;
    }

    // Check case-insensitive duplicate
    const isDuplicate = tags.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setError(`Tag "${trimmed}" is already added`);
      return;
    }

    setError(null);
    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setError(null);
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on empty backspace
      handleRemoveTag(tags.length - 1);
    }
  };

  // Build list of suggested tags based on category & general popular list
  const categorySuggestions = category && CATEGORY_CONFIG[category]
    ? CATEGORY_CONFIG[category].suggestedTags
    : [];

  const allSuggestions = Array.from(
    new Set([...categorySuggestions, ...POPULAR_TAGS])
  );

  const unselectedSuggestions = allSuggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label htmlFor="tag-input-field" className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <TagIcon className="h-3.5 w-3.5 text-primary" />
          <span>Tags & Labels</span>
        </label>
        <span className="text-[11px] text-muted-foreground">
          {tags.length}/{maxTags} tags
        </span>
      </div>

      {/* Input container */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id="tag-input-field"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Add tag (e.g. Emergency, Travel, Education) and press Enter"
            className="h-9 text-xs pr-8"
            disabled={tags.length >= maxTags}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddTag(inputValue)}
          disabled={!inputValue.trim() || tags.length >= maxTags}
          className="h-9 px-3 gap-1 text-xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}

      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {tags.map((tag, idx) => (
            <TagBadge
              key={`${tag}-${idx}`}
              tag={tag}
              showIcon
              size="sm"
              onRemove={() => handleRemoveTag(idx)}
            />
          ))}
        </div>
      )}

      {/* Suggested Quick Tags */}
      {unselectedSuggestions.length > 0 && tags.length < maxTags && (
        <div className="pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-medium mr-0.5">
              Suggestions:
            </span>
            {unselectedSuggestions.slice(0, 8).map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => handleAddTag(suggested)}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
              >
                <Plus className="h-2.5 w-2.5 opacity-60" />
                {suggested}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
