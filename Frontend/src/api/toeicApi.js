import axiosClient from './axiosClient';

const toeicCache = new Map();
const inflightToeic = new Map();
const TTL = 3 * 60 * 1000;

function fetchToeicCached(key, fetcher) {
  const cached = toeicCache.get(key);
  if (cached && Date.now() - cached.ts < TTL) {
    return Promise.resolve(cached.res);
  }
  if (inflightToeic.has(key)) return inflightToeic.get(key);

  const p = fetcher()
    .then((res) => {
      if (res?.data) toeicCache.set(key, { res, ts: Date.now() });
      return res;
    })
    .finally(() => inflightToeic.delete(key));

  inflightToeic.set(key, p);
  return p;
}

const toeicApi = {
  peekAllTests: () => toeicCache.get('all')?.res?.data || null,
  peekTestById: (id) => toeicCache.get(`id:${id}`)?.res?.data || null,
  peekTestByCode: (code) => toeicCache.get(`code:${code}`)?.res?.data || null,
  prefetchAllTests: () => {
    fetchToeicCached('all', () => axiosClient.get('/toeictest'))
      .then((res) => {
        const firstCode = res?.data?.[0]?.testId || 'READING_TEST_1';
        fetchToeicCached(`code:${firstCode}`, () => axiosClient.get(`/toeictest/by-code/${firstCode}`)).catch(() => {});
      })
      .catch(() => {});
  },
  getAllTests: () => fetchToeicCached('all', () => axiosClient.get('/toeictest')),
  getTestById: (id) => fetchToeicCached(`id:${id}`, () => axiosClient.get(`/toeictest/${id}`)),
  getTestByCode: (code) => fetchToeicCached(`code:${code}`, () => axiosClient.get(`/toeictest/by-code/${code}`)),
  deleteTest: (id) =>
    axiosClient.delete(`/toeictest/${id}`).then((res) => {
      toeicCache.clear();
      return res;
    }),
  bulkImport: (jsonContent) =>
    axiosClient.post('/toeictest/bulk-import', jsonContent).then((res) => {
      toeicCache.clear();
      return res;
    })
};

export default toeicApi;
