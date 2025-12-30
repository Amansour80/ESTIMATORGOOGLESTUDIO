import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { SKILL_TAG_CATEGORIES, getSkillTagColor } from '../utils/skillTags';

interface Props {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export default function SkillTagSelector({ selectedTags, onChange, disabled }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleTag = (tagId: string) => {
    if (disabled) return;

    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(t => t !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50"
      >
        <Tag className="w-4 h-4" />
        <span className="font-medium">Skills ({selectedTags.length} selected)</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {selectedTags.length > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.slice(0, 5).map(tagId => {
            const tag = SKILL_TAG_CATEGORIES
              .flatMap(c => c.tags)
              .find(t => t.id === tagId);
            if (!tag) return null;

            return (
              <span
                key={tagId}
                className={`text-xs px-2 py-0.5 rounded-full ${getSkillTagColor(tagId)}`}
              >
                {tag.label}
              </span>
            );
          })}
          {selectedTags.length > 5 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              +{selectedTags.length - 5} more
            </span>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3 max-h-96 overflow-y-auto">
          {SKILL_TAG_CATEGORIES.map(category => (
            <div key={category.id} className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {category.label}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {category.tags.map(tag => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      disabled={disabled}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-left transition-colors
                        ${isSelected
                          ? `${category.color} border-current font-medium`
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                        ${isSelected
                          ? 'bg-current border-current'
                          : 'border-gray-300'
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="flex-1">{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
