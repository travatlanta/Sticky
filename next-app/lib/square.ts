import { SquareClient, SquareEnvironment } from 'square';

const accessToken = process.env.SQUARE_ACCESS_TOKEN;

if (!accessToken) {
  console.warn('SQUARE_ACCESS_TOKEN is not set. Payment processing will not work.');
}

const client = new SquareClient({
  token: accessToken || '',
  environment: SquareEnvironment.Production,
});

export default client;
