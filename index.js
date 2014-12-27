'use strict';

var mapperId = 0;

var _iterateConfigurationAttributes = function (configuration, onAttribute) {
    Object.keys(configuration.attributes).forEach(function (destinationPropertyKey) {
        var attributeConf = configuration.attributes[destinationPropertyKey];
        // check if property exists from source
        if (typeof attributeConf === 'boolean') {
            // warning on default behaviour
            if (attributeConf) {
                onAttribute(destinationPropertyKey, destinationPropertyKey, null, null);
            }
        } else if (typeof attributeConf === 'string') {
            onAttribute(destinationPropertyKey, attributeConf, null, null);
        } else if (typeof attributeConf === 'object') {
            onAttribute(destinationPropertyKey, attributeConf.name || destinationPropertyKey, attributeConf.type, attributeConf.converter);
            // warning if type AND converter are defined
        } else {
            throw new Error('Unknown type for attribute "' + destinationPropertyKey + '"" with type "' + typeof attributeConf + '"');
        }
    });
};

var _createConverterFunctionFromConfigurationWithEval = function (configuration, map) {
    var constructedFunction = '(function (ctx) {\n  return function (dest, plainObject) {\n';
    var constructedFunctionContext = [];
    _iterateConfigurationAttributes(configuration, function (destinationPropertyKey, sourcePropertyKey, type, converter) {
        if (type) {
            constructedFunctionContext.push(type);
            constructedFunction += 'dest.' + destinationPropertyKey + ' = ' + 'map(plainObject.' +
                sourcePropertyKey + ', ctx[' + (constructedFunctionContext.length - 1) + '], dest.' + destinationPropertyKey + ');\n';
        } else if (converter) {
            constructedFunctionContext.push(converter);
            constructedFunction += 'dest.' + destinationPropertyKey + ' = ctx[' +
                (constructedFunctionContext.length - 1) + '](plainObject.' + sourcePropertyKey + ');\n';
        } else {
            constructedFunction += 'dest.' + destinationPropertyKey + ' = ' +
                'plainObject.' + sourcePropertyKey + ';\n';
        }
    });
    constructedFunction += 'return dest;\n';
    constructedFunction += '};\n})';
    return eval(constructedFunction)(constructedFunctionContext);
};

var _createConverterFunctionFromConfiguration = function (configuration, map) {
    var arrayOfConverterFunctions = [];
    _iterateConfigurationAttributes(configuration, function (destinationPropertyKey, sourcePropertyKey, type, converter) {
        if (type) {
            arrayOfConverterFunctions.push(function convertWithPrototype (dest, plainObject) {
                dest[destinationPropertyKey] = map(plainObject[sourcePropertyKey], type, dest[destinationPropertyKey]);
            });
        } else if (converter) {
            arrayOfConverterFunctions.push(function convertWithConverter (dest, plainObject) {
                dest[destinationPropertyKey] = converter(plainObject[sourcePropertyKey]);
            });
        } else {
            arrayOfConverterFunctions.push(function convertWithName (dest, plainObject) {
                dest[destinationPropertyKey] = plainObject[sourcePropertyKey];
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

ObjectMapper.prototype.setMappingConfigurationWithEval = function (prototype, configuration) {
    prototype[this._converterFunctionNameOnPrototype] = _createConverterFunctionFromConfigurationWithEval(configuration, this._boundMap);
};

if (typeof module === 'object') {
    module.exports = ObjectMapper;
} else if (window) {
    window.ObjectMapper = ObjectMapper;
}
