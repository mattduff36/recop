import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  getQuestionOptionLabel,
  questionnaireSections,
  type QuestionnaireAnswerValue,
  type QuestionnaireAnswers,
  type QuestionnaireQuestion,
} from '../../lib/questionnaire/demo-personalisation';
import type { Database, Json } from '../../types/database';

config({ path: path.resolve(process.cwd(), '.env.local') });

const REPO_ROOT = process.cwd();
const DEFAULT_BASE_BRANCH = 'main';
const GENERATED_ROOT = 'demo-personalisation';
const DEMO_BRANCH_CONFIG_PATH = 'lib/config/demo-branch-config.ts';

type SubmissionRow = Database['public']['Tables']['questionnaire_submissions']['Row'];

interface Options {
  submissionNumber: number;
  baseBranch: string;
  push: boolean;
  dryRun: boolean;
  help: boolean;
}

interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

interface ReadableAnswer {
  questionId: string;
  questionLabel: string;
  value: string | string[];
}

interface ReadableSection {
  sectionId: string;
  sectionTitle: string;
  answers: ReadableAnswer[];
}

interface ClientProfile {
  submission: SubmissionRow;
  answers: QuestionnaireAnswers;
  readableSections: ReadableSection[];
  branchName: string;
  generatedAt: string;
}

function getArgValue(argv: string[], name: string): string | undefined {
  const equalsPrefix = `--${name}=`;
  const equalsValue = argv.find((arg) => arg.startsWith(equalsPrefix))?.slice(equalsPrefix.length);
  if (equalsValue) {
    return equalsValue;
  }

  const index = argv.indexOf(`--${name}`);
  if (index === -1) {
    return undefined;
  }

  return argv[index + 1];
}

function parseArgs(argv: string[]): Options {
  const args = new Set(argv);
  const rawSubmission = getArgValue(argv, 'submission');
  const submissionNumber = Number(rawSubmission);

  return {
    submissionNumber,
    baseBranch: getArgValue(argv, 'base') || DEFAULT_BASE_BRANCH,
    push: args.has('--push'),
    dryRun: args.has('--dry-run'),
    help: args.has('--help') || args.has('-h'),
  };
}

function printUsage(): void {
  console.log([
    'Usage:',
    '  npm run demo:create-branch -- --submission 1',
    '  npm run demo:create-branch -- --submission 1 --push',
    '  npm run demo:create-branch -- --submission 1 --dry-run',
    '',
    'Options:',
    '  --submission <number>  Questionnaire reference/submission number.',
    '  --base <branch>        Base branch to create from. Defaults to main.',
    '  --push                 Push the new branch to origin after committing.',
    '  --dry-run              Fetch and summarise without changing files or git state.',
  ].join('\n'));
}

function assertValidOptions(options: Options): void {
  if (options.help) {
    return;
  }

  if (!Number.isInteger(options.submissionNumber) || options.submissionNumber < 1) {
    throw new Error('A positive --submission number is required.');
  }

  if (!/^[A-Za-z0-9._/-]+$/u.test(options.baseBranch)) {
    throw new Error('The --base branch contains unsupported characters.');
  }
}

function getExecutable(command: string): string {
  if (process.platform !== 'win32') {
    return command;
  }

  if (command === 'git') {
    return command;
  }

  if (command === 'npm') {
    return 'npm.cmd';
  }

  return command;
}

function runCommand(command: string, args: string[], captureOutput = false, allowFailure = false): CommandResult {
  const result = spawnSync(getExecutable(command), args, {
    cwd: REPO_ROOT,
    env: process.env,
    shell: process.platform === 'win32' && command !== 'git',
    encoding: 'utf8',
    stdio: captureOutput ? 'pipe' : 'inherit',
  });

  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';

  if (!allowFailure && result.status !== 0) {
    throw new Error(`Command failed: ${[command, ...args].join(' ')}`);
  }

  return {
    status: result.status,
    stdout,
    stderr,
  };
}

function assertCleanWorkingTree(): void {
  const status = runCommand('git', ['status', '--porcelain'], true).stdout.trim();
  if (!status) {
    return;
  }

  throw new Error('Refusing to create a demo branch while the working tree has uncommitted changes.');
}

