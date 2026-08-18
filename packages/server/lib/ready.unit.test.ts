import { describe, expect, it } from 'vitest';

import { createDatabaseReadiness } from './ready.js';

describe('Nango database readiness', () => {
    it('checks the database on every probe instead of caching startup success', async () => {
        const results: Array<'healthy' | 'unhealthy'> = ['healthy', 'unhealthy', 'healthy'];
        const readiness = createDatabaseReadiness(async () => {
            const result = results.shift();
            if (result === 'unhealthy') {
                throw new Error('database unavailable');
            }
            return { rowCount: 1 };
        });

        await expect(readiness.check()).resolves.toBe(true);
        await expect(readiness.check()).resolves.toBe(false);
        await expect(readiness.check()).resolves.toBe(true);
    });

    it('stays unready after shutdown begins without querying the database', async () => {
        let queries = 0;
        const readiness = createDatabaseReadiness(async () => {
            queries += 1;
            return { rowCount: 1 };
        });

        readiness.beginShutdown();

        await expect(readiness.check()).resolves.toBe(false);
        expect(queries).toBe(0);
    });
});
