import { Router } from 'express';
import newsRoutes from './news';
import platformRoutes from './platforms';
import crawlRoutes from './crawl';

const router = Router();

// Mount routes
router.use('/news', newsRoutes);
router.use('/platforms', platformRoutes);
router.use('/crawl', crawlRoutes);

export default router;
