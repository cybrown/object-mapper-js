'use strict';


var isPrototype = function (obj) {
    return typeof obj === 'function' && obj.hasOwnProperty('prototype');
};

var orElse = function (value, orElseValue) {
    return value == null ? orElseValue : value;
};

var identity = function (value) {
    return value;
};

var prototypeOf = function (objectOrPrototype) {
    if (isPrototype(objectOrPrototype)) {
        return objectOrPrototype;
    } else {
        return Object.getPrototypeOf(objectOrPrototype);
    }
};

var defaultConverter = function (dest, plainObject) {
    Object.keys(dest).forEach(function (key) {
        dest[key] = plainObject[key];
    });
};

var mapperId = 0;

var ObjectMapper = function () {
    this._mapperId = ++mapperId;
};

ObjectMapper.prototype.extractConverterFromPrototype = function (prototype) {
    var _this = this;
    if (prototype.hasOwnProperty('$fromPlainObject' + _this._mapperId)) {
        if (typeof prototype['$fromPlainObject' + _this._mapperId] === 'function') {
            return prototype['$fromPlainObject' + _this._mapperId];
        } else if (typeof prototype['$fromPlainObject' + _this._mapperId] === 'object') {
            return function (object, plain) {
                return _this.converterWithConfig(object, plain, prototype['$fromPlainObject' + _this._mapperId]);
            };
        } else {
            throw new Error('fromPlainObject must be a function or a configuration plain object');
        }
    }
    return null;
};

ObjectMapper.prototype.converterWithConfig = function (dest, plainObject, conf) {
    var _this = this;
    Object.keys(conf.attributes).forEach(function (key) {
        var attributeConf = conf.attributes[key];
        // check if property exists from source
        var converter = identity;
        var type = null;
        var name = key;
        if (typeof attributeConf === 'boolean') {
            // warning on default behaviour
            if (!attributeConf) {
                return;
            }
        } else if (typeof attributeConf === 'string') {
            name = attributeConf;
        } else if (isPrototype(attributeConf)) {
            type = attributeConf;
        } else if (typeof attributeConf === 'function') {
            converter = attributeConf;
        } else if (typeof attributeConf === 'object') {
            var name = attributeConf.name || key;
            var type = attributeConf.type || null;
            var converter = attributeConf.converter || identity;
            // warning if type AND converter are defined
        } else {
            throw new Error('Unknown type for attribute "' + key + '"" with type "' + typeof attributeConf + '"');
        }
        dest[key] = type ? _this.map(plainObject[name], type) : converter(plainObject[name]);
    });
};

ObjectMapper.prototype.map = function (sourceObject, destinationObjectOrPrototype, converter) {
    var destinationObject = isPrototype(destinationObjectOrPrototype) ? new destinationObjectOrPrototype() : destinationObjectOrPrototype;
    var prototype = prototypeOf(destinationObjectOrPrototype);
    converter = converter || orElse(this.extractConverterFromPrototype(prototype), defaultConverter);
    converter(destinationObject, sourceObject);
    return destinationObject;
};

ObjectMapper.prototype.setMappingConfiguration = function (prototype, configuration) {
    prototype['$fromPlainObject' + this._mapperId] = configuration;
};

module.exports = ObjectMapper;
