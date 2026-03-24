const { execSync } = require('child_process');
const path = require('path');

const runScript = (scriptName) => {
    console.log(`\n=== Running ${scriptName} ===`);
    execSync(`node ${path.join(__dirname, scriptName)}`, { stdio: 'inherit' });
};

try {
    runScript('fetch.js');
    runScript('translate.js');
    runScript('group.js');
    runScript('export.js');
    console.log('\n✅ All steps completed successfully!');
} catch (error) {
    console.error('\n❌ Workflow failed:', error.message);
    process.exit(1);
}