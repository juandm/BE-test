const newGetActiveUseCase = ({ contractRepository }) => {
  const execute = async ({ profileId }) => {
    try {
      const contracts = await contractRepository.getActiveContracts(profileId);
      return contracts;
    } catch (error) {
      console.error(error);
      throw new Error('Unable to list the contracts');
    }
  };

  return {
    execute,
  };
};
module.exports = { newGetActiveUseCase };
