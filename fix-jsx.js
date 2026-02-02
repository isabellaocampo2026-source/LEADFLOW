const fs = require('fs');
const path = 'app/[locale]/scraper/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// The broken pattern is:
// {/* Error */ }
// {
//     error && (
// We need to convert to:
// {/* Error */}
// {error && (

// Use \r\n for Windows line endings throughout

// Fix Error block
content = content.replace(
    /            \{\/\* Error \*\/ \}\r?\n    \{\r?\n        error && \(/g,
    '            {/* Error */}\r\n            {error && ('
);

// Fix Stats block
content = content.replace(
    /    \{\/\* Stats \*\/ \}\r?\n    \{\r?\n        stats && \(/g,
    '            {/* Stats */}\r\n            {stats && ('
);

// Fix Results block  
content = content.replace(
    /    \{\/\* Results \*\/ \}\r?\n    \{\r?\n        leads\.length > 0 && \(/g,
    '            {/* Results */}\r\n            {leads.length > 0 && ('
);

// Fix the closing patterns (convert ) \n } to )}):
content = content.replace(
    /        \)\r?\n    \}\r?\n\r?\n    \{\/\* Stats \*\/\}/g,
    '            )}\r\n\r\n            {/* Stats */}'
);

content = content.replace(
    /        \)\r?\n    \}\r?\n\r?\n    \{\/\* Results \*\/\}/g,
    '            )}\r\n\r\n            {/* Results */}'
);

// Fix the end of Results block and component
content = content.replace(
    /            <\/Card>\r?\n        \)\r?\n    \}\r?\n        <\/div >/g,
    '                </Card>\r\n            )}\r\n        </div>'
);

fs.writeFileSync(path, content);
console.log('File fixed! Lines:', content.split(/\r?\n/).length);
