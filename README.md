# sqlite-source

SQLite amalgamation sources published to npm.

## Installation

Use dist-tags named `sqlite-amalgamation-<sqlite version>` to install an exact version.
See [Releases](#releases) for a full list of versions.
Example:

<!-- installation:start -->
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
<!-- releases:end -->
