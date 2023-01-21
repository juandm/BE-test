class ContractController {
  constructor(contractService) {}

  async getContractById(contractId, requesterUser) {
    const contracts = await this.contractService.getContractById(contractId);
    console.log(contracts, requesterUser);
  }
}

module.exports = {
  ContractController,
};
