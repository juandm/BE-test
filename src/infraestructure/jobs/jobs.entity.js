const Sequelize = require('sequelize');

class Job extends Sequelize.Model {}

const initJobModel = (connection) => {
  Job.init(
    {
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      paid: {
        type: Sequelize.BOOLEAN,
        default: false,
      },
      paymentDate: {
        type: Sequelize.DATE,
      },
    },
    {
      sequelize: connection,
      modelName: 'Job',
    },
  );

  return Job;
};

module.exports = {
  initJobModel,
};
