const { Op } = require('sequelize');

const newContractsRepository = ({ dbClient }) => {
  async function getActiveContracts(profileId) {
    const { Contract, Profile } = dbClient.models;

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

    return fullContracts;
  }
  return { getActiveContracts };
};

module.exports = { newContractsRepository };
