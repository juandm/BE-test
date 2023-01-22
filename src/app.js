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
const errorTypes = require('./shared/error-types.enum');

const app = express();
app.use(express.json());

app.get('/contracts', getProfile, async (req, res) => {
  const { profile } = req;
  const contractRepository = newContractsRepository({ dbClient: db });
  const useCase = newGetActiveUseCase({ contractRepository });
  const contracts = await useCase.execute({ profileId: profile.id });
  return res.json(contracts);
});

app.get('/contracts/:id', getProfile, async (req, res) => {
  const { id: profileId } = req.profile;
  const { id: contractId } = req.params;

  const contractRepository = newContractsRepository({ dbClient: db });
  const useCase = newGetContractByIdUseCase({ contractRepository });
  const contract = await useCase.execute({ contractId });

  if (!contract) return res.status(404).end();

  if (contract.ClientId !== profileId && contract.ContractorId !== profileId) {
    return res.status(404).end();
  }

  return res.json(contract);
});

app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const { id: profileId } = req.profile;

  const jobRepository = newJobsRepository({ dbClient: db });
  const useCase = newGetUnpaidJobsUseCase({ jobRepository });
  const jobs = await useCase.execute({ profileId });
  res.json(jobs);
});

app.post('/balances/:jobId/pay', getProfile, async (req, res) => {
  const { profile, params, body } = req;
  const { jobId } = params;

  const jobRepository = newJobsRepository({ dbClient: db });
  const useCase = newPayJobUseCase({ jobRepository, utils });
  const response = await useCase.execute({
    profileId: profile.id,
    jobId,
    paymentValue: body.paymentValue,
  });

  if (response.success) {
    res.status(200).end();
    return;
  }

  // map error response to http responses
  const errorResponse = {
    message: '',
    httpStatus: 500,
  };

  errorResponse.message = response.message;
  switch (response.type) {
    case errorTypes.INTERNAL_ERROR:
      errorResponse.httpStatus = 500;
      break;
    case errorTypes.UNPROCESSABLE:
      errorResponse.httpStatus = 422;
      break;
    default:
      errorResponse.httpStatus = 500;
      break;
  }

  res.status(errorResponse.httpStatus).json({ message: errorResponse.message });
});

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
  const { profile, params, body } = req;
  const { userId } = params;

  // check that the user is doing the deposit in his own profile
  if (profile.id !== parseInt(userId, 10)) {
    res.status(403).end();
    return;
  }

  const jobRepository = newJobsRepository({ dbClient: db });
  const profileRepository = newProfilesRepository({ dbClient: db });
  const useCase = newDepositMoneyUseCase({ jobRepository, profileRepository, utils });
  const response = await useCase.execute({
    clientId: userId,
    depositValue: body.depositValue,
  });

  if (response.success) {
    res.status(200).end();
    return;
  }

  // map error response to http responses
  const errorResponse = {
    message: '',
    httpStatus: 500,
  };

  errorResponse.message = response.message;
  switch (response.type) {
    case errorTypes.INTERNAL_ERROR:
      errorResponse.httpStatus = 500;
      break;
    case errorTypes.UNPROCESSABLE:
      errorResponse.httpStatus = 422;
      break;
    default:
      errorResponse.httpStatus = 500;
      break;
  }

  res.status(errorResponse.httpStatus).json({ message: errorResponse.message });
});

app.get('/admin/best-profession', getProfile, async (req, res) => {
  const { start, end } = req.query;
  const dateRegex = /^2\d{3}-\d{2}-\d{2}$/;

  const areParamFormatValid = dateRegex.test(start) && dateRegex.test(end);
  if (!areParamFormatValid) {
    res
      .status(400)
      .json({ message: 'Invalid date filters, please use this format YYYY-MM-DD' });
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate.getTime() > endDate.getTime()) {
    res
      .status(400)
      .json({ message: 'Invalid date range start should be before end date' });
    return;
  }

  const profileRepository = newProfilesRepository({ dbClient: db });
  const useCase = newGetBestProfessionsUseCase({ profileRepository });
  const bestProfessions = await useCase.execute({ startAt: startDate, endAt: endDate });

  res.json(bestProfessions);
});

app.get('/admin/best-clients', getProfile, async (req, res) => {
  const { start, end, limit = 2 } = req.query;
  const dateRegex = /^2\d{3}-\d{2}-\d{2}$/;

  const areParamFormatValid = dateRegex.test(start) && dateRegex.test(end);
  if (!areParamFormatValid) {
    res
      .status(400)
      .json({ message: 'Invalid date filters, please use this format YYYY-MM-DD' });
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate.getTime() > endDate.getTime()) {
    res
      .status(400)
      .json({ message: 'Invalid date range start should be before end date' });
    return;
  }

  const profileRepository = newProfilesRepository({ dbClient: db });
  const useCase = newGetBestClientsUseCase({ profileRepository });
  const bestClients = await useCase.execute({
    startAt: startDate,
    endAt: endDate,
    limit,
  });
  res.json(bestClients);
});

module.exports = app;
