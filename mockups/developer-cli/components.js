// Core UI Components for Agent Skills Registry (Developer CLI Theme)
// Adapted from shadcn/ui v4 with CLI-specific styling

const { useState } = React;

// Utility function for className merging
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

// 1. Button Component (shadcn/ui base + CLI variants)
const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syntax-blue disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        default: 'bg-syntax-blue text-terminal-bg hover:bg-[#5299d9] border border-syntax-blue',
        outline: 'border border-terminal-border text-terminal-text hover:bg-terminal-surface hover:border-syntax-blue',
        ghost: 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface',
        command: 'bg-terminal-surface text-syntax-green hover:bg-[#1e252e] border border-terminal-border font-mono text-sm',
    };

    const sizes = {
        default: 'h-10 py-2 px-4',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-6',
    };

    return (
        <button
            className={cn(baseClasses, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
};

// 2. Card Component (CLI styled)
const Card = ({ children, className = '', hover = false, ...props }) => {
    return (
        <div
            className={cn('bg-terminal-surface rounded-lg border border-terminal-border', hover ? 'terminal-border cursor-pointer' : '', className)}
            {...props}
        >
            {children}
        </div>
    );
};

const CardHeader = ({ children, className = '' }) => (
    <div className={cn('p-6', className)}>{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
    <h3 className={cn('text-lg font-semibold text-terminal-text font-mono', className)}>{children}</h3>
);

const CardDescription = ({ children, className = '' }) => (
    <p className={cn('text-sm text-terminal-muted mt-1', className)}>{children}</p>
);

const CardContent = ({ children, className = '' }) => (
    <div className={cn('px-6 pb-6', className)}>{children}</div>
);

const CardFooter = ({ children, className = '' }) => (
    <div className={cn('px-6 pb-6 pt-0', className)}>{children}</div>
);

// 3. Badge Component (syntax highlighted)
const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: 'bg-terminal-surface text-terminal-text border-terminal-border',
        blue: 'bg-syntax-blue/10 text-syntax-blue border-syntax-blue/30',
        green: 'bg-syntax-green/10 text-syntax-green border-syntax-green/30',
        yellow: 'bg-syntax-yellow/10 text-syntax-yellow border-syntax-yellow/30',
        purple: 'bg-syntax-purple/10 text-syntax-purple border-syntax-purple/30',
        cyan: 'bg-syntax-cyan/10 text-syntax-cyan border-syntax-cyan/30',
        red: 'bg-syntax-red/10 text-syntax-red border-syntax-red/30',
    };

    return (
        <span className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors', variants[variant], className)}>
            {children}
        </span>
    );
};

// 4. Input Component (CLI styled)
const Input = ({ className = '', type = 'text', ...props }) => {
    return (
        <input
            type={type}
            className={cn(
                'flex h-9 w-full rounded-md border border-terminal-border bg-terminal-surface px-3 py-1 text-sm text-terminal-text',
                'placeholder:text-terminal-muted transition-all outline-none font-mono',
                'focus:border-syntax-blue focus:ring-2 focus:ring-syntax-blue/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        />
    );
};

// 5. SearchBar Component (CLI styled with $ prefix and autocomplete)
const SearchBar = ({ placeholder = "search skills --query blockchain", onSearch, onChange, suggestions = [], className = '' }) => {
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const filteredSuggestions = value.length >= 2
        ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
        : [];

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
                setValue(filteredSuggestions[selectedIndex]);
                setShowSuggestions(false);
                if (onSearch) onSearch(filteredSuggestions[selectedIndex]);
                if (onChange) onChange(filteredSuggestions[selectedIndex]);
            } else if (onSearch) {
                onSearch(value);
                setShowSuggestions(false);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);
        setShowSuggestions(newValue.length >= 2);
        setSelectedIndex(-1);

        // Call onChange immediately for live filtering
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <div className={cn('relative', className)}>
            <div className={cn('flex items-center bg-terminal-surface border rounded-lg overflow-hidden transition-all', focused ? 'border-syntax-blue ring-2 ring-syntax-blue/20' : 'border-terminal-border')}>
                <span className="pl-4 pr-2 text-syntax-green font-mono font-semibold text-lg">$</span>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-terminal-text placeholder:text-terminal-muted py-3 pr-4 outline-none font-mono text-sm"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <div className="pr-4">
                    <kbd className="px-2 py-1 text-xs font-mono bg-terminal-bg border border-terminal-border rounded text-terminal-muted">⌘K</kbd>
                </div>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-terminal-surface border border-terminal-border rounded-lg shadow-2xl overflow-hidden z-50">
                    <div className="p-2 border-b border-terminal-border">
                        <div className="text-xs text-terminal-muted font-mono">
                            {filteredSuggestions.length} matches
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setValue(suggestion);
                                    setShowSuggestions(false);
                                    if (onSearch) onSearch(suggestion);
                                }}
                                className={cn(
                                    'w-full text-left px-4 py-2 font-mono text-sm transition-colors',
                                    selectedIndex === index
                                        ? 'bg-syntax-blue/20 text-syntax-blue'
                                        : 'text-terminal-text hover:bg-terminal-bg'
                                )}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                    <div className="p-2 border-t border-terminal-border">
                        <div className="text-xs text-terminal-muted font-mono">
                            ↑↓ navigate • Enter select • ESC close
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// 6. SkillCard Component
const SkillCard = ({ name, description, author, version, category, downloads, onClick }) => {
    return (
        <Card hover={true} onClick={onClick}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="mono-gradient">{name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="green">{version}</Badge>
                            <Badge variant="cyan">{category}</Badge>
                        </div>
                    </div>
                    <div className="text-right text-xs text-terminal-muted font-mono">
                        <div>{downloads}</div>
                        <div className="text-terminal-muted/60">downloads</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-terminal-muted leading-relaxed line-clamp-3">{description}</p>
                <div className="mt-4 pt-4 border-t border-terminal-border text-xs text-terminal-muted font-mono">
                    <span className="text-syntax-purple">by</span> <span className="text-syntax-cyan">{author}</span>
                </div>
            </CardContent>
        </Card>
    );
};

// 7. Tabs Component (CLI theme with multiple style variants)
const Tabs = ({ children, defaultValue, className = '', onValueChange, variant = 'default' }) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    const handleTabChange = (value) => {
        setActiveTab(value);
        if (onValueChange) onValueChange(value);
    };

    return (
        <div className={cn('flex flex-col gap-2', className)} data-active-tab={activeTab}>
            {React.Children.map(children, child =>
                React.cloneElement(child, { activeTab, onTabChange: handleTabChange, variant })
            )}
        </div>
    );
};

const TabsList = ({ children, activeTab, onTabChange, variant = 'default' }) => {
    const variants = {
        // Original design - subtle, minimal
        default: 'inline-flex h-9 items-center justify-center rounded-lg bg-terminal-surface border border-terminal-border p-1',

        // CLI-inspired with command prefix
        cli: 'flex items-center gap-6 border-b border-terminal-border pb-3',

        // Terminal window tabs
        window: 'flex items-center gap-1 bg-terminal-surface/50 p-1 rounded-t-lg border-t border-l border-r border-terminal-border',

        // Underline style with gradient
        underline: 'flex items-center gap-6 border-b border-terminal-border',

        // Pills with spacing
        pills: 'inline-flex items-center gap-2 p-1 bg-terminal-surface rounded-lg border border-terminal-border',
    };

    return (
        <div className={variants[variant] || variants.default}>
            {React.Children.map(children, child =>
                React.cloneElement(child, { activeTab, onTabChange, variant })
            )}
        </div>
    );
};

const TabsTrigger = ({ children, value, activeTab, onTabChange, variant = 'default', icon, count }) => {
    const isActive = activeTab === value;

    const variants = {
        // Original design
        default: isActive
            ? 'bg-terminal-bg text-terminal-text border border-terminal-border shadow-sm'
            : 'text-terminal-muted hover:text-terminal-text',

        // CLI command style
        cli: isActive
            ? 'text-syntax-green border-b-2 border-syntax-green pb-2 px-1'
            : 'text-terminal-muted hover:text-terminal-text pb-2 px-1 hover:border-b-2 hover:border-terminal-border/50',

        // Terminal window tab style
        window: isActive
            ? 'bg-terminal-bg text-terminal-text border-t-2 border-syntax-blue rounded-t-md px-4 py-2 -mb-px'
            : 'bg-terminal-surface/30 text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface rounded-t-md px-4 py-2',

        // Underline with gradient
        underline: isActive
            ? 'text-terminal-text border-b-2 border-syntax-blue pb-2 font-semibold'
            : 'text-terminal-muted hover:text-terminal-text pb-2 hover:border-b-2 hover:border-terminal-border',

        // Pill style
        pills: isActive
            ? 'bg-syntax-blue text-terminal-bg px-4 py-2 rounded-md font-semibold'
            : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface px-4 py-2 rounded-md',
    };

    return (
        <button
            onClick={() => onTabChange(value)}
            className={cn(
                'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-mono transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syntax-blue focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg',
                variants[variant]
            )}
        >
            {icon && <span className="text-base">{icon}</span>}
            {children}
            {count !== undefined && (
                <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-mono',
                    isActive ? 'bg-terminal-surface text-syntax-cyan' : 'text-terminal-muted/60'
                )}>
                    {count}
                </span>
            )}
        </button>
    );
};

