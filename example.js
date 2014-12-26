'use strict';

var ObjectMapper = require('./index');

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
