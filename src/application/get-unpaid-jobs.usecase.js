const ContractEnum = require('../shared/contract-status.enum');

const newGetUnpaidJobsUseCase = ({ jobRepository }) => {
  const execute = async ({ profileId }) => {
    try {
      const filters = { status: ContractEnum.IN_PROGRESS, isPaid: false };
      const jobs = await jobRepository.getJobs(profileId, filters);
      return jobs;
    } catch (error) {
      console.error(error);
      throw new Error('Unable to list unpaid jobs');
    }
  };

  return {
    execute,
  };
};
module.exports = { newGetUnpaidJobsUseCase };
