'use strict';

var meta = require('./meta');

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

var $dest = new meta.Identifier('dest');
var $ctx = new meta.Identifier('ctx');
var $map = new meta.Identifier('map');
var $plainObject = new meta.Identifier('plainObject');

var _createTransformWithConverter = function (destination, source, constructedFunctionContext, converter) {
    constructedFunctionContext.push(converter);
    var node = $ctx.member(new meta.LiteralNumber(constructedFunctionContext.length - 1)).call(source);
    return new meta.ExpressionStatement(destination.assign(node));
};

var _createTransformWithNewKey = function (destination, source) {
    return new meta.ExpressionStatement(destination.assign(source));
};

var _createTransformWithType = function (destination, source, constructedFunctionContext, type, getConverterFunctionForPrototype) {
    constructedFunctionContext.push(type);
    var nodes = [
        new meta.ExpressionStatement(
            destination.binary('||', destination.assign(new meta.NewExpression(
                $ctx.member(new meta.LiteralNumber(constructedFunctionContext.length - 1))
            )).parenthesis())
        )
    ];
    nodes = nodes.concat(_createConverterSourceCode(
        getConverterFunctionForPrototype(type).config,
        constructedFunctionContext,
        getConverterFunctionForPrototype,
        source,
        destination
    ));
    return nodes;
};

var _createConverterSourceCode = function (configuration, constructedFunctionContext, getConverterFunctionForPrototype, source, dest) {
    source = source || $plainObject;
    dest = dest || $dest;
    var statements = [];
    _iterateConfigurationAttributes(configuration, function (destinationPropertyKey, sourcePropertyKey, type, converter) {
        var $destinationPropertyKey = new meta.Identifier(destinationPropertyKey);
        var $sourcePropertyKey = new meta.Identifier(sourcePropertyKey);
        if (type) {
            var nodes = _createTransformWithType(dest.member($destinationPropertyKey), source.member($sourcePropertyKey), constructedFunctionContext, type, getConverterFunctionForPrototype);
        } else if (converter) {
            var nodes = [_createTransformWithConverter(dest.member($destinationPropertyKey), source.member($sourcePropertyKey), constructedFunctionContext, converter)];
        } else {
            var nodes = [_createTransformWithNewKey(dest.member($destinationPropertyKey), source.member($sourcePropertyKey))];
        }
        nodes.forEach(function (node) {statements.push(node)});
    });
    return statements;
};

var _createConverterFunctionFromConfigurationWithEval = function (configuration, map, getConverterFunctionForPrototype) {
    var constructedFunctionContext = [];
    var statements = _createConverterSourceCode(configuration, constructedFunctionContext, getConverterFunctionForPrototype);
    statements.push(new meta.ReturnStatement($dest));
    var func = new meta.Function(null, [$dest, $plainObject], new meta.BlockStatement(statements));
    var converter =  eval('(function (ctx) {\nreturn ' + func.output() + '})')(constructedFunctionContext);
    converter.config = configuration;
    return converter;
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
    this._boundGetConverterFunctionForPrototype = this._getConverterFunctionForPrototype.bind(this);
};

ObjectMapper.prototype._getConverterFunctionForPrototype = function (prototype) {
    return prototype[this._converterFunctionNameOnPrototype];
};

ObjectMapper.prototype.map = function (sourceObject, prototype, instance) {
    return this._getConverterFunctionForPrototype(prototype)(instance || new prototype(), sourceObject);
};

ObjectMapper.prototype.setMappingConfiguration = function (prototype, configuration) {
    prototype[this._converterFunctionNameOnPrototype] = _createConverterFunctionFromConfigurationWithEval(configuration, this._boundMap, this._boundGetConverterFunctionForPrototype);
};

if (typeof window === 'object') {
    window.ObjectMapper = ObjectMapper;
} else {
    module.exports = ObjectMapper;
}
