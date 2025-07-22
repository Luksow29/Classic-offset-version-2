// src/components/customers/enhancements/CustomerTagging.tsx
import React, { useState } from 'react';

interface CustomerTaggingProps {
  initialTags?: string[];
  onTagsChange: (tags: string[]) => void;
}

const CustomerTagging: React.FC<CustomerTaggingProps> = ({ initialTags = [], onTagsChange }) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [input, setInput] = useState('');

  const handleAddTag = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      const newTags = [...tags, input.trim()];
      setTags(newTags);
      onTagsChange(newTags);
      setInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    onTagsChange(newTags);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {tag}
            <button 
              onClick={() => handleRemoveTag(tag)}
              className="ml-1.5 text-blue-600 hover:text-blue-800"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          className="flex-grow p-2 border border-gray-300 rounded-l-md"
          placeholder="Add a tag..."
        />
        <button 
          onClick={handleAddTag}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default CustomerTagging;