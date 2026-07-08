const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../../supabase/migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let newMigrationContent = `-- ============================================
-- Migration: Harden SECURITY DEFINER functions with search_path
-- ============================================

`;

let count = 0;

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Match function signature and the whole block up to SECURITY DEFINER to make sure it is one
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_.]+)\s*\(([^)]*)\)[\s\S]*?SECURITY\s+DEFINER/gi;
  
  let match;
  while ((match = funcRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const funcName = match[1];
    const argsRaw = match[2];

    // Check if it already has SET search_path (search within a bit more context if possible)
    const contextStart = match.index;
    const contextEnd = match.index + fullMatch.length + 100;
    const context = content.substring(contextStart, contextEnd);
    if (/SET\s+search_path/i.test(context)) {
      continue;
    }

    // Parse arguments to get just the types
    let argTypes = [];
    if (argsRaw.trim() !== '') {
      const args = argsRaw.split(',').map(a => a.trim());
      for (let arg of args) {
        // e.g. "p_user_id UUID", "p_old_values JSONB DEFAULT NULL", "OUT p_res TEXT"
        let parts = arg.split(/\s+/);
        
        // Remove IN, OUT, INOUT
        if (['IN', 'OUT', 'INOUT', 'VARIADIC'].includes(parts[0].toUpperCase())) {
          parts.shift();
        }
        
        // Remove parameter name (if it's not just a type)
        // In Postgres, parameter name is optional. If there's only one part, it's the type.
        // If there are multiple parts, the first is usually the name, second is the type.
        let typePart = '';
        if (parts.length > 1 && !['DEFAULT', '='].includes(parts[1].toUpperCase())) {
          // first is name, second is type
          typePart = parts[1];
          // type might be multiple words like "TIMESTAMP WITH TIME ZONE"
          // We'll just grab everything up to DEFAULT or =
          let typeWords = [];
          for (let i = 1; i < parts.length; i++) {
            if (['DEFAULT', '='].includes(parts[i].toUpperCase())) break;
            typeWords.push(parts[i]);
          }
          typePart = typeWords.join(' ');
        } else {
          // first is type
          let typeWords = [];
          for (let i = 0; i < parts.length; i++) {
            if (['DEFAULT', '='].includes(parts[i].toUpperCase())) break;
            typeWords.push(parts[i]);
          }
          typePart = typeWords.join(' ');
        }
        
        argTypes.push(typePart);
      }
    }

    const signature = `${funcName}(${argTypes.join(', ')})`;
    newMigrationContent += `ALTER FUNCTION ${signature} SET search_path = public;\n`;
    count++;
  }
}

if (count > 0) {
  const timestamp = '20260708000000'; // Current date prefix
  const outputFileName = `${timestamp}_harden_security_definer_rpc.sql`;
  const outputPath = path.join(migrationsDir, outputFileName);
  fs.writeFileSync(outputPath, newMigrationContent);
  console.log(`Generated migration with ${count} function fixes at ${outputPath}`);
} else {
  console.log('No vulnerable functions found.');
}
