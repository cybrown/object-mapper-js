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

    describe ('Objects with arrays as properties', function () {

        it ('should map multiple objects in an array', function () {
            var Customer = function () {
                this.name = '';
                this.products = [];
            };
            var Product = function () {
                this.name = '';
                this.price = 0;
            };
            mapper.setMappingConfiguration(Product, {
                attributes: {
                    name: true,
                    price: true
                }
            });
            mapper.setMappingConfiguration(Customer, {
                attributes: {
                    name: 'Name',
                    products: {type: [Product]}
                }
            });
            var toto = mapper.map({
                Name: 'toto',
                products: [
                    {
                        name: 'keyboard',
                        price: 13.7
                    },
                    {
                        name: 'screen',
                        price: 199.90
                    }
                ]
            }, Customer);
            assert.equal('toto', toto.name);
            assert.ok(toto instanceof Customer);
            assert.equal(2, toto.products.length);
            assert.ok(toto.products[0] instanceof Product);
            assert.equal('keyboard', toto.products[0].name);
        });

        it ('should map arrays in arrays', function () {
            var Customer = function () {
                this.name = '';
                this.products = [];
            };
            var Product = function () {
                this.name = '';
                this.price = 0;
                this.vendors = [];
            };
            var Vendor = function () {
                this.id = '';
                this.location = '';
            };
            mapper.setMappingConfiguration(Vendor, {
                attributes: {
                    id: '_id',
                    location: 'City'
                }
            });
            mapper.setMappingConfiguration(Product, {
                attributes: {
                    name: true,
                    price: true,
                    vendors: {type: [Vendor]}
                }
            });
            mapper.setMappingConfiguration(Customer, {
                attributes: {
                    name: 'Name',
                    products: {type: [Product]}
                }
            });
            var toto = mapper.map({
                Name: 'toto',
                products: [
                    {
                        name: 'keyboard',
                        price: 13.7,
                        vendors: [
                            {
                                _id: 'vendor-france',
                                City: 'Paris'
                            },
                            {
                                _id: 'vendor-england',
                                City: 'London'
                            }
                        ]
                    },
                    {
                        name: 'screen',
                        price: 199.90,
                        vendors: []
                    }
                ]
            }, Customer);
            assert.equal('toto', toto.name);
            assert.ok(toto instanceof Customer);
            assert.equal(2, toto.products.length);
            assert.ok(toto.products[0] instanceof Product);
            assert.equal('keyboard', toto.products[0].name);
            assert.ok(toto.products[0].vendors[0] instanceof Vendor);
            assert.equal('London', toto.products[0].vendors[1].location);
        });
    });
});
