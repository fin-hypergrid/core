'use strict';

(function() {
    var numRows = 100000;

    var firstNames = ['Olivia', 'Sophia', 'Ava', 'Isabella', 'Boy', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Moe', 'Larry', 'Curly', 'Shemp', 'Groucho', 'Harpo', 'Chico', 'Zeppo', 'Stanley', 'Hardy'];
    var lastNames = ['Wirts', 'Oneil', 'Smith', 'Barbarosa', 'Soprano', 'Gotti', 'Columbo', 'Luciano', 'Doerre', 'DePena'];
    var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    var days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
    var states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

    var randomFunc = Math.random;
    //var randomFunc = rnd;

    var randomPerson = function() {
        var firstName = Math.round((firstNames.length - 1) * randomFunc());
        //var lastName = 'a' + randomFunc() + 'b';
        var lastName = Math.round((lastNames.length - 1) * randomFunc());
        var pets = Math.round(10 * randomFunc());
        var birthyear = 1900 + Math.round(randomFunc() * 114);
        var birthmonth = Math.round(randomFunc() * 11);
        var birthday = Math.round(randomFunc() * 29);
        var birthstate = Math.round(randomFunc() * 49);
        var residencestate = Math.round(randomFunc() * 49);
        var travel = randomFunc() * 1000;
        var income = randomFunc() * 100000;
        var employed = Math.round(randomFunc());
        var person = {
            last_name0: lastNames[lastName], //jshint ignore:line
            first_name0: firstNames[firstName], //jshint ignore:line
            pets0: pets,
            birthDate0: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            birthState0: states[birthstate],
            residenceState0: states[residencestate],
            employed0: employed === 1,
            income0: income,
            travel0: travel,
            last_name1: lastNames[lastName], //jshint ignore:line
            first_name1: firstNames[firstName], //jshint ignore:line
            pets1: pets,
            birthDate1: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            birthState1: states[birthstate],
            residenceState1: states[residencestate],
            employed1: employed === 1,
            income1: income,
            travel1: travel,
            last_name2: lastNames[lastName], //jshint ignore:line
            first_name2: firstNames[firstName], //jshint ignore:line
            pets2: pets,
            birthDate2: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            birthState2: states[birthstate],
            residenceState2: states[residencestate],
            employed2: employed === 1,
            income2: income,
            travel2: travel,
            last_name3: lastNames[lastName], //jshint ignore:line
            first_name3: firstNames[firstName], //jshint ignore:line
            pets3: pets,
            birthDate3: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            birthState3: states[birthstate],
            residenceState3: states[residencestate],
            employed3: employed === 1,
            income3: income,
            travel3: travel,
            last_name4: lastNames[lastName], //jshint ignore:line
            first_name4: firstNames[firstName], //jshint ignore:line
            pets4: pets,
            birthDate4: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            birthState4: states[birthstate],
            residenceState4: states[residencestate],
            employed4: employed === 1,
            income4: income,
            travel4: travel
        };
        return person;
    };

    var data = [];
    for (var i = 0; i < numRows; i++) {
        data.push(randomPerson());
    }
    window.people = data;
})();
