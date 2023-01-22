const express = require('express');
const { QueryTypes } = require('sequelize');
const { db } = require('./infrastructure/database');
const { getProfile } = require('./middleware/getProfile');

const { newGetContractByIdUseCase } = require('./application/get-contract-by-id.usecase');
const { newGetActiveUseCase } = require('./application/get-active-contracts.usecase');
const { newGetUnpaidJobsUseCase } = require('./application/get-unpaid-jobs.usecase');
const {
  newContractsRepository,
} = require('./infrastructure/contracts/contracts.repository');
const { newJobsRepository } = require('./infrastructure/jobs/jobs.repository');

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
  const { Job, Contract, Profile } = db.models;
  const dbConnection = req.app.get('sequelize');
  const { profile, params, body } = req;
  const { jobId } = params;

  const trx = await dbConnection.transaction();

  try {
    const job = await Job.findOne({
      lock: true,
      transaction: trx,
      include: [
        {
          model: Contract,
          include: [
            {
              model: Profile,
              as: 'Client',
            },
            {
              model: Profile,
              as: 'Contractor',
            },
          ],
        },
      ],
      where: {
        id: jobId,
      },
    });

    const { Contract: jobContract } = job;
    // ensure user
    if (jobContract.ClientId !== profile.id && jobContract.ContractorId !== profile.id) {
      await trx.rollback();
      res.status(404).end();
      return;
    }

    // block payment if the job is already paid
    if (job.paid) {
      await trx.rollback();
      res.status(422).json({ message: 'job is already paid' });
      return;
    }

    // assumed this business rule: only allow full payment
    if (job.price !== body.paymentValue) {
      await trx.rollback();
      res
        .status(422)
        .json({ message: `Payment is not equal to job price ($ ${job.price})` })
        .end();
      return;
    }

    console.log(
      '====== \n\n Received payment: ',
      body.paymentValue,
      ' -- client balance: ',
      jobContract.Client.balance,
    );

    // validate client balance
    if (jobContract.Client.balance < body.paymentValue) {
      await trx.rollback();
      res.status(422).json({ message: 'insufficient funds' }).end();
      return;
    }

    const { Client, Contractor } = jobContract;

    Client.balance = (Client.balance - body.paymentValue).toFixed(2);
    Contractor.balance = (Contractor.balance + body.paymentValue).toFixed(2);

    await Client.save({ transaction: trx });
    await Contractor.save({ transaction: trx });

    await trx.commit();
    res.json({ success: true }).end();
  } catch (error) {
    console.error(error);
    await trx.rollback();
    res.status(500).end();
  }
});

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
  const { Job, Contract, Profile } = db.models;
  const dbConnection = req.app.get('sequelize');
  const { profile, params, body } = req;
  const { userId } = params;

  // check that the user is doing the deposit in his own profile
  if (profile.id !== parseInt(userId, 10)) {
    res.status(403).end();
    return;
  }

  const trx = await dbConnection.transaction();

  try {
    // get total sum of all client jobs
    const totalUnpaidClientJobs = await Job.sum('price', {
      lock: true,
      transaction: trx,
      include: {
        model: Contract,
        where: {
          ClientId: userId,
        },
      },
      where: {
        paid: null,
      },
    });

    // validate maximum allowed deposit
    const maximumAllowedDeposit = (totalUnpaidClientJobs * 25) / 100;
    if (maximumAllowedDeposit < body.depositValue) {
      await trx.rollback();
      res
        .status(422)
        .json({
          message: `Deposit value exceeds the maximum allowed: $ ${maximumAllowedDeposit}`,
        })
        .end();

      return;
    }

    // update client's balance
    const client = await Profile.findOne({
      lock: true,
      transaction: trx,
      where: { id: userId },
    });
    client.balance += body.depositValue;
    await client.save({ transaction: trx });

    await trx.commit();

    res.json();
  } catch (error) {
    console.error(error);
    await trx.rollback();
    res.status(500).json({ message: 'Error processing the deposit' }).end();
  }
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
  startDate.setUTCHours(0, 0, 0, 0);

  // correction to allow filtering in the same day
  const endDate = new Date(end);
  endDate.setUTCHours(23, 59, 59, 999);

  if (startDate.getTime() >= endDate.getTime()) {
    res
      .status(400)
      .json({ message: 'Invalid date range start should be before end date' });
    return;
  }

  const { connection } = db;
  const bestProfessions = await connection.query(
    `
    select sum(price) as totalEarned, profession
    from jobs j
        inner join Contracts c on j.ContractId = c.id
        inner join Profiles p on c.ContractorId = p.id
    where
        paid = 1 and p.type = 'contractor'
        and paymentDate >= :startAt AND paymentDate <= :endAt
    group by p.profession;`,
    {
      replacements: {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      },
      type: QueryTypes.SELECT,
    },
  );

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
  startDate.setUTCHours(0, 0, 0, 0);

  // correction to allow filtering in the same day
  const endDate = new Date(end);
  endDate.setUTCHours(23, 59, 59, 999);

  if (startDate.getTime() >= endDate.getTime()) {
    res
      .status(400)
      .json({ message: 'Invalid date range start should be before end date' });
    return;
  }

  const { connection } = db;
  const bestClients = await connection.query(
    `
    select sum(price) paid, p.id, p.firstName, p.lastName
    from jobs j
        inner join Contracts c on j.ContractId = c.id
        inner join Profiles p on c.ClientId  = p.id
    where paid = 1 and p.type = 'client'
        and paymentDate >= :startAt and paymentDate <= :endAt
        group by p.id
    order by 1 desc
    limit :limit;`,
    {
      replacements: {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        limit,
      },
      type: QueryTypes.SELECT,
    },
  );

  res.json(
    bestClients.map((client) => {
      // eslint-disable-next-line object-curly-newline
      const { paid, firstName, lastName, id } = client;
      return {
        id,
        paid,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
      };
    }),
  );
});

module.exports = app;
