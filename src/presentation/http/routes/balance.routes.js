const express = require('express');
const { mapError } = require('../utils/http-error-response.mapper');

const router = express.Router();

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
