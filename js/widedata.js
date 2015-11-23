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
            birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            birthState: states[birthstate],
            residenceState: states[residencestate],
            employed: employed === 1,
            income: income,
            travel: travel,
            squareOfIncome: 0,
            onelast_name: lastNames[lastName], //jshint ignore:line
            onefirst_name: firstNames[firstName], //jshint ignore:line
            onepets: pets,
            onebirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            onebirthState: states[birthstate],
            oneresidenceState: states[residencestate],
            oneemployed: employed === 1,
            oneincome: income,
            onetravel: travel,
            onesquareOfIncome: 0,
            twolast_name: lastNames[lastName], //jshint ignore:line
            twofirst_name: firstNames[firstName], //jshint ignore:line
            twopets: pets,
            twobirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            twobirthState: states[birthstate],
            tworesidenceState: states[residencestate],
            twoemployed: employed === 1,
            twoincome: income,
            twotravel: travel,
            twosquareOfIncome: 0,
            threelast_name: lastNames[lastName], //jshint ignore:line
            threefirst_name: firstNames[firstName], //jshint ignore:line
            threepets: pets,
            threebirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            threebirthState: states[birthstate],
            threeresidenceState: states[residencestate],
            threeemployed: employed === 1,
            threeincome: income,
            threetravel: travel,
            threesquareOfIncome: 0,
            fourlast_name: lastNames[lastName], //jshint ignore:line
            fourfirst_name: firstNames[firstName], //jshint ignore:line
            fourpets: pets,
            fourbirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            fourbirthState: states[birthstate],
            fourresidenceState: states[residencestate],
            fouremployed: employed === 1,
            fourincome: income,
            fourtravel: travel,
            foursquareOfIncome: 0,
            fivelast_name: lastNames[lastName], //jshint ignore:line
            fivefirst_name: firstNames[firstName], //jshint ignore:line
            fivepets: pets,
            fivebirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            fivebirthState: states[birthstate],
            fiveresidenceState: states[residencestate],
            fiveemployed: employed === 1,
            fiveincome: income,
            fivetravel: travel,
            fivesquareOfIncome: 0,
            sixlast_name: lastNames[lastName], //jshint ignore:line
            sixfirst_name: firstNames[firstName], //jshint ignore:line
            sixpets: pets,
            sixbirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            sixbirthState: states[birthstate],
            sixresidenceState: states[residencestate],
            sixemployed: employed === 1,
            sixincome: income,
            sixtravel: travel,
            sixsquareOfIncome: 0,
            sevenlast_name: lastNames[lastName], //jshint ignore:line
            sevenfirst_name: firstNames[firstName], //jshint ignore:line
            sevenpets: pets,
            sevenbirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            sevenbirthState: states[birthstate],
            sevenresidenceState: states[residencestate],
            sevenemployed: employed === 1,
            sevenincome: income,
            seventravel: travel,
            sevensquareOfIncome: 0,
            eightlast_name: lastNames[lastName], //jshint ignore:line
            eightfirst_name: firstNames[firstName], //jshint ignore:line
            eightpets: pets,
            eightbirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            eightbirthState: states[birthstate],
            eightresidenceState: states[residencestate],
            eightemployed: employed === 1,
            eightincome: income,
            eighttravel: travel,
            eightsquareOfIncome: 0,
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
    window.people1 = window.people2 = data;
    window.states = states;
    window.firstNames = firstNames;
    window.lastNames = lastNames;
})();
