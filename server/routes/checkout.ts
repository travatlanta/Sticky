import express from 'express';
import { calculateShipping } from '../services/shipping';

const router = express.Router();

router.post('/shipping-quote', (req, res) => {
  const { products, address } = req.body;
  const shipping = calculateShipping(products, address);
  res.json({ shipping });
});

export default router;
