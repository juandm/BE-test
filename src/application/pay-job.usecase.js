const errorTypes = require('../shared/error-types.enum');

const newPayJobUseCase = ({ jobRepository, utils }) => {
  const execute = async ({ jobId, profileId, paymentValue }) => {
    const { openTransaction, commitTransaction, rollbackTransaction } = utils;
    const trx = await openTransaction();

    try {
      const job = await jobRepository.getJobById(jobId, trx);
      const { Contract: jobContract } = job;

      // ensure user
      if (jobContract.ClientId !== profileId && jobContract.ContractorId !== profileId) {
        await rollbackTransaction(trx);
        return {
          success: false,
          type: errorTypes.UNPROCESSABLE,
          message: 'unable to process the payment',
        };
      }

      // block payment if the job is already paid
      if (job.paid) {
        await rollbackTransaction(trx);
        return {
          success: false,
          type: errorTypes.UNPROCESSABLE,
          message: 'job is already paid',
        };
      }

      // assumed this business rule: only allow full payment
      if (job.price !== paymentValue) {
        await rollbackTransaction(trx);
        return {
          success: false,
          type: errorTypes.UNPROCESSABLE,
          message: `Payment is not equal to job price ($ ${job.price})`,
        };
      }

      console.log(
        '====== \n\n Received payment: ',
        paymentValue,
        ' -- client balance: ',
        jobContract.Client.balance,
      );

      // validate client balance
      if (jobContract.Client.balance < paymentValue) {
        await rollbackTransaction(trx);
        // res.status(422).json({ message: 'insufficient funds' }).end();
        return {
          success: false,
          type: errorTypes.UNPROCESSABLE,
          message: 'insufficient funds',
        };
      }

      const { Client, Contractor } = jobContract;
      // TODO: move to repositories
      // save new balances
      Client.balance = (Client.balance - paymentValue).toFixed(2);
      Contractor.balance = (Contractor.balance + paymentValue).toFixed(2);
      await Client.save({ transaction: trx });
      await Contractor.save({ transaction: trx });

      // mark job as paid
      job.paid = 1;
      job.paymentDate = new Date().toISOString();
      await job.save({ transaction: trx });

      await commitTransaction(trx);
      return { success: true };
    } catch (error) {
      console.error(error);
      await trx.rollback();
      return {
        success: false,
        type: errorTypes.INTERNAL_ERROR,
        message: 'Error paying the job',
      };
    }
  };

  return {
    execute,
  };
};
module.exports = { newPayJobUseCase };
