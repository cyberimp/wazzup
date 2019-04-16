import { Router } from 'express';
import request from 'request';
import validate from 'validate.js';
import jwt from "jsonwebtoken";
import mustache from "mustache";

import { emailConstraints, hashPasswordConstraints } from '../../validators/user';
import { langConstraints } from '../../validators/account';
import { promoConstraints } from '../../validators/promo';
import models from '../../models';
import http from "../../../config/http";

const router = Router();

/**
 * @api {get} [dev-]backend.wazzup24.com/api/v1/users/:guid/password/change Change password
 * @apiDescription Фактическое изменение пароля
 * @apiVersion 1.0.0
 * @apiName change-password
 * @apiGroup Users
 * @apiPermission all
 *
 * @apiHeader {String} authorization Значение accessToken, полученное в процессе аутентификации
 *
 * @apiParam {String} email Email пользователя
 * @apiParam {String} hashPassword Пароль пользователя, полученный с помощью функции хеширования
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *   {
 *     "expiresIn": 3600,
 *     "accessToken": '...',
 *     "refreshToken": '...'
 *   }
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *       "email": [
 *         "Email can't be blank",
 *         "Email is not a valid email"
 *       ],
 *       "hashPassword": [
 *         "Hash password can't be blank",
 *         "Hash password length must be 64"
 *       ],
 *       "backend": [
 *         "User not found",
 *         "Can not delete active tokens"
 *         "Can not generate tokens"
 *         "Can not delete active tokens"
 *         "Email not equal"
 *         "Email not confirmed"
 *         "Can not delete active tokens"
 *         "Can't change password"
 *       ]
 *     }
 *   }
 */
router.post("/password/change", async (req, res) => {
  const validationResult = validate(req.body, {
    email: emailConstraints,
    hashPassword: hashPasswordConstraints
  });

  if(!req.get('authorization')) {
    res.sendStatus(401);
    return;
  }

  if (validationResult) {
    res.status(400).json({
      errors: validationResult
    });
  } else {
    try {
      let data = jwt.decode(req.get('authorization'));

      const user = await models.user.findOne({
        where: {
          guid: data.userGuid
        }
      });
      
      if (!user) {
        res.status(400).json({
          errors: {
            backend: ["User not found"]
          }
        });
      } else {
        if (user.emailConfirmed) {
          if (user.email === req.body.email) {

            Promise.all([
              new Promise((resolve, reject) => {
                request.delete({
                  url: http[process.env.NODE_ENV].authInnerURL + '/api/v1/tokens/users/' + data.userGuid.toUpperCase(),
                  json: true,
                  timeout: http[process.env.NODE_ENV].requestTimeout
                }, (err, res) => {
                  err ? reject(err) : resolve(res);
                });
              }),
              new Promise((resolve, reject) => {
                request.post({
                  url: http[process.env.NODE_ENV].authInnerURL + '/api/v1/tokens',
                  body: {
                    userGuid: data.userGuid,
                    accountId: data.accountId
                  },
                  json: true,
                  timeout: http[process.env.NODE_ENV].requestTimeout
                }, (err, res) => {
                  err ? reject(err) : resolve(res);
                });
              })
            ]).then(async (results) => {
              if (results[0].statusCode !== 200) {
                res.status(400).json({
                  errors: {
                    backend: ["Can not delete active tokens"]
                  }
                });
              } else if (results[1].statusCode !== 200) {
                res.status(400).json({
                  errors: {
                    backend: ["Can not generate tokens"]
                  }
                });
              } else {
                user.hashPassword = req.body.hashPassword;
                await user.save();
                res.json(results[1].body);
              }
            });
          } else {
            res.status(400).json({
              errors: {
                backend: ["Email not equal"]
              }
            });
          }
        } else {
          res.status(400).json({
            errors: {
              backend: ["Email not confirmed"]
            }
          });
        }
      }
    } catch(error) {
      res.status(400).json({
        errors: {
          backend: ["Can't change password"]
        }
      });
    }
  }
});

/**
 * @api {post} [dev-]backend.wazzup24.com/api/v1/users/password/recovery Password recovery
 * @apiDescription Восстановление пароля
 * @apiVersion 1.0.0
 * @apiName password_recovery
 * @apiGroup Users
 * @apiPermission all
 *
 * @apiParam {String} email Email пользователя
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *       "email": [
 *         "Email can't be blank",
 *         "Email is not a valid email"
 *       ],
 *       "backend": [
 *         "User not found",
 *         "User not found",
 *         "User is blocked",
 *         "Email not confirmed",
 *         "Role 'owner' not found",
 *         "Account email is not equal",
 *         "Account is blocked",
 *         "Template is not exist",
 *         "Can't recovery password",
 *         "Email not confirmed"
 *       ]
 *     }
 *   }
 */
