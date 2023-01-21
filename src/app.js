const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('./model');
const { getProfile } = require('./middleware/getProfile');

const app = express();
app.use(express.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.get('/contracts', getProfile, async (req, res) => {
  const { Contract, Profile } = req.app.get('models');
  const { id: profileId } = req.profile;

  const fullContracts = await Contract.findAll({
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
    where: {
      [Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
      status: { [Op.ne]: 'terminated' },
    },
  });

  const contracts = fullContracts.map((contract) => {
    const { Client, Contractor, ...rest } = contract.get({ plain: true });
    return rest;
  });

  return res.json(contracts);
});

app.get('/contracts/:id', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models');
  const { id: profileId } = req.profile;
  const { id: contractId } = req.params;

  const contract = await Contract.findOne({ where: { id: contractId } });

  if (!contract) return res.status(404).end();

  if (contract.ClientId !== profileId && contract.ContractorId !== profileId) {
    return res.status(404).end();
  }

  return res.json(contract);
});

app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const { Job, Contract } = req.app.get('models');
  const { id: profileId } = req.profile;

  const fullJobs = await Job.findAll({
    include: [
      {
        model: Contract,
        where: {
          [Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
          status: 'in_progress',
        },
      },
    ],
    where: {
      paid: null,
    },
  });

  const jobs = fullJobs.map((job) => {
    const { Contract: contract, ...rest } = job.get({ plain: true });
    return rest;
  });

  res.json(jobs);
});

app.post('/balances/:jobId/pay', getProfile, async (req, res) => {
  const { Job, Contract, Profile } = req.app.get('models');
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
  const { Job, Contract, Profile } = req.app.get('models');
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

module.exports = app;
