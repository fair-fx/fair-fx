import { once } from 'node:events';
import { createServer, type AddressInfo, type Socket } from 'node:net';

/** A server that accepts a connection and never answers it, with the database URL that reaches it. */
export interface SilentServer {
  readonly url: string;
  close(): Promise<void>;
}

/** Starts a silent server on a free port of this machine. */
export async function openSilentServer(): Promise<SilentServer> {
  const accepted = new Set<Socket>();
  const server = createServer((socket) => accepted.add(socket)).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;

  return {
    url: `postgres://fairfx@127.0.0.1:${port}/fairfx`,
    close: async () => {
      accepted.forEach((socket) => socket.destroy());
      server.close();
      await once(server, 'close');
    },
  };
}
