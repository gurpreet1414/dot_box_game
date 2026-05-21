process.env.NODE_ENV = process.env.NODE_ENV || 'production';

require('ts-node/register/transpile-only');
require('../server/index.ts');
