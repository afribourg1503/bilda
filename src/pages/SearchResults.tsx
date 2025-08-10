import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Users, 
  FolderOpen, 
  Activity, 
  Trophy,
  ArrowLeft,
  Clock,
  MapPin,
  ExternalLink,
  Github,
  Twitter
} from 'lucide-react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { searchProfiles, searchProjects } from '@/lib/database';

interface SearchResult {
  id: string;
  type: 'builder' | 'project' | 'activity' | 'challenge';
  title: string;
  description: string;
  metadata: Record<string, any>;
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'builders';

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const q = query.trim();
        if (!q) { setResults([]); return; }
        if (category === 'builders') {
          const { data } = await searchProfiles(q, 20);
          const mapped = (data as any[] || []).map(p => ({
            id: p.user_id,
            type: 'builder' as const,
            title: p.name || p.handle,
            description: p.bio || '',
            metadata: {
              title: p.handle,
              location: '',
              avatar: p.avatar_url || 'https://github.com/github.png',
              projects: 0,
              followers: 0,
              github: (p.links as any)?.github,
              twitter: (p.links as any)?.twitter,
            },
          }));
          setResults(mapped);
        } else if (category === 'projects') {
          const { data } = await searchProjects(q, 20);
          const mapped = (data as any[] || []).map(pr => ({
            id: pr.id,
            type: 'project' as const,
            title: pr.name,
            description: pr.description || '',
            metadata: {
              owner: 'user',
              language: '',
              stars: 0,
              lastUpdated: new Date(pr.updated_at).toLocaleDateString(),
              github: pr.github_repo,
              website: pr.website,
            },
          }));
          setResults(mapped);
        } else {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [query, category]);

  // removed mock generator; now using Supabase-backed search

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'builders': return <Users className="h-4 w-4" />;
      case 'projects': return <FolderOpen className="h-4 w-4" />;
      case 'activities': return <Activity className="h-4 w-4" />;
      case 'challenges': return <Trophy className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const renderResultCard = (result: SearchResult) => {
    switch (result.type) {
      case 'builder':
        return (
          <Card key={result.id} className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={result.metadata.avatar} />
                  <AvatarFallback className="bg-gray-200 text-gray-700">
                    {result.title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                    <Badge variant="secondary" className="bg-pulse-100 text-pulse-700">
                      {result.metadata.title}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{result.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{result.metadata.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FolderOpen className="h-4 w-4" />
                      <span>{result.metadata.projects} projects</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{result.metadata.followers} followers</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://github.com/${result.metadata.github}`} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-1" />
                        GitHub
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://twitter.com/${result.metadata.twitter}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4 mr-1" />
                        Twitter
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'project':
        return (
          <Card key={result.id} className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                  <p className="text-gray-600">{result.description}</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {result.metadata.language}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>by {result.metadata.owner}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{result.metadata.lastUpdated}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⭐ {result.metadata.stars}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://github.com/${result.metadata.github}`} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-1" />
                    View Code
                  </a>
                </Button>
                {result.metadata.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={result.metadata.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visit Site
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'activity':
        return (
          <Card key={result.id} className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                  <p className="text-gray-600">{result.description}</p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {result.metadata.type}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <FolderOpen className="h-4 w-4" />
                  <span>{result.metadata.project}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{result.metadata.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>{result.metadata.commits} commits</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>{result.metadata.date}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'challenge':
        return (
          <Card key={result.id} className="bg-white/90 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
                  <p className="text-gray-600">{result.description}</p>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {result.metadata.difficulty}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{result.metadata.participants} participants</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{result.metadata.daysLeft} days left</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Reward: {result.metadata.reward}</span>
                <Button size="sm" className="bg-pulse-500 hover:bg-pulse-600 text-white">
                  Join Challenge
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Search Results</h2>
            <div className="flex items-center space-x-2 text-gray-600">
              <Search className="h-4 w-4" />
              <span>"{query}" in {getCategoryLabel(category)}</span>
              {getCategoryIcon(category)}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pulse-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">Found {results.length} results</p>
          </div>
          {results.map(renderResultCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-6">
            No {category} found for "{query}". Try different keywords or browse all {category}.
          </p>
          <Button asChild>
            <Link to="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      )}
    </AuthenticatedLayout>
  );
};

export default SearchResults; 