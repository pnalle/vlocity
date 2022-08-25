const constants = require('../../constants');

function checkRequiredFields(body, requiredFields, objectFields = null) {
  const missingRequiredFieldList = [];
  requiredFields.forEach((field) => {
    if (body[field] === undefined || body[field] === null) {
      missingRequiredFieldList.push(field);
    }
  });
  if (objectFields) {
    objectFields.forEach((objectField) => {
      requiredFields.forEach((field) => {
        if (body[objectField] && body[objectField][field]) {
          if (missingRequiredFieldList.includes(field)) {
            missingRequiredFieldList.splice(missingRequiredFieldList.indexOf(field), 1);
          }
        }
      });
    });
  }
  return missingRequiredFieldList;
}

// Returns type of value
function type(value) {
  const regex = /^\[object (\S+?)\]$/;
  const matches = Object.prototype.toString.call(value).match(regex) || [];

  return (matches[1] || 'undefined').toLowerCase();
}

// Use to encrypt sensitive data in logs
function removeSensitiveData(body) {
  if (body && (type(body) === 'object' || type(body) === 'array')) {
    const updatedBody = JSON.parse(JSON.stringify(body));

    if (Object.getOwnPropertyNames(updatedBody).length) {
      Object.keys(updatedBody).map((elem) => {
        if (updatedBody[elem] && type(updatedBody[elem]) !== 'object' && type(updatedBody[elem]) !== 'array') {
          constants.FIELDS_TO_ENCRYPT.some((field) => {
            if (elem === field) {
              updatedBody[elem] = '***';
              return true;
            }
            return false;
          });
        } else if (updatedBody[elem]) {
          updatedBody[elem] = removeSensitiveData(updatedBody[elem]);
        }

        return updatedBody[elem];
      });
    }

    return updatedBody;
  }

  return body;
}

module.exports = {
  checkRequiredFields,
  removeSensitiveData,
};
