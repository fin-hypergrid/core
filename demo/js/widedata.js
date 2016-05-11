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
        var pets = Math.round(10 * randomFunc());
        var height = 50 + Math.round(40 * randomFunc());
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
            total_number_of_pets_owned: pets,
            height: height,
            birthDate: new Date(birthyear + '-' + months[birthmonth] + '-' + days[birthday]),
            birthState: states[birthstate],
            residenceState: states[residencestate],
            employed: employed === 1,
            income: income,
            travel: travel,
            squareOfIncome: 0,

            one_last_name: lastNames[lastName], //jshint ignore:line
            one_first_name: firstNames[firstName], //jshint ignore:line
            one_pets: pets,
            one_height: height,
            one_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            one_birthState: states[birthstate],
            one_residenceState: states[residencestate],
            one_employed: employed === 1,
            one_income: income,
            one_travel: travel,
            one_squareOfIncome: 0,

            two_last_name: lastNames[lastName], //jshint ignore:line
            two_first_name: firstNames[firstName], //jshint ignore:line
            two_pets: pets,
            two_height: height,
            two_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            two_birthState: states[birthstate],
            two_residenceState: states[residencestate],
            two_employed: employed === 1,
            two_income: income,
            two_travel: travel,
            two_squareOfIncome: 0,

            three_last_name: lastNames[lastName], //jshint ignore:line
            three_first_name: firstNames[firstName], //jshint ignore:line
            three_pets: pets,
            three_height: height,
            three_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            three_birthState: states[birthstate],
            three_residenceState: states[residencestate],
            three_employed: employed === 1,
            three_income: income,
            three_travel: travel,
            three_squareOfIncome: 0,

            four_last_name: lastNames[lastName], //jshint ignore:line
            four_first_name: firstNames[firstName], //jshint ignore:line
            four_pets: pets,
            four_height: height,
            four_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            four_birthState: states[birthstate],
            four_residenceState: states[residencestate],
            four_employed: employed === 1,
            four_income: income,
            four_travel: travel,
            four_squareOfIncome: 0,

            five_last_name: lastNames[lastName], //jshint ignore:line
            five_first_name: firstNames[firstName], //jshint ignore:line
            five_pets: pets,
            five_height: height,
            five_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            five_birthState: states[birthstate],
            five_residenceState: states[residencestate],
            five_employed: employed === 1,
            five_income: income,
            five_travel: travel,
            five_squareOfIncome: 0,

            six_last_name: lastNames[lastName], //jshint ignore:line
            six_first_name: firstNames[firstName], //jshint ignore:line
            six_pets: pets,
            six_height: height,
            six_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            six_birthState: states[birthstate],
            six_residenceState: states[residencestate],
            six_employed: employed === 1,
            six_income: income,
            six_travel: travel,
            six_squareOfIncome: 0,

            seven_last_name: lastNames[lastName], //jshint ignore:line
            seven_first_name: firstNames[firstName], //jshint ignore:line
            seven_pets: pets,
            seven_height: height,
            seven_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            seven_birthState: states[birthstate],
            seven_residenceState: states[residencestate],
            seven_employed: employed === 1,
            seven_income: income,
            seven_travel: travel,
            seven_squareOfIncome: 0,

            eight_last_name: lastNames[lastName], //jshint ignore:line
            eight_first_name: firstNames[firstName], //jshint ignore:line
            eight_pets: pets,
            eight_height: height,
            eight_birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            eight_birthState: states[birthstate],
            eight_residenceState: states[residencestate],
            eight_employed: employed === 1,
            eight_income: income,
            eight_travel: travel,
            eight_squareOfIncome: 0,
        };
        person.squareOfIncome = function() {
            return Math.sqrt(person.income);
        }
        return person;
    };

    var data = [];
    for (var i = 0; i < numRows; i++) {
        data.push(randomPerson());
    }
    window.people2 = data;
    data = [];
    for (var i = 0; i < numRows/2; i++) {
        data.push(randomPerson());
    }
    window.people1 = data;
    window.states = states;
    window.firstNames = firstNames;
    window.lastNames = lastNames;
})();
