/* eslint-disable max-len */
const express = require('express');

const router = express.Router();

function loadAdminRoutes({
  getBestClientsUseCase,
  getBestProfessionsUseCase,
  middlewares,
}) {
  /**
   * @openapi
   * /admin/best-profession:
   *   get:
   *     tags: [Admin]
   *     security:
   *       - ApiAuth: []
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: start
   *         description: start date to filter the result example (2020-08-01)
   *         required: true
   *         in: query
   *         schema:
   *           type: string
   *       - name: end
   *         description: end date to filter the result example (2020-08-21)
   *         required: true
   *         in: query
   *         schema:
   *           type: string
   *     description: get a report with the list of professions that earned more money in the given time window
   *     responses:
   *       200:
   *         description: Array of professions
   */
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

  /**
   * @openapi
   * /admin/best-clients:
   *   get:
   *     tags: [Admin]
   *     security:
   *       - ApiAuth: []
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: start
   *         description: start date to filter the result example (2020-08-01)
   *         required: true
   *         in: query
   *         schema:
   *           type: string
   *       - name: end
   *         description: end date to filter the result example (2020-08-21)
   *         required: true
   *         in: query
   *         schema:
   *           type: string
   *       - name: limit
   *         description: number of items to be returned. defaults to 2
   *         required: false
   *         in: query
   *         schema:
   *           type: number
   *     description: get a report with the list of clients that paid more for jobs in the given time window
   *     responses:
   *       200:
   *         description: Array of clients
   */
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