const TabsContent = ({ children, value, activeTab }) => {
    if (activeTab !== value) return null;
    return <div className="mt-4 outline-none">{children}</div>;
};

// 8. Table Component (CLI styled)
const Table = ({ children, className = '' }) => {
    return (
        <div className="relative w-full overflow-x-auto">
            <table className={cn('w-full caption-bottom text-sm font-mono', className)}>
                {children}
            </table>
        </div>
    );
};

const TableHeader = ({ children }) => (
    <thead className="[&_tr]:border-b [&_tr]:border-terminal-border">{children}</thead>
);

const TableBody = ({ children }) => (
    <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
);

const TableRow = ({ children, className = '' }) => (
    <tr className={cn('border-b border-terminal-border hover:bg-terminal-surface/50 transition-colors', className)}>
        {children}
    </tr>
);

const TableHead = ({ children, className = '' }) => (
    <th className={cn('h-10 px-2 text-left align-middle font-medium text-terminal-text whitespace-nowrap', className)}>
        {children}
    </th>
);

const TableCell = ({ children, className = '' }) => (
    <td className={cn('p-2 align-middle text-terminal-muted whitespace-nowrap', className)}>
        {children}
    </td>
);

// 9. CopyButton Component
const CopyButton = ({ text, className = '' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                'inline-flex items-center justify-center rounded-md p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syntax-blue',
                className
            )}
            aria-label="Copy to clipboard"
        >
            {copied ? (
                <svg className="w-4 h-4 text-syntax-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            )}
        </button>
    );
};

