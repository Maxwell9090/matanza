import fs from 'fs/promises';
import JavaScriptObfuscator from 'javascript-obfuscator';

async function run() {
  const inputPath = 'script.js';
  const outputPath = 'script.obf.js';

  const source = await fs.readFile(inputPath, 'utf8');

  const obfuscated = JavaScriptObfuscator.obfuscate(source, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.2,
    numbersToExpressions: true,
    renameGlobals: true,
    selfDefending: true,
    simplify: true,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 1,
    splitStrings: true,
    splitStringsChunkLength: 5,
    transformObjectKeys: true,
    unicodeEscapeSequence: true,
    identifierNamesGenerator: 'hexadecimal',
    rotateStringArray: true
  }).getObfuscatedCode();

  await fs.writeFile(outputPath, obfuscated, 'utf8');
  console.log('✔ script.obf.js gerado com sucesso!');
}

run().catch((e) => {
  console.error('Falha ao ofuscar:', e);
  process.exit(1);
});