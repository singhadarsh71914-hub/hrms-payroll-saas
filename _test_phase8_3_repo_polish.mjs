import fs from 'fs';

console.log('Testing Phase 8.3 - Repository Polish...');

const checkFile = (file, name) => {
  if (fs.existsSync(file)) {
    console.log(`PASS: ${name} exists`);
  } else {
    console.error(`FAIL: ${name} is missing (${file})`);
  }
};

checkFile('README.md', 'README sections');
checkFile('docs/ARCHITECTURE.md', 'Architecture docs');
checkFile('.github/workflows/ci.yml', 'GitHub Actions');
checkFile('.github/ISSUE_TEMPLATE/bug_report.md', 'Issue templates');
checkFile('LICENSE', 'License');
checkFile('docs/CONTRIBUTING.md', 'Contributing guide');
checkFile('docs/SECURITY.md', 'Security policy');
checkFile('docs/ROADMAP.md', 'Roadmap');
checkFile('.github/CODEOWNERS', 'Codeowners');
checkFile('CHANGELOG.md', 'Release notes');
