let BigNumber = require('bignumber.js').default;

let unitMap = {
    'none':       '0',
    'None':       '0',
    'wei':        '1',
    'Wei':        '1',
    'kwei':       '1000',
    'Kwei':       '1000',
    'mwei':       '1000000',
    'Mwei':       '1000000',
    'gwei':       '1000000000',
    'Gwei':       '1000000000',
    'czr':        '1000000000000000000',
    'CZR':        '1000000000000000000',
};

let isString = function (obj) {
    return typeof obj === 'string' && obj.constructor === String;
};

let isBigNumber = function (object) {
    return (object && object.constructor && object.constructor.name === 'BigNumber');
};

let toBigNumber = function(number) {
    number = number || 0;
    if (isBigNumber(number)){
        return number;
    }
    if (isString(number) && (number.indexOf('0x') === 0 || number.indexOf('-0x') === 0)) {
        return new BigNumber(number.replace('0x',''), 16);
    }
    return new BigNumber(number.toString(10), 10);
};

let getValueOfUnit = function (unit) {
    unit = unit ? unit.toLowerCase() : 'czr';
    let unitValue = unitMap[unit];
    if (unitValue === undefined) {
        throw new Error('This unit doesn\'t exists, please use the one of the following units' + JSON.stringify(unitMap, null, 2));
    }
    return new BigNumber(unitValue, 10);
};

let fromWei = function(number, unit) {
    let returnValue = toBigNumber(number).dividedBy(getValueOfUnit(unit));
    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

let toWei = function(number, unit) {
    let returnValue = toBigNumber(number).times(getValueOfUnit(unit));
    return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

module.exports = {
    toBigNumber: toBigNumber,
    isBigNumber: isBigNumber,
    toWei: toWei,
    fromWei: fromWei
};