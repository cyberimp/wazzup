import { Router } from 'express';
import request from 'request';
import jwt from "jsonwebtoken";
import validate from 'validate.js';
import uuidv4 from 'uuid/v4'

import { limitConstraints, offsetConstraints } from '../../validators/basic';
import { fieldsConstraints } from '../../validators/channel';
import models from '../../models';
import http from "../../../config/http";

const router = Router();

/**
 * @api {get} [dev-]backend.wazzup24.com/api/v1/channels List of channels
 * @apiDescription Получение списка каналов пользователя
 * @apiVersion 1.0.0
 * @apiName channels_list
 * @apiGroup Channels
 * @apiPermission all
 *
 * @apiHeader {String} authorization Значение accessToken, полученное в процессе аутентификации
 *
 * @apiParam {Number} offset Смещение начала выборки (с какого по счету, по умолчанию 0)
 * @apiParam {Number} limit Ограничение выборки (как много элементов добавить в выборку, по умолчанию 10)
 * @apiParam {Array} fields Массив имен полей объектов, которые добавляются в результирующий ответ. Если не указывать - все поля.
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *   { 
 *     "data": [
 *       {
 *         "guid": "e40b62b5-6fea-4993-b894-ed7484458edc",
 *         "accountId": 12,
 *         "createdAt": "2018-05-14T19:20:54.841Z",
 *         "name": "break",
 *         "transport": "telegram",
 *         "state": "active",
 *         "temporary": true
 *       }, ...
 *       {
 *         "guid": "d40b62b5-6fea-4993-b894-ed7484458edc",
 *         "accountId": 22,
 *         "createdAt": "2018-05-14T19:20:54.841Z",
 *         "name": "test",
 *         "transport": "whatsapp",
 *         "state": "active",
 *         "temporary": true
 *       }
 *     ]
 *   }
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *       "limit": [
 *         "Limit is not a number",
 *         "Limit must be greater than or equal to 0"
 *       ],
 *       "offset": [
 *         "Offset is not a number",
 *         "Offset must be greater than or equal to 0"
 *       ],
 *       "fields": [
 *         "Fields is not array",
 *         "Fields is not array of string",
 *         "Fields is not contains guid,accountId,createdAt,name,phone,transport,state,notEnoughMoney,tarif,temporary"
 *       ]
 *     }
 *   }
 */
router.get("/", async (req, res) => {
  try {
    const validationResult = validate(req.body, {
      limit: limitConstraints,
      offset: offsetConstraints,
      fields: fieldsConstraints
    });

    if (validationResult) {
      res.status(400).json({ errors: validationResult })
    } else {
      let offset = req.body.offset || 0;
      let limit = req.body.limit || 10;

      let data = jwt.decode(req.get('authorization'));
      if (!data) {
        res.status(401).json({ errors: { backend: ["Token not found"] } })
        return;
      }

      let results = await Promise.all([
        await models.channel.findAll({
          where: {
            accountId: data.accountId
          },
          offset,
          limit
        }),
        new Promise((resolve, reject) => {
          request.post({
            url: http[process.env.NODE_ENV].authInnerURL + '/api/v1/check-access',
            body: {
              accessToken: req.get('authorization')
            },
            json: true,
            timeout: http[process.env.NODE_ENV].requestTimeout
          }, (err, res) => {
            err ? reject(err) : resolve(res);
          });
        })
      ]);

      let fields = req.body.fields || [
        'guid',
        'accountId',
        'createdAt',
        'name',
        'phone',
        'transport',
        'state',
        'notEnoughMoney',
        'tarif',
        'temporary'
      ];

      res.json({
        data: results[0].map(channel => {
          return fields.reduce((object, current) => {
            if (channel[current]) {
              object[current] = channel[current];
            }

            return object;
          }, {});
        })
      });
    }
  } catch (error) {
    res.status(400).json({ errors: { backend: ["Can't get list of channels", error] } })
  }
});

router.post("/", async (req, res) => {
  try {
    let data = jwt.decode(req.get('authorization'));
    if (!data) {
      res.status(401).json({
        errors: {
          backend: ["Token not found"]
        }
      });
      return;
    }

    let channel = await models.channel.create({
      guid: uuidv4(),
      accountId: data.accountId,
      state: 'init',
      createdAt: new Date(),
      transport: req.body.transport,
      tariff: 'pro',
      temporary: true
    });

    res.status(201).json({ data: { guid: channel.guid } })
  } catch (error) {
    res.status(400).json({ errors: { backend: ["Can't add new channel", error] } })
  }
});

export default router;