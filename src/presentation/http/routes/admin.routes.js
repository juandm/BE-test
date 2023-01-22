const express = require('express');

const router = express.Router();

function loadAdminRoutes({
  getBestClientsUseCase,
  getBestProfessionsUseCase,
  middlewares,
}) {
  router.get('/best-profession', ...middlewares, async (req, res) => {
    const { start, end } = req.query;
    const dateRegex = /^2\d{3}-\d{2}-\d{2}$/;

    const areParamFormatValid = dateRegex.test(start) && dateRegex.test(end);
    if (!areParamFormatValid) {
      res
        .status(400)
        .json({ message: 'Invalid date filters, please use this format YYYY-MM-DD' });
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate.getTime() > endDate.getTime()) {
      res
        .status(400)
        .json({ message: 'Invalid date range start should be before end date' });
      return;
    }

    const bestProfessions = await getBestProfessionsUseCase.execute({
      startAt: startDate,
      endAt: endDate,
    });

    res.json(bestProfessions);
  });

  router.get('/best-clients', ...middlewares, async (req, res) => {
    const { start, end, limit = 2 } = req.query;
    const dateRegex = /^2\d{3}-\d{2}-\d{2}$/;

    const areParamFormatValid = dateRegex.test(start) && dateRegex.test(end);
    if (!areParamFormatValid) {
      res
        .status(400)
        .json({ message: 'Invalid date filters, please use this format YYYY-MM-DD' });
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate.getTime() > endDate.getTime()) {
      res
        .status(400)
        .json({ message: 'Invalid date range start should be before end date' });
      return;
    }

    const bestClients = await getBestClientsUseCase.execute({
      startAt: startDate,
      endAt: endDate,
      limit,
    });
    res.json(bestClients);
  });

  return router;
}

module.exports = { loadAdminRoutes };
