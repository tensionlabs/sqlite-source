# sqlite-source

SQLite amalgamation sources published to npm.

## Installation

Use dist-tags named `sqlite-amalgamation-<sqlite version>` to install an exact version.
See [Releases](#releases) for a full list of versions.
Example:

<!-- installation:start -->
```bash
npm install sqlite-source@sqlite-amalgamation-3.50.4
```
<!-- installation:end -->

## File Layout

All the source files are available at the root of the package.

```
sqlite3.c
sqlite3.h
sqlite3ext.h
shell.c
```

## Usage in Node

#### ESM

```js
import { fileURLToPath } from 'node:url';

const sqlite3cUrl = import.meta.resolve('sqlite-source/sqlite3.c');
const sqlite3cPath = fileURLToPath(sqlite3cUrl);
```

#### CommonJS

```js
const sqlite3cPath = require.resolve('sqlite-source/sqlite3.c');
```

## Releases

<!-- releases:start -->
| SQLite | npm |
| ------ | --- |
| [3.50.4](https://sqlite.org/releaselog/3_50_4.html) | [sqlite-amalgamation-3.50.4](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.50.4) |
| [3.50.3](https://sqlite.org/releaselog/3_50_3.html) | [sqlite-amalgamation-3.50.3](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.50.3) |
| [3.50.2](https://sqlite.org/releaselog/3_50_2.html) | [sqlite-amalgamation-3.50.2](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.50.2) |
| [3.50.1](https://sqlite.org/releaselog/3_50_1.html) | [sqlite-amalgamation-3.50.1](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.50.1) |
| [3.50.0](https://sqlite.org/releaselog/3_50_0.html) | [sqlite-amalgamation-3.50.0](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.50.0) |
| [3.49.2](https://sqlite.org/releaselog/3_49_2.html) | [sqlite-amalgamation-3.49.2](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.49.2) |
| [3.49.1](https://sqlite.org/releaselog/3_49_1.html) | [sqlite-amalgamation-3.49.1](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.49.1) |
| [3.49.0](https://sqlite.org/releaselog/3_49_0.html) | [sqlite-amalgamation-3.49.0](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.49.0) |
| [3.48.0](https://sqlite.org/releaselog/3_48_0.html) | [sqlite-amalgamation-3.48.0](https://www.npmjs.com/package/sqlite-source/v/sqlite-amalgamation-3.48.0) |
<!-- releases:end -->
