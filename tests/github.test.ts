import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGitHubRepositoryUrl } from '../src/lib/server/github.ts';

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
