const { QueryTypes } = require('sequelize');

const newProfilesRepository = ({ dbClient }) => {
  async function getBestProfessions(startDate, endDate) {
    const { connection } = dbClient;
    const bestProfessions = await connection.query(
      `
        select sum(price) as totalEarned, profession
        from jobs j
            inner join Contracts c on j.ContractId = c.id
            inner join Profiles p on c.ContractorId = p.id
        where
            paid = 1 and p.type = 'contractor'
            and paymentDate >= :startAt AND paymentDate <= :endAt
        group by p.profession
        order by 1 desc;`,
      {
        replacements: {
          startAt: startDate,
          endAt: endDate,
        },
        type: QueryTypes.SELECT,
      },
    );

    return bestProfessions;
  }

  async function getBestClients(startDate, endDate, limit) {
    const { connection } = dbClient;
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
          startAt: startDate,
          endAt: endDate,
          limit,
        },
        type: QueryTypes.SELECT,
      },
    );
    return bestClients;
  }

  return { getBestProfessions, getBestClients };
};

module.exports = { newProfilesRepository };
