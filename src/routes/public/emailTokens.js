import { Router } from 'express';
import request from 'request';

import models from '../../models';
import http from "../../../config/http";

const router = Router();

/**
 * @api {get} [dev-]backend.wazzup24.com/api/v1/emailTokens/:token/handle Handle email token
 * @apiDescription Обработка перехода из письма
 * @apiVersion 1.0.0
 * @apiName handle-email-token
 * @apiGroup EmailTokens
 * @apiPermission all
 *
 * @apiParam {String} token Email token из письма
 */
router.get("/:token/handle", async (req, res) => {
  try {
    let emailToken = await models.emailToken.findById(req.params.token);

    if (!emailToken) {
      res.redirect(http[process.env.NODE_ENV].frontendURL + "/error/emailTokens/invalid");
      return;
    }

    if (emailToken.used) {
      res.redirect(http[process.env.NODE_ENV].frontendURL + "/error/emailTokens/used");
      return;
    }

    if (emailToken.validity && new Date(emailToken.validity) < new Date()) {
      res.redirect(http[process.env.NODE_ENV].frontendURL + "/error/emailTokens/expired");
      return;
    }

    let user = await models.user.findOne({
      where: {
        email: emailToken.email
      }
    });

    if (!user) {
      res.redirect(http[process.env.NODE_ENV].frontendURL + "/error/emailTokens/email-changed");
      return;
    }

    let userAccess = await models.userAccess.findOne({
      where: {
        userId: user.guid,
        role: 'owner'
      }
    });

    await models.emailToken.update({
      used: true
    }, {
      where: {
        token: emailToken.token
      }
    });

    request.post({
      url: http[process.env.NODE_ENV].authInnerURL + '/api/v1/tokens',
      body: {
        userGuid: userAccess.userId,
        accountId: userAccess.accountId
      },
      json: true
    }, async (err, resAuth) => {
      if (err || resAuth.statusCode != 200) {
        res.redirect(http[process.env.NODE_ENV].frontendURL + "/error/internal-error");
      } else {
        switch(emailToken.type) {
          case 'email_confirmation': {
            await models.user.update({
              emailConfirmed: true
            }, {
              where: {
                guid: user.guid
              }
            });
            res.redirect(http[process.env.NODE_ENV].frontendURL + `/backend/event/email_confirmation?accessToken=${resAuth.body.accessToken}&refreshToken=${resAuth.body.refreshToken}`);
            break;
          }
          case 'password_recovery': {
            await models.user.update({
              needChangePassword: true
            }, {
              where: {
                guid: user.guid
              }
            });
            res.redirect(http[process.env.NODE_ENV].frontendURL + `/backend/event/email_confirmation?accessToken=${resAuth.body.accessToken}&refreshToken=${resAuth.body.refreshToken}&email=${user.email}`);
            break;
          }
          default: {
            res.redirect(http[process.env.NODE_ENV].frontendURL + "/error/internal-error");
            return;
          }
        }
      }
    });
  } catch (error) {
    res.redirect(http[process.env.NODE_ENV].frontendURL + "/error/internal-error");
  }
});

export default router;