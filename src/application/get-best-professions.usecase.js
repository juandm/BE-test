const newGetBestProfessionsUseCase = ({ profileRepository }) => {
  const execute = async ({ startAt, endAt }) => {
    try {
      // correction to allow filtering in the same day
      startAt.setUTCHours(0, 0, 0, 0);
      endAt.setUTCHours(23, 59, 59, 999);

      const startDate = startAt.toISOString();
      const endDate = endAt.toISOString();

      const bestProfessions = await profileRepository.getBestProfessions(
        startDate,
        endDate,
      );
      return bestProfessions;
    } catch (error) {
      console.error(error);
      throw new Error('Unable to list best professions');
    }
  };

  return {
    execute,
  };
};
module.exports = { newGetBestProfessionsUseCase };
