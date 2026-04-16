const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Retrieve Markdown content
 *     description: Returns a Markdown formatted string representing content. This endpoint is designed to eventually integrate with a RAG system.
 *     responses:
 *       200:
 *         description: A JSON object containing the Markdown content.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                   example: "# Patient Guidelines\n\n- Take medicines on time\n- Drink enough water\n- Avoid oily food"
 *       500:
 *         description: Server error
 */
router.get('/', contentController.getContent);

module.exports = router;
