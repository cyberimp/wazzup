import { Router } from 'express';

import models from '../../models';
import { randomPromo } from '../../utils/random';
import constants from '../../constants';

const router = Router();

/**
 * @api {post} [dev-]backend.wazzup24.com/api/v1/promoCodes/random Generate random promoCode
 * @apiDescription Генерация случайного уникального промокода
 * @apiVersion 1.0.0
 * @apiName generate_random_promo_code
 * @apiGroup PromoCodes
 * @apiPermission all
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *   {
 *     "data": {
 *       "code": "4pvugb"
 *     }
 *   }
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *       "backend": [
 *         "Can't generate promoCode",
 *         "No more attempts"
 *       ]
 *     }
 *   }
 */
router.post("/random", async (req, res) => {
  try {
    for (let i = 0; i < constants.DEFAULT_PROMO_GENERATE_ATTEMPTS; i++) {
      let promoCode = randomPromo(constants.DEFAULT_PROMO_LENGTH);
      let object = await models.promoCode.findById(promoCode);
      if (!object) {
        let promo = await models.promoCode.create({
          code: promoCode.toUpperCase(),
          accountId: null,
          type: 11,
          validity: null
        });

        if (promo) {
          res.status(200).json({ data: { code: promoCode } })
          return
        }
      }
    }

    res.status(400).json({ errors: { backend: ["No more attempts"] } })
  } catch (error) {
    res.status(400).json({ errors: { backend: [ "Can't generate promoCode", error ] } })
  }
});

export default router;