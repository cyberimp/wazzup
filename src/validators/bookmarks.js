import validate from 'validate.js';
//const URL = require('url').Url;


export const sortConstraints = {
  inclusion:{
    within: [
      'createdAt',
      'favorites'
    ],
  message: "only createdAt and favorites supported"
  }
};

const uuidRegex =
  "^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$";

export const uuidConstraints = {
  format: {
    pattern: uuidRegex,
    flags: "i",
    message: "invalid uuid"
  }
};

export const dirConstraints = {
  inclusion:{
    within: [
      'asc',
      'desc',
      'ASC',
      'DESC'
    ],
  message: "only asc and desc supported"
  }
};

export const textBoolConstraints = {
  inclusion:{
    within: [
      'true',
      'false'
    ],
  message: "only true and false supported"
  }
};

export const boolConstraints = {
  inclusion:{
    within: [
      true,
      false
    ],
  message: "only Boolean supported"
  }
};


validate.validators.filterConstraints = function(value, options, key, attributes){
  if (!value && value!="0")
    return null;

  let invalidValue = validate.single(value, sortConstraints);
  if (invalidValue)
    return invalidValue;

  if (value == "favorites" &&
      validate.isEmpty(attributes.filter_value))
    return "filter_value must be set";

  if (value == "createdAt" &&
      validate.isEmpty(attributes.filter_value) &&
      validate.isEmpty(attributes.filter_from) &&
      validate.isEmpty(attributes.filter_to))
      return "filter_value or filter_to or filter_from must be set";

  return null;
};

validate.validators.filterValueConstraints = function(value, options, key, attributes) {
  if (!value && value != "0")
    return null;

  if (!attributes.filter)
    return "filter field not set";

  if (attributes.filter == "favorites")
    if (key != "filter_value")
      return "is unused, use filter_value with favorites filter";
    else
      return validate.single(value,textBoolConstraints);

  if (validate.single(value,
    {numericality:
      {onlyInteger: true}}))
        return "values of filter must be integer";

  if ((key == "filter_from" || key == "filter_to") &&
      validate.isDefined(attributes.filter_value))
        return "filter_value must be unset when doing range filter";

  if (key == "filter_from" && attributes.filter_to < value)
    return "filter range error: filter_from > filter_to"

  return null;

};

const blockedHostname = {
  exclusion:{
    within:[
      "yahoo.com",
      "socket.io"
    ]
  }
};

validate.validators.urlConstraints = function(value, options) {
  if (!value && value != "0")
    if (options == "allowEmpty")
      return null;
    else
      return "INVALID_LINK";
  if (validate.single(value, {url:true}))
    return "INVALID_LINK";
  var parsedURL=new URL(value);
  console.log(parsedURL.hostname);
  if (validate.single(parsedURL.hostname, blockedHostname))
    return "BLOCKED_DOMAIN:"+parsedURL.hostname+":";
};

export const filterConstraints = {filterConstraints: true};
export const filterValueConstraints = {filterValueConstraints: true};
export const urlConstraints = {urlConstraints: "noEmpty"};
export const urlEmptyConstraints = {urlConstraints: "allowEmpty"};
