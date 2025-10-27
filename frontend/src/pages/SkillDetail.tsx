import { useParams } from 'react-router-dom';
import { useSkill } from '@/hooks/useSkill';
import { getSkillVersions } from '@/services/ao-registry';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Timeline } from '@/components/Timeline';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { CopyButton } from '@/components/CopyButton';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { DependencyCard } from '@/components/DependencyCard';
import { SmartStatsDisplay } from '@/components/SmartStatsDisplay';
import { useState, useEffect } from 'react';
import type { VersionInfo } from '@/types/ao';
import { useArnsName } from '@/hooks/useArnsName';

export function SkillDetail() {
  const { name } = useParams<{ name: string }>();
  const { skill, loading, error, refetch } = useSkill(name || '');
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Resolve ArNS name for owner (wallet address)
  const { arnsName } = useArnsName(skill?.owner || '');

  useEffect(() => {
    if (skill) {
      setVersionsLoading(true);
      getSkillVersions(skill.name)
        .then(setVersions)
        .catch(() => setVersions([]))
        .finally(() => setVersionsLoading(false));
    }
  }, [skill]);

  if (loading) {
    return <LoadingSkeleton variant="skill-detail" />;
  }

  if (error || !skill) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error?.message || 'Skill not found'}
          onRetry={refetch}
        />
      </div>
    );
  }

  // At this point, skill is guaranteed to be non-null due to the above check
  if (!skill) {
    return null; // This should never happen, but TypeScript needs it
  }

  const installCommand = `$ skills install ${skill.name}`;
  const dependenciesCount = skill.dependencies?.length || 0;
  const versionsCount = versions.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumbs */}
      <Breadcrumbs
        path={[{ label: 'search', href: '/search' }, skill.name]}
        className="mb-6"
      />

      {/* Skill Header */}
      <div className="mb-8">
        <h1 className="mono-gradient text-4xl font-bold mb-4">{skill.name}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="green">{skill.version}</Badge>
          {skill.tags?.map((tag: string) => (
            <Badge key={tag} variant="cyan">
              {tag}
            </Badge>
          ))}
          <SmartStatsDisplay skill={skill} />
        </div>
        <p className="text-sm text-terminal-muted font-mono">
          <span className="text-syntax-purple">by</span>{' '}
          <a
            href={`https://www.ao.link/#/entity/${skill.owner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-syntax-purple hover:text-syntax-cyan transition-colors underline-offset-2 hover:underline"
            title={`View ${arnsName || skill.author} on AO Link`}
          >
            {arnsName || skill.author}
          </a>
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="cli" className="w-full justify-start">
          <TabsTrigger value="overview" variant="cli" icon="📄">
            overview
          </TabsTrigger>
          <TabsTrigger
            value="dependencies"
            variant="cli"
            icon="📦"
            count={dependenciesCount}
          >
            dependencies
          </TabsTrigger>
          <TabsTrigger
            value="versions"
            variant="cli"
            icon="🔖"
            count={versionsCount}
          >
            versions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Quick Install Section */}
              <div>
                <h3 className="text-sm font-semibold text-syntax-green font-mono mb-2">
                  $ Quick Install
                </h3>
                <div className="bg-terminal-bg border border-terminal-border rounded-lg p-4 relative">
                  <code className="text-sm">
                    <span className="text-syntax-green">$</span>{' '}
                    <span className="text-terminal-text">
                      {installCommand.replace('$ ', '')}
                    </span>
                  </code>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={installCommand.replace('$ ', '')} />
                  </div>
                </div>
                <p className="text-xs text-terminal-muted mt-2">
                  This skill will activate automatically when Claude detects
                  tasks matching the description.
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-terminal-border" />

              {/* Description Section */}
              <div>
                <h3 className="text-sm font-semibold text-terminal-text font-mono mb-3">
                  Description
                </h3>
                <p className="text-sm text-terminal-muted leading-relaxed">
                  {skill.description}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-terminal-border" />

              {/* When to Use This Skill Section */}
              <div>
                <h3 className="text-sm font-semibold text-terminal-text font-mono mb-3">
                  When to Use This Skill
                </h3>
                <div className="text-sm text-terminal-muted space-y-1">
                  {(() => {
                    const firstFile = skill.bundledFiles?.[0];
                    const preview = firstFile?.preview;
                    if (!preview) {
                      return (
                        <div>
                          Use this skill when working with{' '}
                          {skill.category || 'development'} tasks.
                        </div>
                      );
                    }
                    const bulletMatches = preview.match(/^- .+$/gm);
                    if (!bulletMatches || bulletMatches.length === 0) {
                      return (
                        <div>
                          Use this skill when working with{' '}
                          {skill.category || 'development'} tasks.
                        </div>
                      );
                    }
                    return bulletMatches
                      .slice(0, 5)
                      .map((line, i) => <div key={i}>{line}</div>);
                  })()}
                </div>
              </div>

              {/* Skill Composition Section */}
              <div className="pt-4 border-t border-terminal-border">
                <div className="flex items-center gap-4 text-xs text-terminal-muted">
                  <div className="flex items-center gap-1">
                    <Badge variant="green" className="text-xs">
                      L2
                    </Badge>
                    <span>
                      {(() => {
                        const l2Count = skill.bundledFiles?.filter(
                          (f) => f.level === 'Level 2'
                        ).length;
                        // If no bundledFiles, assume at least 1 instruction file (SKILL.md)
                        return l2Count || 1;
                      })()}{' '}
                      instruction{' '}
                      {(skill.bundledFiles?.filter((f) => f.level === 'Level 2')
                        .length || 1) === 1
                        ? 'file'
                        : 'files'}
                    </span>
                  </div>
                  <span className="text-terminal-muted/40">•</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="purple" className="text-xs">
                      L3
                    </Badge>
                    <span>
                      {skill.bundledFiles?.filter((f) => f.level === 'Level 3')
                        .length || 0}{' '}
                      resource{' '}
                      {(skill.bundledFiles?.filter((f) => f.level === 'Level 3')
                        .length || 0) === 1
                        ? 'file'
                        : 'files'}
                    </span>
                  </div>
                  <span className="text-terminal-muted/40">•</span>
                  <span>
                    {(() => {
                      const totalSize = skill.bundledFiles?.reduce(
                        (sum, f) => sum + parseFloat(f.size),
                        0
                      );
                      // If no bundledFiles, estimate based on typical skill size
                      return (totalSize || 10).toFixed(1);
                    })()}{' '}
                    KB total
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies">
          <div className="space-y-6">
            {skill.dependencies && skill.dependencies.length > 0 ? (
              <>
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dependency Overview</CardTitle>
                    <CardDescription>
                      This skill requires {skill.dependencies.length}{' '}
                      {skill.dependencies.length === 1
                        ? 'dependency'
                        : 'dependencies'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-terminal-bg rounded-lg border border-terminal-border">
                        <div className="text-2xl font-bold text-syntax-blue font-mono mb-1">
                          {skill.dependencies.length}
                        </div>
                        <div className="text-xs text-terminal-muted">
                          Total Dependencies
                        </div>
                      </div>
                      <div className="p-4 bg-terminal-bg rounded-lg border border-terminal-border">
                        <div className="text-2xl font-bold text-syntax-cyan font-mono mb-1">
                          {
                            skill.dependencies.filter(
                              (dep) => typeof dep === 'object' && dep.version
                            ).length
                          }
                        </div>
                        <div className="text-xs text-terminal-muted">
                          With Versions
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dependencies List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                    <CardDescription>
                      Click any dependency to view its detail page
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {skill.dependencies.map((dep, index) => {
                        const depName =
                          typeof dep === 'string' ? dep : dep.name;
                        const depVersion =
                          typeof dep === 'object' && dep.version
                            ? dep.version
                            : undefined;
                        return (
                          <DependencyCard
                            key={index}
                            dependency={{
                              name: depName,
                              version: depVersion,
                            }}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Dependency Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>How Dependencies Work</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-terminal-muted space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="cyan" className="text-xs flex-shrink-0">
                          Auto-Install
                        </Badge>
                        <p>
                          <strong className="text-terminal-text">
                            Dependencies
                          </strong>{' '}
                          are automatically installed when you install this
                          skill (~1-2s per dependency)
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="green"
                          className="text-xs flex-shrink-0"
                        >
                          Versioned
                        </Badge>
                        <p>
                          <strong className="text-terminal-text">
                            Version-locked dependencies
                          </strong>{' '}
                          ensure compatibility (specific version installed as
                          specified)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-terminal-muted text-center">
                    No dependencies
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-terminal-text mb-4">
              Version History
            </h2>
            <p className="text-sm text-terminal-muted mb-6">
              {versions.length} {versions.length === 1 ? 'release' : 'releases'}{' '}
              • Latest: {versions[0]?.version || 'N/A'}
            </p>
            {versionsLoading ? (
              <p className="text-terminal-muted">Loading versions...</p>
            ) : versions.length > 0 ? (
              <Timeline
                versions={versions.map((v, index) => ({
                  version: v.version,
                  date: new Date(v.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }),
                  txid: v.arweaveTxId,
                  status: index === 0 ? 'latest' : '',
                  size: '12 KB',
                  changelog: 'No changelog available for this version',
                }))}
                skillName={skill.name}
              />
            ) : (
              <p className="text-terminal-muted">
                No version history available
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
