import { openDatabase } from '@fair-fx/db';
import { openSilentServer } from '@fair-fx/db/testing';

describe('openDatabase', () => {
  it('gives up on a server that accepts the connection and never answers', async () => {
    const server = await openSilentServer();
    const database = openDatabase(server.url, 50);

    const answer = database.query('SELECT 1');

    await expect(answer).rejects.toThrow('Connection terminated due to connection timeout');
    await database.end();
    await server.close();
  });
});