function assertBranchAvailable(branchName: string): void {
  const local = runCommand('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branchName}`], true, true);
  if (local.status === 0) {
    throw new Error(`Local branch already exists: ${branchName}`);
  }

  const remote = runCommand('git', ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branchName}`], true, true);
  if (remote.status === 0) {
    throw new Error(`Remote branch already exists: origin/${branchName}`);
  }
}

function getCurrentBranch(): string {
  return runCommand('git', ['branch', '--show-current'], true).stdout.trim();
}

function getStringAnswer(answers: QuestionnaireAnswers, questionId: string): string {
  const value = answers[questionId];
  return typeof value === 'string' ? value.trim() : '';
}

function getAnswerLabels(question: QuestionnaireQuestion, value: QuestionnaireAnswerValue): string | string[] {
  if (Array.isArray(value)) {
    return value.map((optionId) => getQuestionOptionLabel(question, optionId));
  }

  if (question.type === 'single_choice') {
    return getQuestionOptionLabel(question, value);
  }

  return value;
}

function isPlainObject(value: Json): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAnswerValue(value: Json): value is QuestionnaireAnswerValue {
  if (typeof value === 'string') {
    return true;
  }

  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function toQuestionnaireAnswers(value: Json): QuestionnaireAnswers {
  if (!isPlainObject(value)) {
    throw new Error('Submission answers are not a JSON object.');
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, answerValue]) => isAnswerValue(answerValue))
  ) as QuestionnaireAnswers;
}

function buildReadableSections(answers: QuestionnaireAnswers): ReadableSection[] {
  const knownQuestionIds = new Set(questionnaireSections.flatMap((section) => section.questions.map((question) => question.id)));
  const sections = questionnaireSections
    .map((section) => ({
      sectionId: section.id,
      sectionTitle: section.title,
      answers: section.questions
        .flatMap((question) => {
          const value = answers[question.id];
          if (typeof value === 'undefined' || (typeof value === 'string' && value.trim().length === 0)) {
            return [];
          }

          return [
            {
              questionId: question.id,
              questionLabel: question.label,
              value: getAnswerLabels(question, value),
            },
          ];
        }),
    }))
    .filter((section) => section.answers.length > 0);

  const unknownAnswers = Object.entries(answers)
    .filter(([questionId]) => !knownQuestionIds.has(questionId))
    .map(([questionId, value]) => ({
      questionId,
      questionLabel: questionId,
      value,
    }));

  if (unknownAnswers.length > 0) {
    sections.push({
      sectionId: 'additional_answers',
      sectionTitle: 'Additional answers',
      answers: unknownAnswers,
    });
  }

  return sections;
}

function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/&/gu, ' and ')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 54)
    .replace(/-+$/gu, '');

  return slug || 'client';
}

function formatValue(value: string | string[]): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value;
}

function markdownValue(value: string | string[]): string {
  return formatValue(value).replace(/\r?\n/gu, '\n  ');
}

function buildRecommendedChanges(profile: ClientProfile): string[] {
  const answers = profile.answers;
  const recommendations = [
    `Show the visible demo branch notice for ${profile.submission.company_name} on login and dashboard pages.`,
    'Keep using the shared fictional sample database unless this prospect needs a deeper private demo dataset.',
  ];

  const appNamePreference = getStringAnswer(answers, 'app_name_preference');
  if (appNamePreference && appNamePreference !== 'keep_digidocs') {
    recommendations.push('Review app naming and decide whether to update `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SHORT_APP_NAME`, and PWA metadata.');
  }

  if (getStringAnswer(answers, 'brand_colours') || getStringAnswer(answers, 'website_or_brand_assets')) {
    recommendations.push('Review brand colours/logo assets and decide whether to update logo files, favicon assets, and CSS brand tokens.');
  }

  const priorityModules = answers.priority_modules;
  if (Array.isArray(priorityModules) && priorityModules.length > 0) {
    recommendations.push('Tune navigation, dashboard emphasis, and walkthrough order around the selected priority modules.');
  }

  if (getStringAnswer(answers, 'example_work')) {
    recommendations.push('Use the supplied example projects/jobs/sites to guide future demo seed-data changes.');
  }

  const documentOutputs = answers.document_outputs;
  if (Array.isArray(documentOutputs) && documentOutputs.length > 0) {
    recommendations.push('Check the requested document/PDF/email outputs for branding and wording opportunities.');
  }

  return recommendations;
}

function buildConfigFile(profile: ClientProfile): string {
  return `export interface DemoBranchConfig {
  enabled: boolean;
  submissionNumber: number | null;
  companyName: string | null;
  contactName: string | null;
  branchName: string | null;
  generatedAt: string | null;
}

export const demoBranchConfig = {
  enabled: true,
  submissionNumber: ${profile.submission.submission_number},
  companyName: ${JSON.stringify(profile.submission.company_name)},
  contactName: ${JSON.stringify(profile.submission.contact_name)},
  branchName: ${JSON.stringify(profile.branchName)},
  generatedAt: ${JSON.stringify(profile.generatedAt)},
} satisfies DemoBranchConfig;
`;
}

function buildBrief(profile: ClientProfile): string {
  const recommendations = buildRecommendedChanges(profile)
    .map((recommendation) => `- ${recommendation}`)
    .join('\n');

  const answersMarkdown = profile.readableSections
    .map((section) => {
      const answers = section.answers
        .map((answer) => `- **${answer.questionLabel}**: ${markdownValue(answer.value)}`)
        .join('\n');

      return `### ${section.sectionTitle}\n${answers}`;
    })
    .join('\n\n');

  return `# Demo Personalisation Brief: ${profile.submission.company_name}

Generated from questionnaire submission #${profile.submission.submission_number} on ${profile.generatedAt}.

## Branch
- Branch: \`${profile.branchName}\`
- Contact: ${profile.submission.contact_name} <${profile.submission.contact_email}>
- Phone: ${profile.submission.contact_phone || 'Not provided'}
- Submitted: ${profile.submission.created_at}

## Important Demo Data Note
This personalised branch uses the shared fictional sample database. Names, records, vehicles, documents, and activity inside the app are demo data only.

## Deterministic Changes Applied
- Enabled the demo branch notice for ${profile.submission.company_name}.
- Generated this branch-local personalisation brief.
- Stored a redacted operational submission export beside this brief.

## Recommended Follow-Up Changes
${recommendations}

## Questionnaire Answers
${answersMarkdown}

## Optional Deeper Personalisation Checklist
- Review \`lib/config/template-config.ts\` for app/company naming and demo persona copy.
- Review \`scripts/demo/seed.ts\` if fictional teams, users, assets, projects, or customers should be made more relevant.
- Review \`lib/config/navigation.ts\` and \`lib/config/forms.ts\` if module labels need prospect-specific wording.
- Review public logo, favicon, and \`public/manifest.json\` if a stronger branded preview is needed.
- Review PDF/email surfaces for requested output personalisation.
`;
}

