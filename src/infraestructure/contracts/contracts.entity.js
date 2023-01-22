const Sequelize = require('sequelize');

class Contract extends Sequelize.Model {}

const initContractModel = (connection) => {
  Contract.init(
    {
      terms: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('new', 'in_progress', 'terminated'),
      },
    },
    {
      sequelize: connection,
      modelName: 'Contract',
    },
  );

  return Contract;
};

module.exports = { initContractModel };
