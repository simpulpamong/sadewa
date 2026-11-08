import handler from '../src/api/server';

export default handler;

export const config = {
  api: {
    bodyParser: false, // Express handles parsing; limit disesuaikan untuk Vercel serverless (~4.5MB)
  },
};
