import { Router } from 'express';
import { health, listArticles, getArticle } from '../../../controllers/public.controller.js';
const router = Router();
router.get('/health', health);
router.get('/articles', listArticles);
router.get('/articles/:slug', getArticle);
export default router;
