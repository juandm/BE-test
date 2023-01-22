const express = require('express');
const { mapError } = require('../utils/http-error-response.mapper');

const router = express.Router();

/**
 * @openapi
 * /balances/{jobId}/pay:
 *   post:
 *     tags: [Balances]
 *     security:
 *       - ApiAuth: []
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: jobId
 *         required: true
 *         in: path
 *         schema:
 *           type: string
 *     requestBody:
 *        required: true
 *        description: job payment value
 *        content:
 *          application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentValue:
 *                   type: number
 *     description: Performs a payment for a given job
 *     responses:
 *       200:
 *         description: payment applied successfully
 */
function loadBalancesRoutes({ payJobUseCase, depositMoneyUseCase, middlewares }) {
  router.post('/:jobId/pay', ...middlewares, async (req, res) => {
    const { profile, params, body } = req;
    const { jobId } = params;

    const response = await payJobUseCase.execute({
      profileId: profile.id,
      jobId,
      paymentValue: body.paymentValue,
    });

    if (response.success) {
      res.status(200).end();
      return;
    }

    // map error response to http responses
    const errorResponse = mapError(response);
    res.status(errorResponse.httpStatus).json({ message: errorResponse.message });
  });

  /**
   * @openapi
   * /balances/deposit/{userId}:
   *   post:
   *     tags: [Balances]
   *     security:
   *       - ApiAuth: []
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: userId
   *         description: user id that identifies the user that is receiving the deposit
   *         required: true
   *         in: path
   *         schema:
   *           type: string
   *     requestBody:
   *        required: true
   *        description: deposit value
   *        content:
   *          application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 depositValue:
   *                   type: number
   *     description: Performs a deposit in a client balance
   *     responses:
   *       200:
   *         description: deposit applied successfully
   */
  router.post('/deposit/:userId', ...middlewares, async (req, res) => {
    const { profile, params, body } = req;
    const { userId } = params;

    // check that the user is doing the deposit in his own profile
    if (profile.id !== parseInt(userId, 10)) {
      res.status(403).end();
      return;
    }

    const response = await depositMoneyUseCase.execute({
      clientId: userId,
      depositValue: body.depositValue,
    });

    if (response.success) {
      res.status(200).end();
      return;
    }

    // map error response to http responses
    const errorResponse = mapError(response);
    res.status(errorResponse.httpStatus).json({ message: errorResponse.message });
  });

  return router;
}

module.exports = { loadBalancesRoutes };
