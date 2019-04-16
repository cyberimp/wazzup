'use strict';

import { Router } from 'express';
import request from 'request-promise-native';
import validate from 'validate.js';
import uuidv4 from 'uuid/v4';
import urlMetadata from 'url-metadata';


import { limitConstraints, offsetConstraints } from '../../validators/basic';
import { filterValueConstraints,
         filterConstraints,
         sortConstraints,
         dirConstraints,
         boolConstraints,
         urlConstraints,
         urlEmptyConstraints,
         uuidConstraints} from '../../validators/bookmarks';

import models from '../../models';
import bodyParser from 'body-parser';

const { Op } = require('sequelize');

//import http from "../../../config/http";

const router = Router();
router.use(bodyParser.json());

/**
 * @api {get} [dev-]backend.wazzup24.com/api/v1/bookmarks
 * @apiDescription Возвращает закладки
 * @apiVersion 1.0.0
 * @apiName get-bookmarks
 * @apiGroup Bookmarks
 * @apiPermission all
 *
 * @apiParam {Number} [limit=50] Ограничение на количество запрашиваемых записей
 * @apiParam {Number} [offset=0] Сдвиг при пагинации (по-умолчанию 0)
 * @apiParam {String} [filter] Имя поля для фильтрации ("createdAt", "favorites")
 * @apiParam {(Number|String)} [filter_value] Точное значение фильтрации, тип завист от поля фильтрации
 * @apiParam {Number} [filter_from] Используется для фильтрации >=
 * @apiParam {Number} [filter_to] Используется для фильтрации <=
 * @apiParam {String} [sort_by="createdAt"] Имя поля для сортировки ("createdAt", "favorites")
 * @apiParam {String} [sort_dir="asc"] Направление сортировки ("asc", "desc")
 *
 *
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *   {
 *     length: 987, // Всего записей с указанным фильтром в БД
 *     data: [
 *     {
 *       guid: '97f10d85-5d2f-4450-a0c4-307e8e9a991f',
 *       link: 'https://ya.ru',
 *       createdAt: 1547459442106,
 *       description: 'Тот самый Яндекс',
 *       favorites: false
 *     },
 *     ...
 *   ]
 * }
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *     [
 *       { "code": "BOOKMARKS_INPUT_INVALID",
 *         "description": "field: invalid input data description"},
 *       { "code": "DATABASE_ERROR",
 *         "description": "misconfigured database"},
 *       { "code": "BACKEND_ERROR",
 *         "description": "misconfigured validator"}
 *     ]
 *   }
 */
router.get('/', (req, res) => {
  try {
//    console.log(req.query);
    const validationResult = validate(req.query, {
      limit: limitConstraints,
      offset: offsetConstraints,
      filter: filterConstraints,
      filter_value: filterValueConstraints,
      filter_from: filterValueConstraints,
      filter_to: filterValueConstraints,
      sort_by: sortConstraints,
      sort_dir: dirConstraints
    });

    if (validationResult) {
      var errors = parseValidation(validationResult);
      res.status(400).json({errors: errors})
    } else {
      let offset = req.query.offset || 0;
      let limit = req.query.limit || 50;
      let filter = req.query.filter;
      let filter_value = req.query.filter_value;
      let filter_from = req.query.filter_from;
      let filter_to = req.query.filter_to;
      let sort_by = req.query.sort_by || "createdAt";
      let sort_dir = req.query.sort_dir || "asc";

      if (filter == "favorites")
        filter_value = (filter_value == "true");
      if (filter == "createdAt"){
        if (validate.isDefined(filter_value))
          filter_value = parseInt(filter_value);
        if (validate.isDefined(filter_from))
          filter_from = parseInt(filter_from);
        if (validate.isDefined(filter_to))
          filter_to = parseInt(filter_to);
      }


      var query = {
        attributes: ["guid", "link", "createdAt", "description", "favorites"],
        where:{},
        order: [[sort_by, sort_dir]],
        offset: offset,
        limit: limit};

      if (filter){
        query.where[filter] = {};
        if (validate.isDefined(filter_value))
          query.where[filter][Op.eq] = filter_value;
        if (validate.isDefined(filter_from))
            query.where[filter][Op.gte] = filter_from;
        if (validate.isDefined(filter_to))
            query.where[filter][Op.lte] = filter_to;
      }
//      console.log(query);
      models.bookmarks.findAndCountAll(query)
        .then(result => {
          res.status(200).json({length: result.count, data: result.rows})})
        .catch(error => epicFail(res,error,"DATABASE"));
  }} catch (error){
    epicFail(res, error, "BACKEND");
}});

