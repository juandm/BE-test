const errorTypes = require('../shared/error-types.enum');

const newDepositMoneyUseCase = ({ jobRepository, profileRepository, utils }) => {
  const execute = async ({ clientId, depositValue }) => {
    const { openTransaction, commitTransaction, rollbackTransaction } = utils;
    const trx = await openTransaction();

    try {
      // get total sum of all unpaid client jobs
      const totalUnpaidClientJobs = await jobRepository.getTotalUnpaidClientJobs(
        clientId,
        trx,
      );

      // validate maximum allowed deposit
      const maximumAllowedDeposit = (totalUnpaidClientJobs * 25) / 100;
      if (maximumAllowedDeposit < depositValue) {
        await rollbackTransaction(trx);
        return {
          success: false,
          type: errorTypes.UNPROCESSABLE,
          message: `Deposit value exceeds the maximum allowed: $ ${maximumAllowedDeposit}`,
        };
      }

      // update client's balance
      const client = await profileRepository.getById(clientId, trx);
      client.balance += depositValue;
      await client.save({ transaction: trx });

      await commitTransaction(trx);
      return { success: true };
    } catch (error) {
      console.error(error);
      await rollbackTransaction(trx);
      return {
        success: false,
        type: errorTypes.INTERNAL_ERROR,
        message: 'Error processing the deposit',
      };
    }
  };

  return {
    execute,
  };
};
module.exports = { newDepositMoneyUseCase };
