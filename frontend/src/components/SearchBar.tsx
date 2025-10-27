import { useState, useRef, useEffect } from 'react';
import { useSkillSearch } from '@/hooks/useSkillSearch';
import type { SkillMetadata } from '@/types/ao';

interface SearchBarProps {
  onSkillSelect?: (skill: SkillMetadata) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showSearchButton?: boolean;
}

export function SearchBar({
  onSkillSelect,
  onSearch,
  placeholder = 'skills search ao',
  className = '',
  showSearchButton = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use custom hook with debouncing
  const { skills, loading, error } = useSkillSearch(query, 300);

  // Show dropdown when we have results
  useEffect(() => {
    if (query.length >= 2 && (skills.length > 0 || loading || error)) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [query, skills, loading, error]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [skills]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' && query.length >= 2) {
        setShowDropdown(true);
      }
      return;
    }

    const maxResults = Math.min(skills.length, 5);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < maxResults - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < skills.length) {
          handleSelectSkill(skills[selectedIndex]);
        } else if (query.trim() && onSearch) {
          // If no skill selected but query exists, trigger search
          setShowDropdown(false);
          onSearch(query.trim());
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectSkill = (skill: SkillMetadata) => {
    setQuery(skill.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    if (onSkillSelect) {
      onSkillSelect(skill);
    }
  };

  const handleSearchClick = () => {
    if (query.trim() && onSearch) {
      setShowDropdown(false);
      onSearch(query.trim());
    }
  };

  const displayedSkills = skills.slice(0, 5);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-syntax-green font-mono text-lg pointer-events-none">
            $
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length >= 2) {
                setShowDropdown(true);
              }
            }}
            placeholder={placeholder}
            className="w-full bg-terminal-surface border border-terminal-border rounded-lg px-12 py-3 text-terminal-text placeholder:text-terminal-muted font-mono focus:outline-none focus:border-syntax-blue focus:ring-2 focus:ring-syntax-blue/20 transition-colors"
            aria-label="Search skills"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="search-results"
          />
          {/* Keyboard shortcut hint */}
          {!showSearchButton && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <span className="text-xs font-mono text-terminal-muted bg-terminal-bg px-2 py-1 rounded border border-terminal-border">
                ⌘K
              </span>
            </div>
          )}
        </div>

        {/* Search button (optional) */}
        {showSearchButton && (
          <button
            onClick={handleSearchClick}
            className="px-6 py-3 bg-terminal-surface border border-syntax-green hover:bg-syntax-green/10 text-syntax-green font-mono rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-syntax-green/30 cursor-pointer"
            aria-label="Search"
          >
            Search
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-terminal-surface border border-terminal-border rounded-lg shadow-lg max-h-80 overflow-y-auto z-50"
        >
          {loading && (
            <div className="px-4 py-3 text-terminal-muted font-mono text-sm">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-syntax-blue border-t-transparent rounded-full" />
                Searching...
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="px-4 py-3 text-red-400 font-mono text-sm">
              <div className="flex items-center gap-2">
                <span>⚠</span>
                <span>Search failed. Please try again.</span>
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            displayedSkills.length === 0 &&
            query.length >= 2 && (
              <div className="px-4 py-3 text-terminal-muted font-mono text-sm">
                No matches found for &ldquo;{query}&rdquo;
              </div>
            )}

          {!loading && !error && displayedSkills.length > 0 && (
            <ul className="py-1">
              {displayedSkills.map((skill, index) => (
                <li
                  key={`${skill.name}-${skill.version}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  className={`px-4 py-3 cursor-pointer font-mono transition-colors border-b border-terminal-border/50 last:border-b-0 ${
                    selectedIndex === index
                      ? 'bg-syntax-blue/20 text-syntax-blue'
                      : 'text-terminal-text hover:bg-terminal-bg'
                  }`}
                  onClick={() => handleSelectSkill(skill)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5 text-left">
                      <div className="font-semibold text-base">
                        {skill.name}
                      </div>
                      <div className="text-xs text-terminal-muted leading-relaxed line-clamp-2">
                        {skill.description}
                      </div>
                    </div>
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-xs px-2.5 py-1 rounded bg-syntax-green/10 text-syntax-green border border-syntax-green/30 font-medium">
                        {skill.version}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {displayedSkills.length > 0 && (
            <div className="px-4 py-2 text-xs text-terminal-muted font-mono border-t border-terminal-border">
              <div className="flex items-center justify-between">
                <span>
                  {displayedSkills.length} of {skills.length} results
                </span>
                <span className="text-syntax-cyan">
                  ↑↓ navigate • ↵ select • esc close
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
