import { SkillCard } from '@/components/SkillCard';
import type { SkillMetadata } from '@/types/ao';

// Mock skill data for demonstration
const mockSkills: SkillMetadata[] = [
  {
    name: 'blockchain-fundamentals',
    version: '1.2.0',
    description:
      'Learn the core concepts of blockchain technology, including distributed ledgers, consensus mechanisms, and cryptographic security.',
    author: 'Alex Chen',
    owner: 'abc123def456ghi789jkl012mno345pqr678stu901v',
    tags: ['blockchain', 'education', 'fundamentals'],
    dependencies: [],
    arweaveTxId: 'txid-blockchain-fundamentals-v1.2.0',
    license: 'MIT',
    publishedAt: 1704067200,
    updatedAt: 1704153600,
    downloads: 12345,
  },
  {
    name: 'ao-process-basics',
    version: '2.0.1',
    description:
      'Master the essentials of AO processes, including message handlers, state management, and inter-process communication patterns.',
    author: 'Jordan Lee',
    owner: 'def456ghi789jkl012mno345pqr678stu901vwx234y',
    tags: ['ao', 'tutorial', 'development'],
    dependencies: ['blockchain-fundamentals'],
    arweaveTxId: 'txid-ao-process-basics-v2.0.1',
    license: 'Apache-2.0',
    publishedAt: 1704240000,
    updatedAt: 1704326400,
    downloads: 8760,
  },
  {
    name: 'arweave-storage-api',
    version: '3.1.4',
    description:
      'Comprehensive guide to using Arweave for permanent data storage, including transaction signing, chunking, and retrieval.',
    author: 'Sam Wilson',
    owner: 'ghi789jkl012mno345pqr678stu901vwx234yz567a',
    tags: ['arweave', 'storage', 'api'],
    dependencies: [],
    arweaveTxId: 'txid-arweave-storage-api-v3.1.4',
    publishedAt: 1703980800,
    updatedAt: 1704412800,
    downloads: 23450,
  },
  {
    name: 'permaweb-deployment',
    version: '1.0.0',
    description:
      'Deploy static websites to the Permaweb with ease. Includes CI/CD integration, manifest generation, and ArNS configuration.',
    author: 'Taylor Kim',
    owner: 'jkl012mno345pqr678stu901vwx234yz567abc890d',
    tags: ['permaweb', 'deployment', 'web3'],
    dependencies: ['arweave-storage-api'],
    arweaveTxId: 'txid-permaweb-deployment-v1.0.0',
    license: 'GPL-3.0',
    publishedAt: 1704499200,
    updatedAt: 1704499200,
    downloads: 5432,
  },
  {
    name: 'token-contract-template',
    version: '4.2.0',
    description:
      'Production-ready AO token contract with transfer, mint, burn capabilities. Includes comprehensive test suite and documentation.',
    author: 'Morgan Davis',
    owner: 'mno345pqr678stu901vwx234yz567abc890def123g',
    tags: ['token', 'smart-contract', 'defi'],
    dependencies: ['ao-process-basics'],
    arweaveTxId: 'txid-token-contract-template-v4.2.0',
    license: 'MIT',
    publishedAt: 1703894400,
    updatedAt: 1704585600,
    downloads: 34567,
  },
  {
    name: 'nft-marketplace-sdk',
    version: '2.3.1',
    description:
      'Complete SDK for building NFT marketplaces on AO. Features include listing, bidding, escrow, and royalty management.',
    author: 'Casey Brown',
    owner: 'pqr678stu901vwx234yz567abc890def123ghi456j',
    tags: ['nft', 'marketplace', 'sdk'],
    dependencies: ['token-contract-template', 'ao-process-basics'],
    arweaveTxId: 'txid-nft-marketplace-sdk-v2.3.1',
    license: 'MIT',
    publishedAt: 1704672000,
    updatedAt: 1704758400,
    downloads: 18920,
  },
];

export function Home() {
  const handleSkillClick = (skillName: string) => {
    console.log('Clicked skill:', skillName);
    // Placeholder for navigation to skill detail page
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-mono mb-4 bg-gradient-to-r from-syntax-blue via-syntax-cyan to-syntax-green bg-clip-text text-transparent">
          Agent Skills Registry
        </h1>
        <p className="text-terminal-muted text-lg mb-8">
          Discover and install Claude Agent Skills for the AO ecosystem
        </p>
      </section>

      {/* Featured Skills Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-mono text-syntax-purple">
            // featured_skills
          </h2>
          <button className="text-syntax-cyan hover:text-syntax-blue transition-colors font-mono text-sm">
            view all →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSkills.map((skill) => (
            <SkillCard
              key={`${skill.name}-${skill.version}`}
              skill={skill}
              onClick={() => handleSkillClick(skill.name)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
