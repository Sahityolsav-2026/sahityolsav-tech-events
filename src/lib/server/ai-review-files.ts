const MAX_FILE_BYTES = 120_000;

const TEXT_EXTENSIONS = new Set([
  '.c', '.cc', '.cpp', '.cs', '.css', '.dart', '.go', '.h', '.hpp', '.html', '.java', '.js', '.json',
  '.jsx', '.kt', '.kts', '.md', '.mjs', '.php', '.prisma', '.py', '.rb', '.rs', '.scss', '.sh', '.sql',
  '.svelte', '.swift', '.toml', '.ts', '.tsx', '.vue', '.xml', '.yaml', '.yml'
]);
const TEXT_FILENAMES = new Set([
  'dockerfile', 'gemfile', 'makefile', 'package.json', 'pyproject.toml', 'readme', 'readme.md',
  'requirements.txt', 'svelte.config.js', 'tsconfig.json', 'vite.config.ts'
]);
const IGNORED_SEGMENTS = new Set([
  '.git', '.next', '.svelte-kit', 'build', 'coverage', 'dist', 'node_modules', 'target', 'vendor'
]);

export function isReviewablePath(path: string, size: number): boolean {
  if (size < 1 || size > MAX_FILE_BYTES || path.includes('\0')) return false;
  const lower = path.toLowerCase();
  const segments = lower.split('/');
  if (segments.some((segment) => IGNORED_SEGMENTS.has(segment))) return false;
  const name = segments.at(-1) ?? '';
  if (name.startsWith('.env') || name.endsWith('.lock')) return false;
  if (TEXT_FILENAMES.has(name)) return true;
  const dot = name.lastIndexOf('.');
  return dot >= 0 && TEXT_EXTENSIONS.has(name.slice(dot));
}
