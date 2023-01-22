const { Op } = require('sequelize');

const newJobsRepository = ({ dbClient }) => {
  async function getJobs(profileId, filters) {
    const { status, isPaid } = filters;
    const { Job, Contract } = dbClient.models;

    const fullJobs = await Job.findAll({
      include: [
        {
          model: Contract,
          where: {
            [Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
            status,
          },
        },
      ],
      where: {
        paid: isPaid ? 1 : null,
      },
    });

    const jobs = fullJobs.map((job) => {
      const { Contract: contract, ...rest } = job.get({ plain: true });
      return rest;
    });

    return jobs;
  }

  async function getJobById(jobId, transaction = undefined) {
    const { Job, Contract, Profile } = dbClient.models;

    const job = await Job.findOne({
      lock: true,
      transaction,
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

    return job;
  }

  async function getTotalUnpaidClientJobs(clientId, transaction = undefined) {
    const { Job, Contract } = dbClient.models;

    const totalUnpaidClientJobs = await Job.sum('price', {
      lock: transaction !== undefined,
      transaction,
      include: {
        model: Contract,
        where: {
          ClientId: clientId,
        },
      },
      where: {
        paid: null,
      },
    });

    return totalUnpaidClientJobs;
  }

  return { getJobs, getJobById, getTotalUnpaidClientJobs };
};

module.exports = { newJobsRepository };
