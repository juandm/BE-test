const { db } = require('./database');

async function openTransaction() {
  return db.connection.transaction();
}

async function commitTransaction(trx) {
  return trx.commit();
}

async function rollbackTransaction(trx) {
  return trx.rollback();
}

module.exports = { openTransaction, commitTransaction, rollbackTransaction };
