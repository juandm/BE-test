const express = require('express');

const router = express.Router();

function loadContractRoutes({
  getActiveContractsUseCase,
  getContractByIdUseCase,
  middlewares,
}) {
  router.get('/', ...middlewares, async (req, res) => {
    const { profile } = req;
    const contracts = await getActiveContractsUseCase.execute({ profileId: profile.id });
    return res.json(contracts);
  });

  router.get('/:id', ...middlewares, async (req, res) => {
    const { id: profileId } = req.profile;
    const { id: contractId } = req.params;

    const contract = await getContractByIdUseCase.execute({ contractId });

    if (!contract) return res.status(404).end();

    if (contract.ClientId !== profileId && contract.ContractorId !== profileId) {
      return res.status(404).end();
    }

    return res.json(contract);
  });

  return router;
}

module.exports = { loadContractRoutes };
