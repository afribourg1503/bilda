// GitHub OAuth and API integration
import { supabase } from '@/lib/supabase';
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = import.meta.env.VITE_GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:8080/auth/github/callback';

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
  bio: string;
  location: string;
  blog: string;
  twitter_username: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  language: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  files: {
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }[];
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export interface GitHubAccessToken {
  access_token: string;
  token_type: string;
  scope: string;
}

class GitHubService {
  private accessToken: string | null = null;

  // Initialize GitHub OAuth flow
  initiateOAuth() {
    const state = this.generateState();
    localStorage.setItem('github_oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: 'repo user',
      state: state,
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleCallback(code: string, state: string): Promise<boolean> {
    const savedState = localStorage.getItem('github_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    try {
      // Prefer Supabase Edge Function if available
      try {
        const { data, error } = await supabase.functions.invoke('github-oauth', {
          body: { code },
        });
        if (error) throw error;
        const token: GitHubAccessToken = data as any;
        if (!token?.access_token) throw new Error('No access token returned');
        this.accessToken = token.access_token;
        localStorage.setItem('github_access_token', token.access_token);
        return true;
      } catch (e) {
        // Fallback to local API route if configured (dev proxy/server)
        const response = await fetch('/api/github/oauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (!response.ok) throw new Error('Failed to exchange code for token');
        const data: GitHubAccessToken = await response.json();
        this.accessToken = data.access_token;
        localStorage.setItem('github_access_token', data.access_token);
        return true;
      }
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return false;
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<GitHubUser | null> {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('github_access_token');
      if (!this.accessToken) return null;
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      return null;
    }
  }

  // Get user repositories
  async getUserRepos(): Promise<GitHubRepo[]> {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('github_access_token');
      if (!this.accessToken) return [];
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
      return [];
    }
  }

  // Get commits for a repository within a time range
  async getCommitsInTimeRange(
    repoFullName: string, 
    since: Date, 
    until: Date
  ): Promise<GitHubCommit[]> {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('github_access_token');
      if (!this.accessToken) return [];
    }

    try {
      const sinceISO = since.toISOString();
      const untilISO = until.toISOString();
      
      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/commits?since=${sinceISO}&until=${untilISO}&per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch commits');
      }

      const commits = await response.json();
      
      // Get detailed commit info for each commit
      const detailedCommits = await Promise.all(
        commits.map(async (commit: any) => {
          const commitResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}/commits/${commit.sha}`,
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );

          if (commitResponse.ok) {
            return await commitResponse.json();
          }
          return commit;
        })
      );

      return detailedCommits;
    } catch (error) {
      console.error('Error fetching GitHub commits:', error);
      return [];
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken || !!localStorage.getItem('github_access_token');
  }

  // Disconnect GitHub
  disconnect() {
    this.accessToken = null;
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_oauth_state');
  }

  // Generate random state for OAuth
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const githubService = new GitHubService(); 