require('blanket')({pattern: function (filename) {
    return !/node_modules/.test(filename);
}});
var assert = require('assert');
var ObjectMapper = require('../index');

describe ('ObjectMapper', function () {

    var mapper;

    before(function () {
        mapper = new ObjectMapper();
    });

    describe ('Simple objects', function () {

        it ('should map boolean property', function () {
            var Person = function () {
                this.name = '';
            };
            mapper.setMappingConfiguration(Person, {
                attributes: {
                    name: true
                }
            });
            var john = mapper.map({name: 'john'}, Person);
            assert.equal('john', john.name);
        });

        it ('should map property with new name', function () {
            var Person = function () {
                this.name = '';
            };
            mapper.setMappingConfiguration(Person, {
                attributes: {
                    name: 'Name'
                }
            });
            var john = mapper.map({Name: 'john'}, Person);
            assert.equal('john', john.name);
        });

        it ('should map property with converter', function () {
            var Person = function () {
                this.name = '';
            };
            mapper.setMappingConfiguration(Person, {
                attributes: {
                    name: {
                        name: 'name',
                        converter: function (str) {
                            return str.toUpperCase();
                        }
                    }
                }
            });
            var john = mapper.map({name: 'john'}, Person);
            assert.equal('JOHN', john.name);
        });

        it ('should map property with converter and new name on existing instance', function () {
            var Person = function () {
                this.name = '';
            };
            mapper.setMappingConfiguration(Person, {
                attributes: {
                    name: {
                        name: 'Name',
                        converter: function (str) {
                            return str.toUpperCase();
                        }
                    }
                }
            });
            var john = new Person();
            john.foo = 'bar';
            mapper.map({Name: 'john'}, Person, john);
            assert.equal('JOHN', john.name);
            assert.equal('bar', john.foo);
        });
    });

    describe ('Objects with objects as properties', function () {

        it ('should map properties in inner object', function () {
            var Person = function () {
                this.name = '';
                this.address = null;
            };
            var Address = function () {
                this.street = '';
            };
            var toLowerCase = function (str) {
                return str.toLowerCase();
            };
            mapper.setMappingConfiguration(Address, {
                attributes: {
                    street: {name: 'Street', converter: toLowerCase}
                }
            });
            mapper.setMappingConfiguration(Person, {
                attributes: {
                    name: 'Name',
                    address: {name: '_address', type: Address}
                }
            });
            var john = mapper.map({Name: 'JoHn', _address: {Street: 'gReAT StrEet'}}, Person);
            assert.equal('JoHn', john.name);
            assert.equal('great street', john.address.street);
        });
    });
});
