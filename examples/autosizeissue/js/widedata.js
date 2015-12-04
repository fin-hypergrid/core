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
            last_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            first_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            total_number_of_pets_owned: '1.106310097951082' + pets,
            birthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            birthState: '1.106310097951082' + states[birthstate],
            residenceState: '1.106310097951082' + states[residencestate],
            employed: '1.106310097951082' + employed === 1,
            income: income,
            travel: travel,
            squareOfIncome: '1.106310097951082' + 0,
            onelast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            onefirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            onepets: '1.106310097951082' + pets,
            onebirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            onebirthState: '1.106310097951082' + states[birthstate],
            oneresidenceState: '1.106310097951082' + states[residencestate],
            oneemployed: '1.106310097951082' + employed === 1,
            oneincome: '1.106310097951082' + income,
            onetravel: travel,
            onesquareOfIncome: '1.106310097951082' + 0,
            twolast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            twofirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            twopets: '1.106310097951082' + pets,
            twobirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            twobirthState: '1.106310097951082' + states[birthstate],
            tworesidenceState: '1.106310097951082' + states[residencestate],
            twoemployed: '1.106310097951082' + employed === 1,
            twoincome: income,
            twotravel: travel,
            twosquareOfIncome: '1.106310097951082' + 0,
            threelast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            threefirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            threepets: '1.106310097951082' + pets,
            threebirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            threebirthState: '1.106310097951082' + states[birthstate],
            threeresidenceState: '1.106310097951082' + states[residencestate],
            threeemployed: '1.106310097951082' + employed === 1,
            threeincome: income,
            threetravel: travel,
            threesquareOfIncome: '1.106310097951082' + 0,
            fourlast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            fourfirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            fourpets: '1.106310097951082' + pets,
            fourbirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            fourbirthState: '1.106310097951082' + states[birthstate],
            fourresidenceState: '1.106310097951082' + states[residencestate],
            fouremployed: '1.106310097951082' + employed === 1,
            fourincome: income,
            fourtravel: travel,
            foursquareOfIncome: '1.106310097951082' + 0,
            fivelast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            fivefirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            fivepets: '1.106310097951082' + pets,
            fivebirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            fivebirthState: '1.106310097951082' + states[birthstate],
            fiveresidenceState: '1.106310097951082' + states[residencestate],
            fiveemployed: '1.106310097951082' + employed === 1,
            fiveincome: '1.106310097951082' + income,
            fivetravel: '1.106310097951082' + travel,
            fivesquareOfIncome: '1.106310097951082' + 0,
            sixlast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            sixfirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            sixpets: '1.106310097951082' + pets,
            sixbirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            sixbirthState: '1.106310097951082' + states[birthstate],
            sixresidenceState: '1.106310097951082' + states[residencestate],
            sixemployed: '1.106310097951082' + employed === 1,
            sixincome: '1.106310097951082' + income,
            sixtravel: '1.106310097951082' + travel,
            sixsquareOfIncome: '1.106310097951082' + 0,
            sevenlast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            sevenfirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            sevenpets: '1.106310097951082' + pets,
            sevenbirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            sevenbirthState: '1.106310097951082' + states[birthstate],
            sevenresidenceState: '1.106310097951082' + states[residencestate],
            sevenemployed: '1.106310097951082' + employed === 1,
            sevenincome: '1.106310097951082' + income,
            seventravel: '1.106310097951082' + travel,
            sevensquareOfIncome: '1.106310097951082' + 0,
            eightlast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            eightfirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            eightpets: '1.106310097951082' + pets,
            eightbirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            eightbirthState: '1.106310097951082' + states[birthstate],
            eightresidenceState: '1.106310097951082' + states[residencestate],
            eightemployed: '1.106310097951082' + employed === 1,
            eightincome: '1.106310097951082' + income,
            eighttravel: '1.106310097951082' + travel,
            eightsquareOfIncome: '1.106310097951082' + 0,
            ninelast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            ninefirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            ninepets: '1.106310097951082' + pets,
            ninebirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            ninebirthState: '1.106310097951082' + states[birthstate],
            nineresidenceState: '1.106310097951082' + states[residencestate],
            nineemployed: '1.106310097951082' + employed === 1,
            nineincome: '1.106310097951082' + income,
            ninetravel: '1.106310097951082' + travel,
            ninesquareOfIncome: '1.106310097951082' + 0,
            tenlast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            tenfirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            tenpets: '1.106310097951082' + pets,
            tenbirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            tenbirthState: '1.106310097951082' + states[birthstate],
            tenresidenceState: '1.106310097951082' + states[residencestate],
            tenemployed: '1.106310097951082' + employed === 1,
            tenincome: '1.106310097951082' + income,
            tentravel: '1.106310097951082' + travel,
            tensquareOfIncome: '1.106310097951082' + 0,
            elevenlast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            elevenfirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            elevenpets: '1.106310097951082' + pets,
            elevenbirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            elevenbirthState: '1.106310097951082' + states[birthstate],
            elevenresidenceState: '1.106310097951082' + states[residencestate],
            elevenemployed: '1.106310097951082' + employed === 1,
            elevenincome: '1.106310097951082' + income,
            eleventravel: '1.106310097951082' + travel,
            elevensquareOfIncome: '1.106310097951082' + 0,
            twelvelast_name: '1.106310097951082' + lastNames[lastName], //jshint ignore:line
            twelvefirst_name: '1.106310097951082' + firstNames[firstName], //jshint ignore:line
            twelvepets: '1.106310097951082' + pets,
            twelvebirthDate: '1.106310097951082' + birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            twelvebirthState: '1.106310097951082' + states[birthstate],
            twelveresidenceState: '1.106310097951082' + states[residencestate],
            twelveemployed: '1.106310097951082' + employed === 1,
            twelveincome: '1.106310097951082' + income,
            twelvetravel: '1.106310097951082' + travel,
            twelvesquareOfIncome: '1.106310097951082' + 0,
        };


/*        var person = {
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
            ninelast_name: lastNames[lastName], //jshint ignore:line
            ninefirst_name: firstNames[firstName], //jshint ignore:line
            ninepets: pets,
            ninebirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            ninebirthState: states[birthstate],
            nineresidenceState: states[residencestate],
            nineemployed: employed === 1,
            nineincome: income,
            ninetravel: travel,
            ninesquareOfIncome: 0,
            tenlast_name: lastNames[lastName], //jshint ignore:line
            tenfirst_name: firstNames[firstName], //jshint ignore:line
            tenpets: pets,
            tenbirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            tenbirthState: states[birthstate],
            tenresidenceState: states[residencestate],
            tenemployed: employed === 1,
            tenincome: income,
            tentravel: travel,
            tensquareOfIncome: 0,
            elevenlast_name: lastNames[lastName], //jshint ignore:line
            elevenfirst_name: firstNames[firstName], //jshint ignore:line
            elevenpets: pets,
            elevenbirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            elevenbirthState: states[birthstate],
            elevenresidenceState: states[residencestate],
            elevenemployed: employed === 1,
            elevenincome: income,
            eleventravel: travel,
            elevensquareOfIncome: 0,
            twelvelast_name: lastNames[lastName], //jshint ignore:line
            twelvefirst_name: firstNames[firstName], //jshint ignore:line
            twelvepets: pets,
            twelvebirthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
            twelvebirthState: states[birthstate],
            twelveresidenceState: states[residencestate],
            twelveemployed: employed === 1,
            twelveincome: income,
            twelvetravel: travel,
            twelvesquareOfIncome: 0,
            
            
        };*/
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

    //console.log(JSON.stringify(data));
})();
