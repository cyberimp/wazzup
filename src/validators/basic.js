import validate from 'validate.js';

validate.validators.array = function(value, options) {
  if (!value) {
    return;
  }

  if (!Array.isArray(value)) {
    return "is not array"
  }

  if (options.type) {
    if (!value.every(element => {
      return typeof element === options.type;
    })) {
      return "is not array of " + options.type;
    }
  }

  if (options.values) {
    if (!value.every(element => {
      return validate.contains(options.values, element);
    })) {
      return "is not contains " + options.values;
    }
  }
};

export const offsetConstraints = {
  numericality: {
    onlyInteger: true,
    greaterThanOrEqualTo: 0
  }
}

export const limitConstraints = {
  numericality: {
    onlyInteger: true,
    greaterThanOrEqualTo: 0
  }
}