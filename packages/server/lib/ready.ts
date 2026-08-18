import db from '@nangohq/database';

import { asyncWrapper } from './utils/asyncWrapper.js';

type DatabaseQuery = () => Promise<{ rowCount?: number }>;

export const createDatabaseReadiness = (query: DatabaseQuery) => {
    let isShuttingDown = false;

    return {
        beginShutdown: () => {
            isShuttingDown = true;
        },
        check: async () => {
            if (isShuttingDown) {
                return false;
            }

            try {
                return (await query()).rowCount === 1;
            } catch {
                return false;
            }
        }
    };
};

const readiness = createDatabaseReadiness(() => db.knex.raw('SELECT 1'));

export const beginShutdown = readiness.beginShutdown;

export const getReady = asyncWrapper<any, any>(async (_, res) => {
    if (await readiness.check()) {
        res.status(200).send({ result: 'ok' });
        return;
    }
    res.status(503).send({ result: 'not ready' });
});