function buildSubmissionExport(profile: ClientProfile): string {
  return JSON.stringify(
    {
      submissionNumber: profile.submission.submission_number,
      id: profile.submission.id,
      companyName: profile.submission.company_name,
      contactName: profile.submission.contact_name,
      contactEmail: profile.submission.contact_email,
      contactPhone: profile.submission.contact_phone,
      createdAt: profile.submission.created_at,
      branchName: profile.branchName,
      generatedAt: profile.generatedAt,
      answers: profile.answers,
      readableSections: profile.readableSections,
    },
    null,
    2
  );
}

async function fetchSubmission(submissionNumber: number): Promise<SubmissionRow> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to read questionnaire submissions.');
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from('questionnaire_submissions')
    .select('*')
    .eq('submission_number', submissionNumber)
    .single();

  if (error || !data) {
    throw new Error(`Unable to find questionnaire submission #${submissionNumber}: ${error?.message || 'not found'}`);
  }

  return data;
}

function buildClientProfile(submission: SubmissionRow): ClientProfile {
  const answers = toQuestionnaireAnswers(submission.answers);
  const branchSlug = slugify(submission.company_name);
  const branchName = `demo/${branchSlug}-submission-${submission.submission_number}`;

  return {
    submission,
    answers,
    readableSections: buildReadableSections(answers),
    branchName,
    generatedAt: new Date().toISOString(),
  };
}

function writeGeneratedFiles(profile: ClientProfile): void {
  const outputDirectory = path.join(REPO_ROOT, GENERATED_ROOT, `submission-${profile.submission.submission_number}`);
  mkdirSync(outputDirectory, { recursive: true });

  writeFileSync(path.join(REPO_ROOT, DEMO_BRANCH_CONFIG_PATH), buildConfigFile(profile));
  writeFileSync(path.join(outputDirectory, 'brief.md'), buildBrief(profile));
  writeFileSync(path.join(outputDirectory, 'submission.json'), `${buildSubmissionExport(profile)}\n`);
}

function createBranch(profile: ClientProfile, options: Options): void {
  assertCleanWorkingTree();
  assertBranchAvailable(profile.branchName);

  const currentBranch = getCurrentBranch();
  if (currentBranch !== options.baseBranch) {
    runCommand('git', ['switch', options.baseBranch]);
  }

  runCommand('git', ['switch', '-c', profile.branchName]);
  writeGeneratedFiles(profile);

  const status = runCommand('git', ['status', '--porcelain'], true).stdout.trim();
  if (!status) {
    throw new Error('No generated changes were created for the demo branch.');
  }

  runCommand('git', ['add', DEMO_BRANCH_CONFIG_PATH, path.join(GENERATED_ROOT, `submission-${profile.submission.submission_number}`)]);
  runCommand('git', ['commit', '-m', `chore(demo): prepare ${profile.submission.company_name} demo branch`]);

  if (options.push) {
    runCommand('git', ['push', '-u', 'origin', 'HEAD']);
  }
}

function printDryRun(profile: ClientProfile, options: Options): void {
  console.log(`Submission: #${profile.submission.submission_number}`);
  console.log(`Company: ${profile.submission.company_name}`);
  console.log(`Contact: ${profile.submission.contact_name} <${profile.submission.contact_email}>`);
  console.log(`Branch: ${profile.branchName}`);
  console.log(`Base: ${options.baseBranch}`);
  console.log(`Push: ${options.push ? 'yes' : 'no'}`);
  console.log('');
  console.log('Dry run only. No files, branches, commits, or pushes were created.');
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  assertValidOptions(options);

  if (options.help) {
    printUsage();
    return;
  }

  const submission = await fetchSubmission(options.submissionNumber);
  const profile = buildClientProfile(submission);

  if (options.dryRun) {
    printDryRun(profile, options);
    return;
  }

  createBranch(profile, options);

  console.log('Demo branch created.');
  console.log(`- Branch: ${profile.branchName}`);
  console.log(`- Submission: #${profile.submission.submission_number}`);
  console.log(`- Company: ${profile.submission.company_name}`);
  console.log(`- Pushed: ${options.push ? 'yes' : 'no'}`);
  if (!options.push) {
    console.log(`Next: git push -u origin ${profile.branchName}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
