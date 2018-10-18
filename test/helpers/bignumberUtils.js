const parseNumber = val => val.toNumber();
const parseString = val => val.toString(10);
const parseJSON = val => JSON.stringify(val);

module.exports = {
  parseNumber,
  parseString,
  parseJSON
};