/**
 * @api {post} [dev-]backend.wazzup24.com/api/v1/bookmarks/
 * @apiDescription добавление закладки
 * @apiVersion 1.0.0
 * @apiName post-bookmarks
 * @apiGroup Bookmarks
 * @apiPermission all
 *
 * @apiParam {String} link Ссылка на веб-страницу
 * @apiParam {String} [description] Описание ссылки
 * @apiParam {Boolean} [favorites=false] Отметить как избранное
 *
 *
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 201 Created
 *  {
 *     data: {
 *     guid: '97f10d85-5d2f-4450-a0c4-307e8e9a991f',
 *     createdAt: 1547459442106
 *    }
 *  }
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *     [
 *       { "code": "BOOKMARKS_INVALID_LINK",
 *         "description": "Invalid link"  },
 *       { "code": 'BOOKMARKS_BLOCKED_DOMAIN',
 *         "description": "\"yahoo.com\" banned"},
 *       { "code": "BOOKMARKS_INPUT_INVALID",
 *         "description": "field: invalid input data description"},
 *       { "code": "DATABASE_ERROR",
 *         "description": "misconfigured database"},
 *       { "code": "BACKEND_ERROR",
 *         "description": "misconfigured validator"}
 *     ]
 *   }
 */
router.post('/', (req, res) => {
  try{
    const validationResult = validate(req.body, {
      link: urlConstraints,
      favorites: boolConstraints
    });
    if (validationResult) {
      var errors = parseValidation(validationResult);
      res.status(400).json({errors: errors})
    }
    else {

      let guid = uuidv4();
      let description = req.body.description;
      let link = req.body.link;
      let favorites = req.body.favorites;
      let timeNow = Date.now();
      models.bookmarks.create({guid: guid,
                               description: description,
                               link: link,
                               favorites: favorites,
                               createdAt: timeNow,
                               updatedAt: timeNow})
          .then(() =>{res.status(201).json({data: {guid: guid, createdAt: timeNow}})})
          .catch((error) => epicFail(res, error, "DATABASE"));

    }
  } catch (error){
    epicFail(res, error, "BACKEND")
}});

/**
 * @api {delete} [dev-]backend.wazzup24.com/api/v1/bookmarks/:guid
 * @apiDescription удаление закладки
 * @apiVersion 1.0.0
 * @apiName delete-bookmarks
 * @apiGroup Bookmarks
 * @apiPermission all
 *
 * @apiParam {String} guid - ID закладки
 *
 *
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 404 Not found
 *
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *     [
 *       { "code": "BOOKMARKS_INPUT_INVALID",
 *         "description": "invalid guid value"},
 *       { "code": "DATABASE_ERROR",
 *         "description": "misconfigured database"},
 *       { "code": "BACKEND_ERROR",
 *         "description": "misconfigured validator"}
 *     ]
 *   }
 *
 */
 router.delete('/:guid', (req, res) => {
  try{
//    console.log(req.params);
    const validationResult = validate(req.params, {guid: uuidConstraints});
    if (validationResult){
        reportError(res,"invalid guid value","BOOKMARKS_INPUT_INVALID");
    }
    else
    {
      let guid = req.params.guid;
      models.bookmarks.findByPk(guid).then(record =>{
        if (!record)
          res.sendStatus(404);
        else
          record.destroy().then(() => res.sendStatus(200))
            .catch((error) => epicFail(res,error,"DATABASE"));
        })
    }

  } catch (error){
    epicFail(res, error, "BACKEND");
  }
});

/**
 * @api {patch} [dev-]backend.wazzup24.com/api/v1/bookmarks/
 * @apiDescription изменение закладки
 * @apiVersion 1.0.0
 * @apiName post-bookmarks
 * @apiGroup Bookmarks
 * @apiPermission all
 *
 * @apiParam {String} guid - ID закладки
 * @apiParam {String} [link] Ссылка на веб-страницу
 * @apiParam {String} [description] Описание ссылки
 * @apiParam {Boolean} [favorites=false] Отметить как избранное
 *
 *
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 404 Not found
 *
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *     [
 *       { "code": "BOOKMARKS_INVALID_LINK",
 *         "description": "Invalid link"  },
 *       { "code": 'BOOKMARKS_BLOCKED_DOMAIN',
 *         "description": "\"yahoo.com\" banned"},
 *       { "code": "BOOKMARKS_INPUT_INVALID",
 *         "description": "field: invalid input data description"},
 *       { "code": "DATABASE_ERROR",
 *         "description": "misconfigured database"},
 *       { "code": "BACKEND_ERROR",
 *         "description": "misconfigured validator"}
 *     ]
 *   }
 */
