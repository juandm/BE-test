const express = require('express');
const { db } = require('./infrastructure/database');
const { getProfile } = require('./middleware/getProfile');

// Use cases
const {
  newGetBestProfessionsUseCase,
} = require('./application/get-best-professions.usecase');
const { newGetBestClientsUseCase } = require('./application/get-best-clients.usecase');
const { newGetContractByIdUseCase } = require('./application/get-contract-by-id.usecase');
const { newGetActiveUseCase } = require('./application/get-active-contracts.usecase');
const { newGetUnpaidJobsUseCase } = require('./application/get-unpaid-jobs.usecase');
const { newPayJobUseCase } = require('./application/pay-job.usecase');

// Repositories
const {
  newContractsRepository,
} = require('./infrastructure/contracts/contracts.repository');
const { newJobsRepository } = require('./infrastructure/jobs/jobs.repository');
const {
  newProfilesRepository,
} = require('./infrastructure/profiles/profiles.repository');

// utils
const utils = require('./infrastructure/utils');
const { newDepositMoneyUseCase } = require('./application/deposit-money.usecase');

// routers
const { loadContractRoutes } = require('./presentation/http/routes/contracts.routes');
const { loadAdminRoutes } = require('./presentation/http/routes/admin.routes');
const { loadJobsRoutes } = require('./presentation/http/routes/jobs.routes');
const { loadBalancesRoutes } = require('./presentation/http/routes/balance.routes');

// TODO: move to dedicated factories
const contractRepository = newContractsRepository({ dbClient: db });
const profileRepository = newProfilesRepository({ dbClient: db });
const jobRepository = newJobsRepository({ dbClient: db });

const payJobUseCase = newPayJobUseCase({ jobRepository, utils });
const getUnpaidJobsUseCase = newGetUnpaidJobsUseCase({ jobRepository });
const getActiveContractsUseCase = newGetActiveUseCase({ contractRepository });
const getContractByIdUseCase = newGetContractByIdUseCase({ contractRepository });
const getBestClientsUseCase = newGetBestClientsUseCase({ profileRepository });
const getBestProfessionsUseCase = newGetBestProfessionsUseCase({ profileRepository });
const depositMoneyUseCase = newDepositMoneyUseCase({
  jobRepository,
  profileRepository,
  utils,
});

// Load routes
const contractRouter = loadContractRoutes({
  getActiveContractsUseCase,
  getContractByIdUseCase,
  middlewares: [getProfile],
});

const adminRouter = loadAdminRoutes({
  getBestClientsUseCase,
  getBestProfessionsUseCase,
  middlewares: [getProfile],
});

const jobsRouter = loadJobsRoutes({
  getUnpaidJobsUseCase,
  middlewares: [getProfile],
});

const balanceRouter = loadBalancesRoutes({
  payJobUseCase,
  depositMoneyUseCase,
  middlewares: [getProfile],
});

const app = express();
app.use(express.json());

app.use('/contracts', contractRouter);
app.use('/admin', adminRouter);
app.use('/jobs', jobsRouter);
app.use('/balances', balanceRouter);

module.exports = app;
