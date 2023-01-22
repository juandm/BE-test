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

    const contracts = fullContracts.map((contract) => {
      const { Client, Contractor, ...rest } = contract.get({ plain: true });
      return rest;
    });

    return contracts;
  }

  async function getContractById(contractId) {
    const { Contract } = dbClient.models;
    const contract = await Contract.findOne({ where: { id: contractId } });
    return contract;
  }

  return { getActiveContracts, getContractById };
};

module.exports = { newContractsRepository };