router.post("/password/recovery", async (req, res) => {
  const validationResult = validate(req.body, { email: emailConstraints })

  if (validationResult) {
    res.status(400).json({ errors: validationResult })
    return
  }
  try {
    const user = await models.user.findOne({ where: { email: req.body.email } })
    
    if (!user) {
      res.status(400).json({ errors: { backend: ["User not found"] } })
      return
    }

    if (user.blocked) {
      res.status(400).json({ errors: { backend: ["User is blocked"] } })
      return
    }

    if (!user.emailConfirmed) {
      res.status(400).json({ errors: { backend: ["Email not confirmed"] } })
      return
    }

    const userAccess = await models.userAccess.findOne({ where: { userId: user.guid, role: 'owner' } })

    if (!userAccess) {
      res.status(400).json({ errors: { backend: ["Role 'owner' not found"] } })
      return
    }

    const account = await models.account.findOne({ where: { id: userAccess.accountId, regEmail: user.email } })
    if (!account) {
      res.status(400).json({ errors: { backend: ["Account email is not equal"] } })
      return
    }

    if (account.blocked) {
      res.status(400).json({ errors: { backend: ["Account is blocked"] } })
      return
    }

    let template = await models.notifyTemplate.findOne({ where: { code: 'password_recovery', lang: account.lang } })

    if (!template) {
      res.status(400).json({ errors: { backend: ["Template is not exist"] } })
      return
    }

    let emailToken = await models.emailToken.create({
      email: req.body.email,
      accountId: account.id,
      userId: user.guid,
      type: 'password_recovery',
      validity: new Date((new Date()).getTime() + 1000*60*24*7)
    })

    const emailHtml = mustache.render(template.emailHtml, {
      recoveryUrl: http[process.env.NODE_ENV].backendURL + "/api/v1/emailTokens/" + emailToken.token + "/handle"
    });

    await models.email.create({
      template: template.code,
      lang: template.lang,
      accountId: account.id,
      userId: user.guid,
      email: req.body.email,
      title: template.emailTitle,
      html: emailHtml,
      errors: ''
    })

    res.json({})

  } catch(error) {
    console.log(error);
    res.status(400).json({
      errors: {
        backend: ["Can't recovery password"]
      }
    });
  }
  
});

/**
 * @api {post} [dev-]backend.wazzup24.com/api/v1/users/signup Signup user
 * @apiDescription Регистрация пользователя
 * @apiVersion 1.0.0
 * @apiName signup
 * @apiGroup Users
 * @apiPermission all
 *
 * @apiParam {String} email Email пользователя
 * @apiParam {String} hashPassword Пароль пользователя, полученный с помощью функции хеширования
 * @apiParam {String} lang Двухсимвольный идентификатор языка
 * @apiParam {String} promo Промокод, указанный при регистрации [необязательное поле]
 * @apiParam {String} ref Ссылка [необязательное поле]
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *       "email": [
 *         "Email can't be blank",
 *         "Email is not a valid email"
 *       ],
 *       "hashPassword": [
 *         "Hash password can't be blank",
 *         "Hash password length must be 64"
 *       ],
 *       "promo": ["Promo is too long (maximum is 50 characters)"]
 *       "lang": [
 *         "Lang can't be blank",
 *         "Lang length must be 2"
 *        ],
 *       "backend": [
 *         "User is exist"
 *         "Promo is not exist"
 *         "Promo is old"
 *         "Template is not exist"
 *         "Can't register user"
 *       ]
 *     }
 *   }
 */
router.post("/signup", async (req, res) => {
  try {
    const validationResult = validate(req.body, {
      email: emailConstraints,
      hashPassword: hashPasswordConstraints,
      lang: langConstraints,
      promo: promoConstraints
    });

    if (validationResult) {
      res.status(400).json({ errors: validationResult })
      return
    }
    let count = await models.user.count({ where: { email: req.body.email } })

    let promo
    if (req.body.promo) {
      promo = await models.promoCode.findById(req.body.promo.toUpperCase());
      if (!promo) {
        res.status(400).json({ errors: { backend: ["Promo is not exist"] } })
        return
      }

      if (promo.validity && new Date(promo.validity) < Date.now()) {
        res.status(400).json({ errors: { backend: ["Promo is old"] } })
        return
      }
    }

    let template = await models.notifyTemplate.findOne({
      where: {
        code: 'registration_' + (promo ? 'promoType=' + promo.type.toString() : 'withoutPromo'),
        lang: req.body.lang
      }
    });

    if (!template) {
      res.status(400).json({ errors: { backend: ["Template is not exist"] } })
      return
    }

    if (count) {
      res.status(400).json({ errors: { backend: ["User is exist"] } })
      return
    }

    let firstResults = await Promise.all([
      models.user.create({
        email: req.body.email,
        hashPassword: req.body.hashPassword
      }),
      models.account.create({
        regEmail: req.body.email,
        ref: req.body.ref || "",
        registerAt: new Date(),
        promo: promo ? promo.code : null,
        lang: req.body.lang
      })
    ])
    
    let seconfResult = await Promise.all([
      models.userAccess.create({
        accountId: firstResults[1].id,
        userId: firstResults[0].guid,
        role: 'owner'
      }),
      models.emailToken.create({
        email: req.body.email,
        accountId: firstResults[1].id,
        userId: firstResults[0].guid,
        type: 'email_confirmation',
        validity: new Date((new Date()).getTime() + 1000*60*24*7)
      }),
      models.notification.create({
        template: template.code,
        lang: template.lang,
        accountId: firstResults[1].id,
        userId: firstResults[0].guid,
        title: template.interfaceTitle,
        content: template.interfaceContent
      })
    ])
    
    const emailHtml = mustache.render(template.emailHtml, {
      confirmUrl: http[process.env.NODE_ENV].backendURL + "/api/v1/emailTokens/" + seconfResult[1].token + "/handle"
    });

    await models.email.create({
      template: template.code,
      lang: template.lang,
      accountId: firstResults[1].id,
      userId: firstResults[0].guid,
      email: req.body.email,
      title: template.emailTitle,
      html: emailHtml,
      errors: ''
    })

    res.json({});
  
  } catch (error) {
    res.status(400).json({
      errors: {
        backend: ["Can't register user"]
      }
    });
  }
});

export default router;