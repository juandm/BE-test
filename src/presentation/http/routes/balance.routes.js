const express = require('express');
const errorTypes = require('../../../shared/error-types.enum');

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
    const errorResponse = {
      message: '',
      httpStatus: 500,
    };

    errorResponse.message = response.message;
    switch (response.type) {
      case errorTypes.INTERNAL_ERROR:
        errorResponse.httpStatus = 500;
        break;
      case errorTypes.UNPROCESSABLE:
        errorResponse.httpStatus = 422;
        break;
      default:
        errorResponse.httpStatus = 500;
        break;
    }

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
    const errorResponse = {
      message: '',
      httpStatus: 500,
    };

    errorResponse.message = response.message;
    switch (response.type) {
      case errorTypes.INTERNAL_ERROR:
        errorResponse.httpStatus = 500;
        break;
      case errorTypes.UNPROCESSABLE:
        errorResponse.httpStatus = 422;
        break;
      default:
        errorResponse.httpStatus = 500;
        break;
    }

    res.status(errorResponse.httpStatus).json({ message: errorResponse.message });
  });

  return router;
}

module.exports = { loadBalancesRoutes };
