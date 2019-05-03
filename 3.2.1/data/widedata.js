'use strict';

var numRows = 10000;

var firstNames = ['', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Boy', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Moe', 'Larry', 'Curly', 'Shemp', 'Groucho', 'Harpo', 'Chico', 'Zeppo', 'Stanley', 'Hardy'];
var lastNames = ['', 'Wirts', 'Oneil', 'Smith', 'Barbarosa', 'Soprano', 'Gotti', 'Columbo', 'Luciano', 'Doerre', 'DePena'];
var states = ['', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

var randomFunc = Math.random;

var rnd = function (max) {
    return Math.floor(randomFunc() * max);
};

var msecsPerDay = 24 * 60 * 60 * 1000;
var daysBetween1900and1970 = 25566;
var daysSince1970 = Math.floor(Date.now() / msecsPerDay);
var daysSince1900 = daysBetween1900and1970 + daysSince1970;

var randomPerson = function() {
    var firstName = Math.round((firstNames.length - 1) * randomFunc());
    var lastName = Math.round((lastNames.length - 1) * randomFunc());
    var pets = Math.round(10 * randomFunc());
    var height = 50 + Math.round(40 * randomFunc());
    var birthDateValue = (Math.floor(Math.random() * daysSince1900) - daysBetween1900and1970) * msecsPerDay;
    var birthTime = Math.round(randomFunc() * 60 * 24);
    var birthstate = Math.round(randomFunc() * (states.length - 1));
    var residencestate = Math.round(randomFunc() * (states.length - 1));
    var travel = randomFunc() * 1000;
    var income = randomFunc() * 100000;
    var employed = Math.round(randomFunc());

    //Use this to test Sparkline or Sparkbar
    var sparkData =  [];
    for (var r = 0; r < 10; r++) {
        sparkData.push(10 - rnd(20));
    }

    var person = {
        last_name: lastNames[lastName],
        first_name: firstNames[firstName],
        total_number_of_pets_owned: pets,
        height: height,
        birthDate: new Date(birthDateValue),
        birthTime: birthTime,
        birthState: states[birthstate],
        residenceState: states[residencestate],
        employed: employed === 1,
        income: income,
        travel: travel,
        squareOfIncome: 0,

        one_last_name: lastNames[lastName],
        one_first_name: firstNames[firstName],
        one_pets: pets,
        one_height: height,
        one_birthDate: new Date(birthDateValue),
        one_birthState: states[birthstate],
        one_birthTime: birthTime,
        one_residenceState: states[residencestate],
        one_employed: employed === 1,
        one_income: income,
        one_travel: travel,
        one_squareOfIncome: 0,

        two_last_name: lastNames[lastName],
        two_first_name: firstNames[firstName],
        two_pets: pets,
        two_height: height,
        two_birthDate: new Date(birthDateValue),
        two_birthState: states[birthstate],
        two_birthTime: birthTime,
        two_residenceState: states[residencestate],
        two_employed: employed === 1,
        two_income: income,
        two_travel: travel,
        two_squareOfIncome: 0,

        three_last_name: lastNames[lastName],
        three_first_name: firstNames[firstName],
        three_pets: pets,
        three_height: height,
        three_birthDate: new Date(birthDateValue),
        three_birthState: states[birthstate],
        three_birthTime: birthTime,
        three_residenceState: states[residencestate],
        three_employed: employed === 1,
        three_income: income,
        three_travel: travel,
        three_squareOfIncome: 0,

        four_last_name: lastNames[lastName],
        four_first_name: firstNames[firstName],
        four_pets: pets,
        four_height: height,
        four_birthDate: new Date(birthDateValue),
        four_birthState: states[birthstate],
        four_birthTime: birthTime,
        four_residenceState: states[residencestate],
        four_employed: employed === 1,
        four_income: income,
        four_travel: travel,
        four_squareOfIncome: 0,

        five_last_name: lastNames[lastName],
        five_first_name: firstNames[firstName],
        five_pets: pets,
        five_height: height,
        five_birthDate: new Date(birthDateValue),
        five_birthState: states[birthstate],
        five_birthTime: birthTime,
        five_residenceState: states[residencestate],
        five_employed: employed === 1,
        five_income: income,
        five_travel: travel,
        five_squareOfIncome: 0,

        six_last_name: lastNames[lastName],
        six_first_name: firstNames[firstName],
        six_pets: pets,
        six_height: height,
        six_birthDate: new Date(birthDateValue),
        six_birthState: states[birthstate],
        six_birthTime: birthTime,
        six_residenceState: states[residencestate],
        six_employed: employed === 1,
        six_income: income,
        six_travel: travel,
        six_squareOfIncome: 0,

        seven_last_name: lastNames[lastName],
        seven_first_name: firstNames[firstName],
        seven_pets: pets,
        seven_height: height,
        seven_birthDate: new Date(birthDateValue),
        seven_birthState: states[birthstate],
        seven_birthTime: birthTime,
        seven_residenceState: states[residencestate],
        seven_employed: employed === 1,
        seven_income: income,
        seven_travel: travel,
        seven_squareOfIncome: 0,

        eight_last_name: lastNames[lastName],
        eight_first_name: firstNames[firstName],
        eight_pets: pets,
        eight_height: height,
        eight_birthDate: new Date(birthDateValue),
        eight_birthState: states[birthstate],
        eight_birthTime: birthTime,
        eight_residenceState: states[residencestate],
        eight_employed: employed === 1,
        eight_income: income,
        eight_travel: travel,
        eight_squareOfIncome: 0,
    };
    person.squareOfIncome = function() {
        return Math.sqrt(person.income);
    };
    return person;
};

var data = exports.people2 = [];
for (var i = 0; i < numRows; i++) {
    data.push(randomPerson());
}

data = exports.people1 = [];
for (var i = 0; i < numRows/2; i++) {
    data.push(randomPerson());
}

exports.states = states;
exports.firstNames = firstNames;
exports.lastNames = lastNames;
