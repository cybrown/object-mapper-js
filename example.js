'use strict';

var require;

if (typeof require === 'function') {
    var ObjectMapper = require('./index');
}

var Address = function () {
    this.street = '';
    this.zipCode = 0;
    this.city = '';
};

Object.defineProperty(Address.prototype, 'toPrettyString', {
    get: function () {
        return this.street + ' ' + this.zipCode + ' ' + this.city;
    }
});

var Person = function () {
    this.firstname = '';
    this.lastname = '';
    this.age = 0;
    this.address = null;
};

Object.defineProperty(Person.prototype, 'fullname', {
    get: function () {
        return this.firstname + ' ' + this.lastname;
    }
});

var totoDto = {
    firstname: 'carl',
    last_name: 'johnson',
    Age: '25',
    Address: {
        Street: 'groove street',
        Zip: 12345,
        Town: 'los santos'
    }
};

var fromPlainObjectMapper = new ObjectMapper();

fromPlainObjectMapper.setMappingConfiguration(Person, {
    attributes: {
        firstname: true,
        lastname: {name: 'last_name'},
        age: {name: 'Age', converter: Number},
        address: {name: 'Address', type: Address}
    }
});

fromPlainObjectMapper.setMappingConfiguration(Address, {
    attributes: {
        street: 'Street',
        zipCode: 'Zip',
        city: 'Town'
    }
});

var toto = fromPlainObjectMapper.map(totoDto, Person);

console.log(toto.fullname);
console.log('<' + typeof toto.age + '> ' + toto.age);
console.log(toto.address.toPrettyString);
console.log(toto.address.foo);


console.log('');

var toto2 = new Person();
toto2.address = new Address();
toto2.address.foo = 'bar';
fromPlainObjectMapper.map(totoDto, Person, toto2);

console.log(toto2.fullname);
console.log('<' + typeof toto2.age + '> ' + toto2.age);
console.log(toto2.address.toPrettyString);
console.log(toto2.address.foo);

console.log('');

var a = Date.now();
for (var i = 0; i < 100000; i++) {
    fromPlainObjectMapper.map(totoDto, Person);
}
var b = Date.now();
console.log(b - a + 'ms');

var a = Date.now();
for (var i = 0; i < 100000; i++) {
    fromPlainObjectMapper.map(totoDto, Person, new Person());
}
var b = Date.now();
console.log(b - a + 'ms');

fromPlainObjectMapper.setMappingConfigurationWithEval(Person, {
    attributes: {
        firstname: true,
        lastname: {name: 'last_name'},
        age: {name: 'Age', converter: Number},
        address: {name: 'Address', type: Address}
    }
});

fromPlainObjectMapper.setMappingConfigurationWithEval(Address, {
    attributes: {
        street: 'Street',
        zipCode: 'Zip',
        city: 'Town'
    }
});

console.log('');

var a = Date.now();
for (var i = 0; i < 100000; i++) {
    fromPlainObjectMapper.map(totoDto, Person);
}
var b = Date.now();
console.log(b - a + 'ms');

var a = Date.now();
for (var i = 0; i < 100000; i++) {
    fromPlainObjectMapper.map(totoDto, Person, new Person());
}
var b = Date.now();
console.log(b - a + 'ms');
