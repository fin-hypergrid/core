'use strict';

(function() {
    var numRows = 10000;

    var firstNames = ['', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Boy', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Moe', 'Larry', 'Curly', 'Shemp', 'Groucho', 'Harpo', 'Chico', 'Zeppo', 'Stanley', 'Hardy'];
    var lastNames = ['', 'Wirts', 'Oneil', 'Smith', 'Barbarosa', 'Soprano', 'Gotti', 'Columbo', 'Luciano', 'Doerre', 'DePena'];
    var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    var days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
    var states = ['', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

    var randomFunc = Math.random;
    //var randomFunc = rnd;

    var randomPerson = function() {
        var firstName = Math.round((firstNames.length - 1) * randomFunc());
        //var lastName = 'a' + randomFunc() + 'b';
        var lastName = Math.round((lastNames.length - 1) * randomFunc());
        var number_of_pets = Math.round(10 * randomFunc());
        var birthyear = 1900 + Math.round(randomFunc() * 114);
        var birthmonth = Math.round(randomFunc() * 11);
        var birthday = Math.round(randomFunc() * 29);
        var birthstate = Math.round(randomFunc() * (states.length - 1));
        var residencestate = Math.round(randomFunc() * (states.length - 1));
        var travel = randomFunc() * 1000;
        var income = randomFunc() * 100000;
        var employed = Math.round(randomFunc());
        var person = {
            last_name: lastNames[lastName], //jshint ignore:line
            first_name: firstNames[firstName], //jshint ignore:line
            number_of_pets: number_of_pets,
            birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            birthState: states[birthstate],
            residenceState: states[residencestate],
            employed: employed === 1,
            income: income,
            travel: travel,
            squareOfIncome: 0,

            // last_name1: lastNames[lastName], //jshint ignore:line
            // first_name1: firstNames[firstName], //jshint ignore:line
            // pets1: pets,
            // birthDate1: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            // birthState1: states[birthstate],
            // residenceState1: states[residencestate],
            // employed1: employed === 1,
            // income1: income,
            // travel1: travel,
            // squareOfIncome1: 0,
        };
        person.squareOfIncome = function() {
            return Math.sqrt(person.income);
        }
        // person.squareOfIncome1 = function() {
        //     return Math.sqrt(person.income);
        // }
        return person;
    };

    var data1 = [];
    var data2 = [];
    for (var i = 0; i < numRows/2; i++) {
        data1.push(randomPerson());
    }
    for (var i = 0; i < numRows; i++) {
        data2.push(randomPerson());
    }
    window.people1 = data1;
    window.people2 = data2;
    window.states = states;
    window.firstNames = firstNames;
    window.lastNames = lastNames;
})();