router.patch('/:guid', (req, res) => {
  try{
    const validationResultParams = validate(req.params,
                                                {uuid: uuidConstraints});
    const validationResultBody = validate(req.body, {
      link: urlEmptyConstraints,
      favorites: boolConstraints
    });
    if (validationResultParams || validationResultBody) {
      var errors = parseValidation(validationResultBody)
          .concat(parseValidation(validationResultParams))
      res.status(400).json({errors: errors})
    }
    else {

      let guid = req.params.guid;
      let description = req.body.description;
      let link = req.body.link;
      let favorites = req.body.favorites;
      let timeNow = Date.now();
      var updateQuery = {updatedAt: timeNow};
      if (validate.isDefined(description))
        updateQuery.description = description;
      if (validate.isDefined(link))
        updateQuery.link = link;
      if (validate.isDefined(favorites))
        updateQuery.favorites = favorites;

      models.bookmarks.findByPk(guid).then(record =>{
        if (!record)
          res.sendStatus(404);
        else
          record.update(updateQuery)
            .then(()=>res.sendStatus(200))
            .catch((error) => epicFail(res, error, "DATABASE"));
      }).catch((error) => epicFail(res, error, "DATABASE"));

    }
  } catch (error){
    epicFail(res, error, "BACKEND");
}});


/**
 * @api {get} [dev-]backend.wazzup24.com/api/v1/bookmarks/:guid
 * @apiDescription дополнительные данные по закладке
 * @apiVersion 1.0.0
 * @apiName get-bookmarks-guid
 * @apiGroup Bookmarks
 * @apiPermission all
 *
 * @apiParam {String} guid - ID закладки
 *
 *
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 * {
 *    "whois": {
 *      "whois": "\nWhois Server: whois.verisign-grs.com\nDomain Name: GOOGLE.COM\r\n\n   Registry Domain ID: 2138514_DOMAIN_COM-VRSN\r\n\n   Registrar WHOIS Server: whois.markmonitor.com\r\n\n   Registrar URL: http://www.markmonitor.com\r\n\n   Updated Date: 2018-02-21T18:36:40Z\r\n\n   Creation Date: 1997-09-15T04:00:00Z\r\n\n   Registry Expiry Date: 2020-09-14T04:00:00Z\r\n\n   Registrar: MarkMonitor Inc.\r\n\n   Registrar IANA ID: 292\r\n\n   Registrar Abuse Contact Email: abusecomplaints@markmonitor.com\r\n\n   Registrar Abuse Contact Phone: +1.2083895740\r\n\n   Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited\r\n\n   Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited\r\n\n   Domain Status: clientUpdateProhibited https://icann.org/epp#clientUpdateProhibited\r\n\n   Domain Status: serverDeleteProhibited https://icann.org/epp#serverDeleteProhibited\r\n\n   Domain Status: serverTransferProhibited https://icann.org/epp#serverTransferProhibited\r\n\n   Domain Status: serverUpdateProhibited https://icann.org/epp#serverUpdateProhibited\r\n\n   Name Server: NS1.GOOGLE.COM\r\n\n   Name Server: NS2.GOOGLE.COM\r\n\n   Name Server: NS3.GOOGLE.COM\r\n\n   Name Server: NS4.GOOGLE.COM\r\n\n   DNSSEC: unsigned\r\n\n   URL of the ICANN Whois Inaccuracy Complaint Form: https://www.icann.org/wicf/\r\n\n>>> Last update of whois database: 2018-08-23T09:09:36Z <<<\r\n\n\r\n\nFor more information on Whois status codes, please visit https://icann.org/epp\r\n\n\r\n\nNOTICE: The expiration date displayed in this record is the date the\r\n\nregistrar's sponsorship of the domain name registration in the registry is\r\n\ncurrently set to expire. This date does not necessarily reflect the expiration\r\n\ndate of the domain name registrant's agreement with the sponsoring\r\n\nregistrar.  Users may consult the sponsoring registrar's Whois database to\r\n\nview the registrar's reported date of expiration for this registration.\r\n\n\r\n\nTERMS OF USE: You are not authorized to access or query our Whois\r\n\ndatabase through the use of electronic processes that are high-volume and\r\n\nautomated except as reasonably necessary to register domain names or\r\n\nmodify existing registrations; the Data in VeriSign Global Registry\r\n\nServices' (\"VeriSign\") Whois database is provided by VeriSign for\r\n\ninformation purposes only, and to assist persons in obtaining information\r\n\nabout or related to a domain name registration record. VeriSign does not\r\n\nguarantee its accuracy. By submitting a Whois query, you agree to abide\r\n\nby the following terms of use: You agree that you may use this Data only\r\n\nfor lawful purposes and that under no circumstances will you use this Data\r\n\nto: (1) allow, enable, or otherwise support the transmission of mass\r\n\nunsolicited, commercial advertising or solicitations via e-mail, telephone,\r\n\nor facsimile; or (2) enable high volume, automated, electronic processes\r\n\nthat apply to VeriSign (or its computer systems). The compilation,\r\n\nrepackaging, dissemination or other use of this Data is expressly\r\n\nprohibited without the prior written consent of VeriSign. You agree not to\r\n\nuse electronic processes that are automated and high-volume to access or\r\n\nquery the Whois database except as reasonably necessary to register\r\n\ndomain names or modify existing registrations. VeriSign reserves the right\r\n\nto restrict your access to the Whois database in its sole discretion to ensure\r\n\noperational stability.  VeriSign may restrict or terminate your access to the\r\n\nWhois database for failure to abide by these terms of use. VeriSign\r\n\nreserves the right to modify these terms at any time.\r\n\n\r\n\nThe Registry database contains ONLY .COM, .NET, .EDU domains and\r\n\nRegistrars.",
 *        "schema": "http://",
 *        "url": "/",
 *        "base": "google.com",
 *        "domain": "google.com",
 *        "zone": "com",
 *        "creation": "15.09.1997",
 *        "paid": "14.09.2020",
 *        "free": "15.10.2020",
 *        "age": 21,
 *        "limit": 14
 *    },
 *    "og-preview": {
 *        "title": "Google",
 *        "image": "/images/branding/googleg/1x/googleg_standard_color_128dp.png",
 *        "description": "Поиск информации в интернете: веб страницы, картинки, видео и многое другое."
 *    }
 *}
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 404 Not found
 *   {
 *     "errors":
 *     [
 *       { "code": "ERROR_NOTFOUND",
 *         "description": "bookmark not found"}]}
 *
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *     [
 *       { "code": "BOOKMARKS_INPUT_INVALID",
 *         "description": "invalid guid value"},
 *       { "code": "METADATA_ERROR",
 *         "description": "getaddrinfo ENOTFOUND fghj.dev fghj.dev:80"}
 *       { "code": "DATABASE_ERROR",
 *         "description": "misconfigured database"},
 *       { "code": "BACKEND_ERROR",
 *         "description": "misconfigured validator"}
 *     ]
 *   }
 *
 */
