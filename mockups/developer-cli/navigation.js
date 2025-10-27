// Navigation Components for Agent Skills Registry (Developer CLI Theme)

const { useState } = React;
const { Button } = window.Components || {};

// GlobalNav Component (Desktop/Tablet)
const GlobalNav = ({ currentPage = 'home' }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Skip to Content Link (Accessibility) */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-syntax-blue focus:text-terminal-bg focus:rounded-md focus:font-mono"
            >
                Skip to content
            </a>

            {/* Desktop/Tablet Navigation */}
            <header className="border-b border-terminal-border bg-terminal-bg/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <a href="index.html" className="flex items-center gap-2 group">
                            <span className="text-syntax-green font-mono font-bold text-xl">$</span>
                            <span className="font-mono font-bold text-terminal-text group-hover:text-syntax-blue transition-colors">
                                agent-skills
                            </span>
                            <span className="cursor-blink text-syntax-blue">_</span>
                        </a>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <a
                                href="search-results.html"
                                className={`text-sm font-mono transition-colors ${currentPage === 'search' ? 'text-syntax-blue' : 'text-terminal-muted hover:text-terminal-text'}`}
                                aria-current={currentPage === 'search' ? 'page' : undefined}
                            >
                                browse
                            </a>
                            <a
                                href="#docs"
                                className="text-sm text-terminal-muted hover:text-terminal-text font-mono transition-colors"
                            >
                                docs
                            </a>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-terminal-muted hover:text-terminal-text font-mono transition-colors"
                            >
                                github
                            </a>
                            {Button && (
                                <Button variant="command" size="sm">
                                    <span className="text-syntax-green">$</span>&nbsp;install cli
                                </Button>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-terminal-muted hover:text-terminal-text transition-colors"
                            aria-label="Toggle mobile menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Mobile Navigation Drawer */}
                    {mobileMenuOpen && (
                        <nav className="md:hidden mt-4 pb-4 border-t border-terminal-border pt-4 space-y-3">
                            <a
                                href="search-results.html"
                                className={`block text-sm font-mono transition-colors ${currentPage === 'search' ? 'text-syntax-blue' : 'text-terminal-muted hover:text-terminal-text'}`}
                            >
                                browse
                            </a>
                            <a
                                href="#docs"
                                className="block text-sm text-terminal-muted hover:text-terminal-text font-mono transition-colors"
                            >
                                docs
                            </a>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sm text-terminal-muted hover:text-terminal-text font-mono transition-colors"
                            >
                                github
                            </a>
                            <div className="pt-2">
                                {Button && (
                                    <Button variant="command" size="sm" className="w-full">
                                        <span className="text-syntax-green">$</span>&nbsp;install cli
                                    </Button>
                                )}
                            </div>
                        </nav>
                    )}
                </div>
            </header>
        </>
    );
};

// Breadcrumbs Component
const Breadcrumbs = ({ path = [] }) => {
    if (!path || path.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="container mx-auto px-4 py-3">
            <ol className="flex items-center gap-2 text-sm font-mono">
                <li>
                    <a
                        href="index.html"
                        className="text-terminal-muted hover:text-syntax-blue transition-colors"
                    >
                        home
                    </a>
                </li>
                {path.map((item, index) => (
                    <React.Fragment key={index}>
                        <li className="text-terminal-muted/50">/</li>
                        <li>
                            {index === path.length - 1 ? (
                                <span className="text-terminal-text" aria-current="page">{item}</span>
                            ) : item.href ? (
                                <a
                                    href={item.href}
                                    className="text-terminal-muted hover:text-syntax-blue transition-colors"
                                >
                                    {item.label || item}
                                </a>
                            ) : (
                                <span className="text-terminal-muted">{item.label || item}</span>
                            )}
                        </li>
                    </React.Fragment>
                ))}
            </ol>
        </nav>
    );
};

// Footer Component
const Footer = () => {
    const { Badge } = window.Components || {};

    return (
        <footer className="border-t border-terminal-border mt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-6">
                    {Badge && (
                        <Badge variant="blue" className="text-sm px-4 py-2">
                            ⛁ Powered by Arweave & AO
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-mono">
                    <a
                        href="#docs"
                        className="text-terminal-muted hover:text-syntax-blue transition-colors"
                    >
                        documentation
                    </a>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-muted hover:text-syntax-blue transition-colors"
                    >
                        github
                    </a>
                    <a
                        href="#cli-guide"
                        className="text-terminal-muted hover:text-syntax-blue transition-colors"
                    >
                        cli-guide
                    </a>
                    <a
                        href="#publish"
                        className="text-terminal-muted hover:text-syntax-blue transition-colors"
                    >
                        publish-skill
                    </a>
                </div>

                <div className="text-center mt-6 text-xs text-terminal-muted font-mono">
                    <span className="text-syntax-purple">// </span>
                    Built with ❤️ by the community
                </div>
            </div>
        </footer>
    );
};

// Export all navigation components
window.Navigation = {
    GlobalNav,
    Breadcrumbs,
    Footer,
};
