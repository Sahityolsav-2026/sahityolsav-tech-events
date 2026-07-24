import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitHubRepositoryUrl, verifyPublicRepository } from '../src/lib/server/github.ts';

test('accepts only canonical GitHub repository URLs', () => {
  assert.deepEqual(parseGitHubRepositoryUrl('https://github.com/octocat/Hello-World'), {
    owner: 'octocat',
    name: 'Hello-World'
  });
  assert.deepEqual(parseGitHubRepositoryUrl('https://www.github.com/octocat/Hello-World.git/'), {
    owner: 'octocat',
    name: 'Hello-World'
  });
  assert.equal(parseGitHubRepositoryUrl('https://gitlab.com/octocat/Hello-World'), null);
  assert.equal(parseGitHubRepositoryUrl('https://github.com/octocat/Hello-World/issues'), null);
  assert.equal(parseGitHubRepositoryUrl('https://github.com/octocat/Hello-World?tab=readme'), null);
  assert.equal(parseGitHubRepositoryUrl('http://github.com/octocat/Hello-World'), null);
});

test('captures the current commit from a public repository default branch', async () => {
  const originalFetch = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    paths.push(path);
    if (path === '/repos/team/project') {
      return Response.json({
        id: 42,
        name: 'project',
        full_name: 'team/project',
        html_url: 'https://github.com/team/project',
        default_branch: 'main',
        private: false,
        archived: false
      });
    }
    if (path === '/repos/team/project/commits/main') {
      return Response.json({ sha: 'a'.repeat(40) });
    }
    return new Response(null, { status: 404 });
  };
  try {
    const result = await verifyPublicRepository({ GITHUB_TOKEN: 'test' } as Env, 'https://github.com/team/project');
    assert.equal(result.defaultBranch, 'main');
    assert.equal(result.commitSha, 'a'.repeat(40));
    assert.deepEqual(paths, ['/repos/team/project', '/repos/team/project/commits/main']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
