const Sequelize = require('sequelize');
const { initContractModel } = require('./contracts/contracts.entity');
const { initProfileModel } = require('./profiles/profile.entity');
const { initJobModel } = require('./jobs/jobs.entity');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite3',
});

const Contract = initContractModel(sequelize);
const Profile = initProfileModel(sequelize);
const Job = initJobModel(sequelize);

Profile.hasMany(Contract, { as: 'Contractor', foreignKey: 'ContractorId' });
Contract.belongsTo(Profile, { as: 'Contractor' });
Profile.hasMany(Contract, { as: 'Client', foreignKey: 'ClientId' });
Contract.belongsTo(Profile, { as: 'Client' });
Contract.hasMany(Job);
Job.belongsTo(Contract);

module.exports = {
  db: {
    connection: sequelize,
    models: { Contract, Profile, Job },
  },
};
