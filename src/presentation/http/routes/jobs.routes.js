const express = require('express');

const router = express.Router();

function loadJobsRoutes({ getUnpaidJobsUseCase, middlewares }) {
  router.get('/unpaid', ...middlewares, async (req, res) => {
    const { id: profileId } = req.profile;
    const jobs = await getUnpaidJobsUseCase.execute({ profileId });
    res.json(jobs);
  });

  return router;
}

module.exports = { loadJobsRoutes };
