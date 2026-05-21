const fs = require('fs');
const path = require('path');

const tracePath = path.join(process.cwd(), '.next', 'trace');

try {
  fs.rmSync(tracePath, { force: true });
} catch (error) {
  // A running Next dev server can hold this file open on Windows.
  // Ignore it here; the real dev command will report a port/startup error if one matters.
}
