const express = require('express');

const router = express.Router();

function loadContractRoutes({
  getActiveContractsUseCase,
  getContractByIdUseCase,
  middlewares,
}) {
  /**
   * @openapi
   * /contracts:
   *   get:
   *     tags: [Contracts]
   *     security:
   *       - ApiAuth: []
   *     produces:
   *       - application/json
   *     description: get all non terminated contracts belonging to a user (client or contractor).
   *     responses:
   *       200:
   *         description: Array of contracts
   */
  router.get('/', ...middlewares, async (req, res) => {
    const { profile } = req;
    const contracts = await getActiveContractsUseCase.execute({ profileId: profile.id });
    return res.json(contracts);
  });

  /**
   * @openapi
   * /contracts/{contractId}:
   *   get:
   *     tags: [Contracts]
   *     security:
   *       - ApiAuth: []
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: contractId
   *         description: contract id
   *         required: true
   *         in: path
   *         schema:
   *           type: string
   *     description: return the contract only if it belongs to the profile calling
   *     responses:
   *       200:
   *         description: contract
   */
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
