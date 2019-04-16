import { Router } from 'express';

import api from "../../../config/api.json";

const router = Router();

/**
 * @api {get} [dev-]backend.wazzup24.com/api Get API information
 * @apiDescription Получение информации об API
 * @apiVersion 1.0.0
 * @apiName version
 * @apiGroup API
 * @apiPermission all
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *   {
 *     "data": {
 *       "version": "1"
 *     }
 *   }
 */
router.get("/", (req, res) => {
  res.json({
    data: {
      version: api.version
    }
  });
});


export default router;