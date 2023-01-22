const newGetContractByIdUseCase = ({ contractRepository }) => {
  const execute = async ({ contractId }) => {
    try {
      const contract = await contractRepository.getContractById(contractId);
      return contract;
    } catch (error) {
      console.error(error);
      throw new Error('Unable to find the contract');
    }
  };

  return {
    execute,
  };
};
module.exports = { newGetContractByIdUseCase };
