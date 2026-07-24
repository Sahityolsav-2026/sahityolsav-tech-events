const API_ROOT = 'https://api.github.com';
const API_VERSION = '2026-03-10';

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  archived: boolean;
  parent?: { full_name: string };
  source?: { full_name: string };
}

interface GitHubCommit {
  sha: string;
  commit?: { tree: { sha: string } };
}

interface GitHubTreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
}

interface GitHubTree {
  tree: GitHubTreeEntry[];
  truncated: boolean;
}

interface GitHubBlob {
  content: string;
  encoding: string;
  size: number;
}

export interface RepositoryFile {
  path: string;
  sha: string;
  size: number;
}

export interface VerifiedRepository {
  id: number;
  fullName: string;
  canonicalUrl: string;
  owner: string;
  name: string;
}

export interface ForkResult {
  status: 'pending' | 'archived';
  url: string;
  forkedAt: string;
}

export class GitHubApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function githubHeaders(env: Env, jsonBody = false): Headers {
  if (!env.GITHUB_TOKEN) throw new GitHubApiError('Repository verification is temporarily unavailable.', 503);
  const headers = new Headers({
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'user-agent': 'sahityolsav-tech-events',
    'x-github-api-version': API_VERSION
  });
  if (jsonBody) headers.set('content-type', 'application/json');
  return headers;
}

async function githubFetch(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: githubHeaders(env, Boolean(init.body))
  });
}

async function githubJson<T>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  const response = await githubFetch(env, path, init);
  if (!response.ok) {
    const message = response.status === 401 || response.status === 403
      ? 'Repository verification is temporarily unavailable.'
      : response.status === 404
        ? 'The GitHub repository or commit was not found.'
        : 'GitHub could not complete the request. Please try again.';
    throw new GitHubApiError(message, response.status);
  }
  return response.json<T>();
}

export function parseGitHubRepositoryUrl(value: string): { owner: string; name: string } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) return null;
    const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    if (parts.length !== 2 || url.search || url.hash) return null;
    const owner = parts[0];
    const name = parts[1].replace(/\.git$/i, '');
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner)) return null;
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(name)) return null;
    return { owner, name };
  } catch {
    return null;
  }
}

export async function verifyPublicRepository(env: Env, repositoryUrl: string, commitSha: string): Promise<VerifiedRepository> {
  const parsed = parseGitHubRepositoryUrl(repositoryUrl);
  if (!parsed) throw new GitHubApiError('Enter a canonical GitHub URL such as https://github.com/owner/repository.', 400);
  const path = `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.name)}`;
  const repository = await githubJson<GitHubRepository>(env, path);
  if (repository.private) throw new GitHubApiError('The GitHub repository must be public.', 400);
  if (repository.archived) throw new GitHubApiError('The source GitHub repository is archived.', 400);
  const commitResponse = await githubFetch(env, `${path}/commits/${encodeURIComponent(commitSha)}`);
  if (!commitResponse.ok) {
    throw new GitHubApiError(
      commitResponse.status === 404 || commitResponse.status === 422
        ? 'The exact Git commit was not found in this public repository.'
        : `GitHub could not verify the commit (status ${commitResponse.status}).`,
      commitResponse.status
    );
  }
  const commit = await commitResponse.json<GitHubCommit>();
  if (commit.sha.toLowerCase() !== commitSha.toLowerCase()) {
    throw new GitHubApiError('The exact Git commit could not be verified.', 400);
  }
  return {
    id: repository.id,
    fullName: repository.full_name,
    canonicalUrl: repository.html_url,
    owner: parsed.owner,
    name: repository.name
  };
}

function repositoryPath(fullName: string): string {
  const [owner, name, ...rest] = fullName.split('/');
  if (!owner || !name || rest.length) throw new GitHubApiError('Repository details could not be read.', 500);
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export async function listRepositoryFiles(env: Env, fullName: string, commitSha: string): Promise<RepositoryFile[]> {
  const path = repositoryPath(fullName);
  const commit = await githubJson<GitHubCommit>(env, `${path}/commits/${encodeURIComponent(commitSha)}`);
  const treeSha = commit.commit?.tree.sha;
  if (!treeSha) throw new GitHubApiError('This repository could not be prepared for review.', 502);
  const tree = await githubJson<GitHubTree>(env, `${path}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`);
  if (tree.truncated) throw new GitHubApiError('This repository is too large for the bounded AI review.', 400);
  return tree.tree
    .filter((entry) => entry.type === 'blob' && typeof entry.size === 'number')
    .map((entry) => ({ path: entry.path, sha: entry.sha, size: entry.size! }));
}

export async function readRepositoryFile(env: Env, fullName: string, blobSha: string): Promise<string> {
  const blob = await githubJson<GitHubBlob>(
    env,
    `${repositoryPath(fullName)}/git/blobs/${encodeURIComponent(blobSha)}`
  );
  if (blob.encoding !== 'base64') throw new GitHubApiError('One of the repository files could not be read.', 502);
  const binary = atob(blob.content.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function archiveName(teamId: number, sourceName: string): string {
  const slug = sourceName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  return `sahi-team-${teamId}-${slug || 'project'}`;
}

async function destinationRepository(env: Env, name: string): Promise<GitHubRepository | null> {
  const response = await githubFetch(env, `/repos/${encodeURIComponent(env.GITHUB_ORG)}/${encodeURIComponent(name)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new GitHubApiError('GitHub could not check the organization repository.', response.status);
  return response.json<GitHubRepository>();
}

export async function forkAndArchiveRepository(
  env: Env,
  teamId: number,
  sourceFullName: string,
  commitSha: string
): Promise<ForkResult> {
  const [owner, repositoryName] = sourceFullName.split('/');
  if (!owner || !repositoryName) throw new GitHubApiError('Repository details could not be read.', 500);
  const name = archiveName(teamId, repositoryName);
  let destination = await destinationRepository(env, name);
  const now = new Date().toISOString();

  if (!destination) {
    const response = await githubFetch(env, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repositoryName)}/forks`, {
      method: 'POST',
      body: JSON.stringify({ organization: env.GITHUB_ORG, name, default_branch_only: false })
    });
    if (response.status !== 202) {
      throw new GitHubApiError(
        response.status === 422
          ? 'GitHub could not create this fork. The organization may already have a fork in the same repository network.'
          : 'GitHub could not create the organization archive.',
        response.status
      );
    }
    destination = await response.json<GitHubRepository>();
  }

  const parent = destination.parent?.full_name ?? destination.source?.full_name;
  if (parent && parent.toLowerCase() !== sourceFullName.toLowerCase()) {
    throw new GitHubApiError('The destination repository name is already used by an unrelated repository.', 409);
  }

  const commitResponse = await githubFetch(
    env,
    `/repos/${encodeURIComponent(env.GITHUB_ORG)}/${encodeURIComponent(name)}/commits/${encodeURIComponent(commitSha)}`
  );
  if (commitResponse.status === 404 || commitResponse.status === 409) {
    return { status: 'pending', url: destination.html_url, forkedAt: now };
  }
  if (!commitResponse.ok) throw new GitHubApiError('GitHub could not verify the organization archive.', commitResponse.status);

  const archived = await githubJson<GitHubRepository>(
    env,
    `/repos/${encodeURIComponent(env.GITHUB_ORG)}/${encodeURIComponent(name)}`,
    { method: 'PATCH', body: JSON.stringify({ archived: true }) }
  );
  return { status: 'archived', url: archived.html_url, forkedAt: now };
}
