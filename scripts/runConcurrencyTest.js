const { default: axios } = require('axios');

const data = [
  {
    id: 3,
    description: 'work',
    price: 202,
    paid: null,
    paymentDate: null,
    createdAt: '2023-01-21T22:03:10.914Z',
    updatedAt: '2023-01-21T22:03:10.914Z',
    ContractId: 3,
  },
  {
    id: 4,
    description: 'work',
    price: 200,
    paid: null,
    paymentDate: null,
    createdAt: '2023-01-21T22:03:10.915Z',
    updatedAt: '2023-01-21T22:03:10.915Z',
    ContractId: 4,
  },
];

async function payJob(jobId, paymentValue) {
  console.log('>>>> Paying: ', paymentValue);
  const api = axios.create({ baseURL: 'http://localhost:3001' });
  const { data: response, status } = await api.post(
    `/balances/${jobId}/pay`,
    { paymentValue },
    { headers: { profile_id: 2 } },
  );

  return { response, status };
}

async function main() {
  const responses = await Promise.allSettled(data.map((d) => payJob(d.id, d.price)));
  return responses;
}

main()
  .then((d) => console.log(JSON.stringify(d, null, 2)))
  .catch((err) => console.error(err));
