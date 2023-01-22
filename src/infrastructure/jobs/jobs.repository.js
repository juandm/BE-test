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

  return { getJobs };
};

module.exports = { newJobsRepository };
