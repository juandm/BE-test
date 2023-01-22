const express = require('express');

const router = express.Router();

function loadJobsRoutes({ getUnpaidJobsUseCase, middlewares }) {
  /**
   * @openapi
   * /jobs/unpaid:
   *   get:
   *     tags: [Jobs]
   *     security:
   *       - ApiAuth: []
   *     produces:
   *       - application/json
   *     description: Get all unpaid jobs for a user (client or contractor), for active contracts only
   *     responses:
   *       200:
   *         description: Array of jobs
   */
  router.get('/unpaid', ...middlewares, async (req, res) => {
    const { id: profileId } = req.profile;
    const jobs = await getUnpaidJobsUseCase.execute({ profileId });
    res.json(jobs);
  });

  return router;
}

module.exports = { loadJobsRoutes };
