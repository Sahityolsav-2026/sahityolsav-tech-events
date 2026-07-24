import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantMessageEventStream, type AssistantMessage } from '@earendil-works/pi-ai';
import type { StreamFn } from '@earendil-works/pi-agent-core';
import { isReviewablePath } from '../src/lib/server/ai-review-files.ts';
import { runRepositoryReview } from '../src/lib/server/ai-review.ts';

test('AI review accepts source files and rejects dependencies, environment files, binaries, and oversized files', () => {
  assert.equal(isReviewablePath('src/routes/+page.svelte', 2000), true);
  assert.equal(isReviewablePath('package.json', 2000), true);
  assert.equal(isReviewablePath('node_modules/example/index.js', 2000), false);
  assert.equal(isReviewablePath('.env.production', 2000), false);
  assert.equal(isReviewablePath('assets/logo.png', 2000), false);
  assert.equal(isReviewablePath('src/auth/credentials.ts', 2000), true);
  assert.equal(isReviewablePath('src/lib/secrets.ts', 2000), true);
  assert.equal(isReviewablePath('src/huge.ts', 120_001), false);
});

test('bounded AI agent lists files, reads selected source, and records a final review', async () => {
  let call = 0;
  const report = `Project summary
The submitted project is a small web application represented by the inspected source.
Alignment with declared idea
The inspected implementation appears consistent with the declared workflow, subject to manual verification.
Implementation observed
The package manifest and main source file show a conventional application structure.
Positive engineering observations
The repository has a concise layout and separates configuration from application source.
Concerns and possible bugs
Only a bounded source sample was inspected, so uninspected paths may contain additional behavior.
Security and reliability observations
No runtime execution or dependency audit was performed.
What judges should verify manually
Judges should run the exact commit and exercise the declared user journey.
Review limitations
This is a static advisory review based only on package.json and src/main.ts.`;
  const fakeStream: StreamFn = () => {
    const stream = createAssistantMessageEventStream();
    call++;
    const content: AssistantMessage['content'] = call === 1
      ? [{ type: 'toolCall', id: 'call-1', name: 'list_repository', arguments: {} }]
      : call === 2
        ? [{ type: 'toolCall', id: 'call-2', name: 'read_files', arguments: { paths: ['package.json', 'src/main.ts'] } }]
        : [{ type: 'toolCall', id: 'call-3', name: 'finish_review', arguments: { report } }];
    const message: AssistantMessage = {
      role: 'assistant',
      content,
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: {
        input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
      },
      stopReason: 'toolUse',
      timestamp: Date.now()
    };
    queueMicrotask(() => stream.push({ type: 'done', reason: 'toolUse', message }));
    return stream;
  };

  const result = await runRepositoryReview(
    {} as Env,
    {
      id: 1,
      endpoint: 'https://example.test/v1',
      model: 'test-model',
      api_key: 'test-key',
      enabled: 1,
      updated_at: new Date().toISOString()
    },
    {
      team: { name: 'Test Team', leader_name: 'Tester', members: '["Tester"]' },
      idea: { title: 'Test idea' },
      submission: {
        repository_full_name: 'example/project',
        commit_sha: 'a'.repeat(40),
        project_name: 'Test project',
        test_instructions: 'must not reach model'
      }
    },
    {
      stream: fakeStream,
      listFiles: async () => [
        { path: 'package.json', sha: '1', size: 20 },
        { path: 'src/main.ts', sha: '2', size: 30 },
        { path: '.env', sha: '3', size: 10 }
      ],
      readFile: async (_env, _repository, sha) => sha === '1' ? '{"scripts":{"test":"node --test"}}' : 'export const ready = true;'
    }
  );

  assert.equal(call, 3);
  assert.equal(result.report, report);
  assert.deepEqual(result.filesInspected, ['package.json', 'src/main.ts']);
  assert.equal(result.turns, 3);
  assert.equal(result.filesBytes, 50);
  assert.equal(result.inputTokens, 0);
  assert.equal(result.outputTokens, 0);
  assert.ok(result.durationMs >= 0);
});
