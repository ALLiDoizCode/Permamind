/**
 * Skill Analyzer Module
 *
 * Analyzes skill directories and generates bundledFiles metadata
 * for registry registration.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Bundled file metadata structure
 */
export interface BundledFile {
  name: string;
  icon: string;
  type: 'markdown' | 'python' | 'javascript' | 'script' | 'text';
  size: string; // Formatted size like "4.2 KB"
  description: string;
  level: 'Level 2' | 'Level 3';
  preview: string;
  path?: string;
}

/**
 * Get file icon based on extension
 */
function getFileIcon(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const iconMap: Record<string, string> = {
    '.md': '📘',
    '.py': '🐍',
    '.js': '📜',
    '.ts': '📘',
    '.json': '📋',
    '.yaml': '📋',
    '.yml': '📋',
    '.txt': '📄',
    '.sh': '⚙️',
  };
  return iconMap[ext] || '📄';
}

/**
 * Get file type based on extension
 */
function getFileType(filename: string): BundledFile['type'] {
  const ext = path.extname(filename).toLowerCase();
  const typeMap: Record<string, BundledFile['type']> = {
    '.md': 'markdown',
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'javascript',
    '.sh': 'script',
  };
  return typeMap[ext] || 'text';
}

/**
 * Format file size to KB string
 */
function formatSize(bytes: number): string {
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

/**
 * Generate preview text from file content
 */
async function generatePreview(filePath: string, maxLength = 500): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract first few bullet points or lines
    const lines = content.split('\n').filter(line => line.trim());
    const preview = lines.slice(0, 10).join('\n');

    return preview.length > maxLength
      ? preview.substring(0, maxLength) + '...'
      : preview;
  } catch {
    return '';
  }
}

/**
 * Determine file level (Level 2 = instructions, Level 3 = resources)
 */
function getFileLevel(filename: string, isMainFile: boolean): BundledFile['level'] {
  // SKILL.md is always Level 2 (instructions)
  if (isMainFile || filename === 'SKILL.md') {
    return 'Level 2';
  }

  // Other markdown files are usually instructions
  if (filename.endsWith('.md')) {
    return 'Level 2';
  }

  // Everything else is resources
  return 'Level 3';
}

/**
 * Generate file description
 */
function generateDescription(filename: string, isMainFile: boolean): string {
  if (isMainFile || filename === 'SKILL.md') {
    return 'Main skill file';
  }

  const ext = path.extname(filename).toLowerCase();
  const descMap: Record<string, string> = {
    '.md': 'Documentation file',
    '.py': 'Python script',
    '.js': 'JavaScript module',
    '.ts': 'TypeScript module',
    '.json': 'Configuration file',
    '.yaml': 'Configuration file',
    '.yml': 'Configuration file',
    '.sh': 'Shell script',
  };

  return descMap[ext] || 'Resource file';
}

/**
 * Analyze skill directory and generate bundledFiles metadata
 *
 * @param directory - Path to skill directory
 * @returns Array of bundled file metadata
 */
export async function analyzeSkillDirectory(directory: string): Promise<BundledFile[]> {
  const bundledFiles: BundledFile[] = [];

  // Read all files in directory
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    // Skip directories and hidden files
    if (entry.isDirectory() || entry.name.startsWith('.')) {
      continue;
    }

    // Skip common non-skill files
    if ([
      'package.json',
      'package-lock.json',
      'node_modules',
      '.DS_Store',
      '.git',
      'README.md', // README is not part of skill bundle
    ].includes(entry.name)) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    const stats = await fs.stat(filePath);
    const isMainFile = entry.name === 'SKILL.md';

    // Generate file metadata
    const fileMetadata: BundledFile = {
      name: entry.name,
      icon: getFileIcon(entry.name),
      type: getFileType(entry.name),
      size: formatSize(stats.size),
      description: generateDescription(entry.name, isMainFile),
      level: getFileLevel(entry.name, isMainFile),
      preview: await generatePreview(filePath),
      path: entry.name, // Relative path within bundle
    };

    bundledFiles.push(fileMetadata);
  }

  // Sort: SKILL.md first, then Level 2, then Level 3
  bundledFiles.sort((a, b) => {
    if (a.name === 'SKILL.md') return -1;
    if (b.name === 'SKILL.md') return 1;
    if (a.level !== b.level) {
      return a.level === 'Level 2' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return bundledFiles;
}
