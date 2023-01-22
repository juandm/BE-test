const newGetBestClientsUseCase = ({ profileRepository }) => {
  const execute = async ({ startAt, endAt, limit }) => {
    try {
      // correction to allow filtering in the same day
      startAt.setUTCHours(0, 0, 0, 0);
      endAt.setUTCHours(23, 59, 59, 999);

      const startDate = startAt.toISOString();
      const endDate = endAt.toISOString();

      const bestClients = await profileRepository.getBestClients(
        startDate,
        endDate,
        limit,
      );
      return bestClients.map((client) => {
        // eslint-disable-next-line object-curly-newline
        const { paid, firstName, lastName, id } = client;
        return {
          id,
          paid,
          fullName: `${firstName.trim()} ${lastName.trim()}`,
        };
      });
    } catch (error) {
      console.error(error);
      throw new Error('Unable to list best clients');
    }
  };

  return {
    execute,
  };
};
module.exports = { newGetBestClientsUseCase };
