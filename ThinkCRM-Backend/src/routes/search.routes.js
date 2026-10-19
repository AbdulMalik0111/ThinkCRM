import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import * as searchController from '../controllers/search.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', searchController.getGlobalSearch);

export default router;