router.get('/:guid', (req, res) => {
  try{
    const validationResult = validate(req.params,
                                      {uuid: uuidConstraints});
    if (validationResult){
      reportError(res,"invalid guid value","BOOKMARKS_INPUT_INVALID")
    }
    else
    {
      let guid = req.params.guid;
      let link = "";
      let whoisInfo ={};
      let og = {};
      models.bookmarks.findByPk(guid).then(record =>{
        if (!record)
          return new Promise((resolve, reject) => reject(new Error("bookmark not found")))

        else{
          link = record.link;
          return request("http://htmlweb.ru/analiz/api.php?"+
          "whois&url=" + (new URL(link)).hostname+"&json")}})
          .then( result => {
            whoisInfo = JSON.parse(result);
            return urlMetadata(link)})
          .then(metadata => {
//            console.log(metadata);
            og.title = metadata.title||metadata['og:title']||'no title';
            og.image = metadata.image||metadata['og:image']
              ||'https://upload.wikimedia.org/wikipedia/en/a/aa/No_sign.png';
            og.description = metadata.description||metadata['og:description']
              ||'no description';
            res.status(200).json({whois: whoisInfo, 'og-preview': og});

          }).catch((error) => {if (error.message == "bookmark not found")
                                reportError(res, error.message, "ERROR_NOTFOUND", 404)
                              else
                                reportError(res, error.message, "ERROR_METADATA")})
    }}
    catch (error){
    epicFail(res, error, "BACKEND");
}});


//Парсинг результатов валидатора в соответствии с ТЗ
function parseValidation(validationResult){
  var result = [];
  for (var variable in validationResult) {
      var errorDescription =  validationResult[variable].join();
      var currentError = {};
      if (~errorDescription.indexOf("INVALID_LINK")){
        currentError.code = "BOOKMARKS_INVALID_LINK";
        currentError.description = "invalid link"
      }
      else if (~errorDescription.indexOf("BLOCKED_DOMAIN")){
        var domain = errorDescription.split(":")[1];
        currentError.code = "BOOKMARKS_BLOCKED_DOMAIN";
        currentError.description = '"'+domain+'" banned';
      }
      else{
        currentError.code = "BOOKMARKS_INPUT_INVALID";
        currentError.description = variable + ": " + errorDescription;
      }

      result.push(currentError);
  }
  return result;
}

function reportError(res, message, code, status=400){
    res.status(status).json({errors:[{code: code, description: message}]})
}


//Ошибки конфигурации базы и кода валидаторов, если они есть, что-то пошло не так...
function epicFail (res, error, source){
  res.status(400).json({errors:
                        [{code: source + "_ERROR",
                          description: error.message}]});
  console.error("FIXME: " + source + ": " + error.message);
}

export default router;
