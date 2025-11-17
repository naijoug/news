import { Router } from 'express';
import { PlatformController } from '../controllers/PlatformController';
import { PlatformRepository } from '../repositories/PlatformRepository';
import { 
  validatePlatformQuery, 
  validatePlatformId, 
  validatePlatformBody 
} from '../middleware/validation';

const router = Router();
const platformRepo = new PlatformRepository();
const platformController = new PlatformController(platformRepo);

/**
 * GET /api/platforms
 * Get all platforms
 * Query params: enabled (optional, boolean)
 */
router.get('/', validatePlatformQuery, platformController.getPlatforms);

/**
 * POST /api/platforms
 * Create a new platform
 * Body: Platform object with id, name, iconUrl, enabled, config
 */
router.post('/', validatePlatformBody, platformController.createPlatform);

/**
 * PUT /api/platforms/:id
 * Update an existing platform
 * Params: id (platform ID)
 * Body: Partial platform object with fields to update
 */
router.put('/:id', validatePlatformId, validatePlatformBody, platformController.updatePlatform);

/**
 * DELETE /api/platforms/:id
 * Delete a platform
 * Params: id (platform ID)
 */
router.delete('/:id', validatePlatformId, platformController.deletePlatform);

/**
 * POST /api/platforms/:id/test
 * Test a platform's crawler configuration
 * Params: id (platform ID)
 */
router.post('/:id/test', validatePlatformId, platformController.testPlatform);

export default router;
