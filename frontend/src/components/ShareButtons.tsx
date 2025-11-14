/**
 * Social Sharing Buttons Component
 *
 * Provides sharing functionality for:
 * - Twitter (opens in new window)
 * - LinkedIn (opens in new window)
 * - Copy Link (copies to clipboard)
 *
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

import { useState } from 'react';
import { Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';

interface ShareButtonsProps {
  /** Current page URL to share */
  url: string;
  /** Page title for social media */
  title: string;
  /** Position variant: fixed (desktop bottom-right) or relative (mobile below article) */
  position?: 'fixed' | 'relative';
}

export function ShareButtons({
  url,
  title,
  position = 'fixed',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const shareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const buttonClass =
    'flex items-center justify-center w-10 h-10 rounded-full border border-terminal-border bg-terminal-surface text-terminal-text hover:bg-syntax-cyan hover:text-terminal-bg transition-colors cursor-pointer';

  const containerClass =
    position === 'fixed'
      ? 'fixed bottom-8 right-8 z-50 hidden md:flex flex-col gap-3'
      : 'flex gap-3 justify-center mt-8';

  return (
    <div className={containerClass}>
      <button
        onClick={shareTwitter}
        className={buttonClass}
        aria-label="Share on Twitter"
        title="Share on Twitter"
      >
        <Twitter className="w-5 h-5" />
      </button>

      <button
        onClick={shareLinkedIn}
        className={buttonClass}
        aria-label="Share on LinkedIn"
        title="Share on LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </button>

      <button
        onClick={copyLink}
        className={buttonClass}
        aria-label="Copy link to clipboard"
        title={copied ? 'Link copied!' : 'Copy link'}
      >
        {copied ? (
          <Check className="w-5 h-5 text-syntax-green" />
        ) : (
          <LinkIcon className="w-5 h-5" />
        )}
      </button>

      {/* Success message for mobile */}
      {copied && position === 'relative' && (
        <span className="text-xs text-syntax-green ml-2">Link copied!</span>
      )}
    </div>
  );
}