// 10. MarkdownRenderer Component (basic version)
const MarkdownRenderer = ({ content, className = '' }) => {
    // Simple markdown rendering (for demo purposes)
    const renderMarkdown = (text) => {
        if (!text) return '';

        // Convert headers
        let html = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-terminal-text font-mono mt-6 mb-3">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-terminal-text font-mono mt-8 mb-4">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-terminal-text font-mono mt-8 mb-4">$1</h1>');

        // Convert bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-terminal-text">$1</strong>');

        // Convert inline code
        html = html.replace(/`(.*?)`/g, '<code class="bg-terminal-bg border border-terminal-border rounded px-1.5 py-0.5 text-syntax-cyan font-mono text-sm">$1</code>');

        // Convert paragraphs
        html = html.replace(/\n\n/g, '</p><p class="text-terminal-muted leading-relaxed mb-4">');

        return '<p class="text-terminal-muted leading-relaxed mb-4">' + html + '</p>';
    };

    return (
        <div
            className={cn('prose prose-invert max-w-none', className)}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
    );
};

// 11. FilterSidebar Component
const FilterSidebar = ({ categories, onFilterChange, className = '' }) => {
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [authorSearch, setAuthorSearch] = useState('');

    const handleCategoryToggle = (category) => {
        const updated = selectedCategories.includes(category)
            ? selectedCategories.filter(c => c !== category)
            : [...selectedCategories, category];
        setSelectedCategories(updated);
        if (onFilterChange) onFilterChange({ categories: updated, author: authorSearch });
    };

    const handleClearAll = () => {
        setSelectedCategories([]);
        setAuthorSearch('');
        if (onFilterChange) onFilterChange({ categories: [], author: '' });
    };

    return (
        <div className={cn('w-full', className)}>
            <div className="space-y-6">
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-terminal-text font-mono">Filters</h3>
                    {(selectedCategories.length > 0 || authorSearch) && (
                        <button
                            onClick={handleClearAll}
                            className="text-xs text-syntax-blue hover:text-syntax-cyan font-mono transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Category Filters */}
                <div>
                    <h4 className="text-xs font-semibold text-terminal-text font-mono mb-3">Category</h4>
                    <div className="space-y-2">
                        {categories && categories.map((category) => (
                            <label key={category.name} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category.name)}
                                    onChange={() => handleCategoryToggle(category.name)}
                                    className="w-4 h-4 rounded border-terminal-border bg-terminal-surface text-syntax-blue focus:ring-2 focus:ring-syntax-blue/20"
                                />
                                <span className="text-sm text-terminal-muted group-hover:text-terminal-text font-mono transition-colors">
                                    {category.name}
                                </span>
                                <span className="text-xs text-terminal-muted/60 font-mono">({category.count})</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Author Filter */}
                <div>
                    <h4 className="text-xs font-semibold text-terminal-text font-mono mb-3">Author</h4>
                    <Input
                        placeholder="Search by author..."
                        value={authorSearch}
                        onChange={(e) => {
                            setAuthorSearch(e.target.value);
                            if (onFilterChange) onFilterChange({ categories: selectedCategories, author: e.target.value });
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

// Export all components for use in pages
window.Components = {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Badge,
    Input,
    SearchBar,
    SkillCard,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    CopyButton,
    MarkdownRenderer,
    FilterSidebar,
};
