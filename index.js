'use strict';

var mapperId = 0;

var _createConverterFunctionFromConfiguration = function (configuration, map) {
    var arrayOfConverterFunctions = [];
    Object.keys(configuration.attributes).forEach(function (key) {
        var attributeConf = configuration.attributes[key];
        // check if property exists from source
        var converter = null;
        var type = null;
        var name = key;
        if (typeof attributeConf === 'boolean') {
            // warning on default behaviour
            if (!attributeConf) {
                return;
            }
        } else if (typeof attributeConf === 'string') {
            name = attributeConf;
        } else if (typeof attributeConf === 'function') {
            if (attributeConf.hasOwnProperty('prototype')) {
                type = attributeConf;
            } else {
                converter = attributeConf;
            }
        } else if (typeof attributeConf === 'object') {
            var name = attributeConf.name || key;
            var type = attributeConf.type || null;
            var converter = attributeConf.converter || null;
            // warning if type AND converter are defined
        } else {
            throw new Error('Unknown type for attribute "' + key + '"" with type "' + typeof attributeConf + '"');
        }

        if (type) {
            arrayOfConverterFunctions.push(function convertWithPrototype (dest, plainObject) {
                dest[key] = map(plainObject[name], type, dest[key]);
            });
        } else if (converter) {
            arrayOfConverterFunctions.push(function convertWithConverter (dest, plainObject) {
                dest[key] = converter(plainObject[name]);
            });
        } else {
            arrayOfConverterFunctions.push(function convertWithName (dest, plainObject) {
                dest[key] = plainObject[name];
            });
        }
    });
    return function callListOfConvertors (dest, plainObject) {
        for (var i = 0, length = arrayOfConverterFunctions.length; i < length; ++i) {
            arrayOfConverterFunctions[i](dest, plainObject);
        }
        return dest;
    };
};

var bind = function (func, ctx) {
    return function () {
        return func.apply(ctx, arguments);
    };
};

var ObjectMapper = function () {
    this._mapperId = ++mapperId;
    this._converterFunctionNameOnPrototype = '$fromPlainObjectFunc' + this._mapperId;
    this._boundMap = bind(this.map, this);
};

ObjectMapper.prototype._getConverterFunctionForPrototype = function (prototype) {
    return prototype[this._converterFunctionNameOnPrototype];
};

ObjectMapper.prototype.map = function (sourceObject, prototype, instance) {
    return this._getConverterFunctionForPrototype(prototype)(instance || new prototype(), sourceObject);
};

ObjectMapper.prototype.setMappingConfiguration = function (prototype, configuration) {
    prototype[this._converterFunctionNameOnPrototype] = _createConverterFunctionFromConfiguration(configuration, this._boundMap);
};

if (typeof module === 'object') {
    module.exports = ObjectMapper;
} else if (window) {
    window.ObjectMapper = ObjectMapper;
}
