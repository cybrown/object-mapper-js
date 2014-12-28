import meta = require('./meta');

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
var $i = new meta.Identifier('i');
var $max = new meta.Identifier('max');
var $length = new meta.Identifier('length');

var _createTransformWithConverter = function (destination, source, constructedFunctionContext, converter) {
    constructedFunctionContext.push(converter);
    var node = $ctx.member(new meta.LiteralNumber(constructedFunctionContext.length - 1)).call(source);
    return destination.assign(node).toStatement();
};

var _createTransformWithNewKey = function (destination, source) {
    return destination.assign(source).toStatement();
};

var _createTransformWithType = function (destination, source, constructedFunctionContext, type, getConverterFunctionForPrototype) {
    constructedFunctionContext.push(type);
    var nodes = [destination.binary('||', destination.assign(new meta.NewExpression(
        $ctx.member(new meta.LiteralNumber(constructedFunctionContext.length - 1))
    )).parenthesis()).toStatement()];
    nodes = nodes.concat(_createConverterSourceCode(
        getConverterFunctionForPrototype(type).config,
        constructedFunctionContext,
        getConverterFunctionForPrototype,
        source,
        destination
    ));
    return nodes;
};

var _createTransformWithArrayType = function (destination, source, constructedFunctionContext, type, getConverterFunctionForPrototype) {
    constructedFunctionContext.push(type);
    var $tmp = new meta.Identifier('tmp');
    var nodes = [
        new meta.VariableDeclaration([{
            name: $tmp,
            init: new meta.NewExpression(
                $ctx.member(new meta.LiteralNumber(constructedFunctionContext.length - 1))
            )
        }]),
        destination.member(new meta.Identifier('push')).call($tmp).toStatement()
    ].concat(_createConverterSourceCode(
        getConverterFunctionForPrototype(type).config,
        constructedFunctionContext,
        getConverterFunctionForPrototype,
        source.index($i),
        $tmp
    ));
    var result = new meta.ForStatement(
        new meta.VariableDeclaration([{name: $i, init: new meta.LiteralNumber(0)}, {name: $max, init: source.member($length)}]),
        $i.binary('<', $max),
        new meta.UnaryExpression('++', true, $i),
        new meta.BlockStatement(nodes)
    );
    return result;
};

var _createConverterSourceCode = function (configuration, constructedFunctionContext, getConverterFunctionForPrototype, source?, dest?) {
    source = source || $plainObject;
    dest = dest || $dest;
    var statements = [];
    _iterateConfigurationAttributes(configuration, function (destinationPropertyKey, sourcePropertyKey, type, converter) {
        var $destinationPropertyKey = new meta.Identifier(destinationPropertyKey);
        var $sourcePropertyKey = new meta.Identifier(sourcePropertyKey);
        var nodes: any[];
        if (type) {
            if (Array.isArray(type)) {
                nodes = [_createTransformWithArrayType(dest.member($destinationPropertyKey), source.member($sourcePropertyKey), constructedFunctionContext, type[0], getConverterFunctionForPrototype)];
            } else {
                nodes = _createTransformWithType(dest.member($destinationPropertyKey), source.member($sourcePropertyKey), constructedFunctionContext, type, getConverterFunctionForPrototype);
            }
        } else if (converter) {
            nodes = [_createTransformWithConverter(dest.member($destinationPropertyKey), source.member($sourcePropertyKey), constructedFunctionContext, converter)];
        } else {
            nodes = [_createTransformWithNewKey(dest.member($destinationPropertyKey), source.member($sourcePropertyKey))];
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

export = ObjectMapper;
