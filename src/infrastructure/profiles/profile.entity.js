const Sequelize = require('sequelize');

class Profile extends Sequelize.Model {}

const initProfileModel = (connection) => {
  Profile.init(
    {
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      profession: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL(12, 2),
      },
      type: {
        type: Sequelize.ENUM('client', 'contractor'),
      },
    },
    {
      sequelize: connection,
      modelName: 'Profile',
    },
  );

  return Profile;
};

module.exports = {
  initProfileModel,
};
