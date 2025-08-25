# PRC API Client

A minimal, type-safe TypeScript client for the Police Roleplay Community (PRC) API.
No packages, no bullshit. 

## Install

```bash
npm install erlc.ts
```

## Usage

```typescript
import { PRCClient } from 'erlc.ts';

const client = new PRCClient({ serverKey: 'your-server-key' });

const { data: status } = await client.getServerStatus();
console.log(status);

await client.executeCommand(':h Check out Melonly!');
```

## Features

- TypeScript support
- Built-in caching
- Automatic Rate limit handling
- Extremely low memory usage
- Simple API

## License

MIT