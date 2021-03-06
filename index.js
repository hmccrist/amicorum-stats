// global vars
// colours
const alphaValue = '0.7';
const casmenosColour    = `rgb(143, 0, 0, ${alphaValue})`;
const alwinColour       = `rgb(21, 57, 158, ${alphaValue})`;
const explosionColour   = `rgb(255, 98, 0, ${alphaValue})`;
const draconeColour     = `rgb(0, 0, 0, ${alphaValue})`;
const glaceColour       = `rgb(17, 145, 15, ${alphaValue})`;
const ruuskColour       = `rgb(137, 85, 189, ${alphaValue})`;
const npcColour         = `rgb(109, 199, 195, ${alphaValue})`;

const casmenosFullName = 'Casmenos Kosmir';
const alwinFullName = 'Alwin Luden';
const explosionFullName = 'Explosion';
const draconeFullName = 'Dracone';
const glaceFullName = 'Glace';
const ruuskFullName = 'Ruusk';

// elem: chart on html
// RollData: relevant data (of the week)
// rollDataName: the data the graph will use... e.g. 'nat20s' or 'avgRoll' etc.
// title: title of graph
class RollGraph {
    constructor(elem, RollData, rollDataName, title) {
        this.rollDataName = rollDataName;
        this.graphData = RollData.getGraphData(rollDataName);
        this.title = title;
        Chart.defaults.color = "rgb(255, 255, 255)";    // make text white
        this.myChart = new Chart(
            elem,
            this.getConfig()
        );
    }

    getConfig() {
        const data = {
            labels: this.graphData['labels'],
            datasets: [{
              label: this.title,
              backgroundColor: this.graphData['colour'],
              borderWidth: 1,
              fill: false,
              minBarLength: 5,
              data: this.graphData['data'],
            }]
        };

        const config = {
            type: 'bar',
            data,
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        ticks: {
                            beginAtZero: true,
                            callback: function(value) {if (value % 1 === 0) {return value;}}    // no decimal tick numbers
                            
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        offset: -25,
                        clamp: true,
                        formatter: (val) => {if (val === 0) { return ('')}}     // remove 0's from displaying
                    }
                }
            },
        };
        return config
    }

    // update labels, data and colours
    // only need to provide the weeks RollData as newWeekData.
    changeData(newWeekData) {
        const newRollData = newWeekData.getGraphData(this.rollDataName);
        this.myChart.data.labels = newRollData['labels'];
        this.myChart.data.datasets[0].data = newRollData['data'];
        this.myChart.data.datasets[0].backgroundColor = newRollData['colour'];
        this.myChart.update();
    }
}

class PlayerData {
    constructor(name, colour) {
        this.name = name;
        this.playerData = {                 // if adding any new values, remember to update combineData() also
            'colour': colour,
            'totalRolls': 0,
            'nat20s': 0,
            'nat1s': 0,
            'allD20Rolls': [],
            'avgRoll': 0,
            'attackRolls': 0,
            'dmgRolls': 0,
            'dmgDoneTotal': 0,
            'abilityRolls': 0,
            'saveRolls': 0,
            'attackRollsDict': {},          // key = title | value(s) = rollShort
            'dmgRollsDict': {},
            'abilityRollsDict': {},
            'saveRollsDict': {},
            'attackRollsSorted': [],        // 2D arrays where index 0 for each inner array is the name followed by all the rolls.
            'dmgRollsSorted': [],
            'abilityRollsSorted': [],
            'saveRollsSorted': []
        };
    }

    // sorts the dictonarys into the 2d sorted arrays
    sortDicts() {
        const dictsToSort = {
            'abilityRollsDict': 'abilityRollsSorted',
            'saveRollsDict': 'saveRollsSorted',
            'attackRollsDict': 'attackRollsSorted',
            'dmgRollsDict': 'dmgRollsSorted'
        }
        for (let dict in dictsToSort) {
            let sortedArray = dictsToSort[dict];
            // convert each key->value pair in the dict to an array where element 0 is the key
            const currentSortArray = [];
            for (let key in this.playerData[dict]) {
                let newArr = [];
                newArr.push(key);
                newArr = newArr.concat(this.playerData[dict][key]);
                currentSortArray.push(newArr);
            }
            // damage rolls get their own special sort (sort by sum instead of length)
            if (dict === 'dmgRollsDict') {
                // each reduce arrow func just skips the first element in the array (the name) and then sums the rest of the numbers
                currentSortArray.sort((a, b) => b.slice(1).reduce((n1,n2) => n1 + n2, 0) - a.slice(1).reduce((n1, n2) => n1 + n2, 0));
            } else {
                currentSortArray.sort((a, b) => b.length - a.length);
            }
            this.playerData[sortedArray] = currentSortArray;
        }
    }

    calculateAvg() {
        const allD20Rolls = this.playerData['allD20Rolls'];
        let total = 0;
        for (let i in allD20Rolls) {
            total = total + parseInt(allD20Rolls[i]);
        }
        if (total > 0) {
            const result = total / (allD20Rolls.length);
            this.playerData['avgRoll'] = result.toFixed(2);
        }
    }

    // make sure dictName is correct (attackRollsDict, dmgRollsDict etc.)
    addRollToDict(dictName, rollTitle, rollResult) {
        if (!(rollTitle in this.playerData[dictName])) {
            this.playerData[dictName][rollTitle] = [rollResult];
        }
        else {
            this.playerData[dictName][rollTitle].push(rollResult);
        }
    }

    // i wrote this func and im confused
    combineDicts(dictName, d) {
        for (let key in d) {
            for (let i in d[key]) {
                const rollResult = d[key][i];
                const rollTitle = key;
                this.addRollToDict(dictName, rollTitle, rollResult);
            }
        }
    }

    combineData(newPlayerData) {
        this.playerData['totalRolls'] += newPlayerData['totalRolls'];
        this.playerData['nat20s'] += newPlayerData['nat20s'];
        this.playerData['nat1s'] += newPlayerData['nat1s'];
        this.playerData['allD20Rolls'] = this.playerData['allD20Rolls'].concat(newPlayerData['allD20Rolls']);
        this.playerData['dmgDoneTotal'] += newPlayerData['dmgDoneTotal'];
        this.playerData['attackRolls'] += newPlayerData['attackRolls'];
        this.playerData['abilityRolls'] += newPlayerData['abilityRolls'];
        this.playerData['saveRolls'] += newPlayerData['saveRolls'];
        this.combineDicts('attackRollsDict', newPlayerData['attackRollsDict']);
        this.combineDicts('dmgRollsDict', newPlayerData['dmgRollsDict']);
        this.combineDicts('abilityRollsDict', newPlayerData['abilityRollsDict']);
        this.combineDicts('saveRollsDict', newPlayerData['saveRollsDict']);
        this.calculateAvg();
        this.sortDicts();
    }
}

class RollData {
    constructor(rawData) {
        this.data = {
            'Casmenos': new PlayerData(casmenosFullName, casmenosColour),
            'Alwin': new PlayerData(alwinFullName, alwinColour),
            'Explosion': new PlayerData(explosionFullName, explosionColour),
            'Dracone': new PlayerData(draconeFullName, draconeColour),
            'Ruusk': new PlayerData(ruuskFullName, ruuskColour),
            'Glace': new PlayerData(glaceFullName, glaceColour),
            'NPCs': new PlayerData('NPCs', npcColour)
        }
        this.buildData(rawData);
    }
    
    // Calls updateData for each roll entry in rawData.
    buildData(rawData) {
        for (let i in rawData) {
            const roll = rawData[i];
            this.updateData(roll);
        }
        // calculate averages for chars after all data is collected AND sort the dicts (not a big fan of this code)
        for (let char in this.data) {
            this.data[char].calculateAvg();
            this.data[char].sortDicts();
        }
    }

    // Updates an entry in this.data with a roll from rawData
    updateData(roll) {
        const nameConversion = {
            [casmenosFullName]: 'Casmenos',
            [alwinFullName]: 'Alwin',
            [explosionFullName]: 'Explosion',
            [draconeFullName]: 'Dracone',
            [ruuskFullName]: 'Ruusk',
            [glaceFullName]: 'Glace'
        }
        let name = nameConversion[roll['sender']];
        let rollType = '';

        // if name not found put data in NPCs entry.
        if (name === undefined) { name = 'NPCs'; }

        // check what type of roll it is with regex
        // d20
        let matchResult = roll['rollType'].match('.d20');
        if (matchResult) { rollType = 'd20'; }

        // totalRolls
        this.data[name].playerData['totalRolls'] += 1;

        // D20 | nat 20s and nat 1s.
        if (rollType === 'd20') {
            //matchResult = roll['rollLong'].match('([0-9]+)');
            matchResult = roll['rollLong'].match(/([0-9]+)/g);
            let d20Roll = 0;
            // If roll is dis/advantage then get the right number from rollLong.
            if      (roll['rollVantage'] === 'advantage')       { d20Roll = Math.max(matchResult[0], matchResult[1]); }
            else if (roll['rollVantage'] === 'disadvantage')    { d20Roll = Math.min(matchResult[0], matchResult[1]); }
            else                                                { d20Roll = matchResult[0]; }
            this.data[name].playerData['allD20Rolls'].push(parseInt(d20Roll));       // add to allD20Rolls
            if (matchResult) {
                if (d20Roll === '20') { this.data[name].playerData['nat20s'] += 1; }
                else if (d20Roll === '1') { this.data[name].playerData['nat1s'] += 1; }
            }
        }

        // Check if the roll is a Damage roll or not
        matchResult = roll['title'].match('DAMAGE');
        if (matchResult) {
            //console.log(`${roll['sender']}: ${roll['title']}: ${roll['rollShort']}`);
            this.data[name].playerData['dmgDoneTotal'] += parseInt(roll['rollShort']);
            this.data[name].addRollToDict('dmgRollsDict', roll['title'], parseInt(roll['rollShort']));
        }
        
        // Check if the roll is an Attack roll
        matchResult = roll['title'].match('TO HIT');
        if (matchResult) {
            //console.log(`${roll['sender']}: ${roll['title']}: ${roll['rollShort']}`);
            this.data[name].playerData['attackRolls'] += 1;
            this.data[name].addRollToDict('attackRollsDict', roll['title'], parseInt(roll['rollShort'])); // todo: if natroll is 1 then just add 1. (no modifiers)
        }

        // Ability rolls
        matchResult = roll['title'].match('CHECK');
        if (matchResult) {
            this.data[name].playerData['abilityRolls'] += 1;
            this.data[name].addRollToDict('abilityRollsDict', roll['title'], parseInt(roll['rollShort']));
        }

        // Saves
        matchResult = roll['title'].match('SAVE');
        if (matchResult) {
            this.data[name].playerData['saveRolls'] += 1;
            this.data[name].addRollToDict('saveRollsDict', roll['title'], parseInt(roll['rollShort']));
        }
        
        
        

        
        //todo
    }

    // combine another RollData's data with this one
    combineRollData(newRollData) {
        for (let char in this.data) {
            this.data[char].combineData(newRollData.data[char].playerData);
        }
    }

    // returns 3 lists: labels, data and colour to be used in the config for the graph.
    getGraphData(dataEntry) {
        let graphData = {
            'labels': [],
            'data': [],
            'colour': []
        };
        for (let c in this.data) {
            graphData['labels'].push(c);
            graphData['data'].push(this.data[c].playerData[dataEntry]);
            graphData['colour'].push(this.data[c].playerData['colour']);
        }
        return graphData;
    }

    getCombinedRolls(dataEntry) {
        const validDataEntrys = [
            'totalRolls',
            'nat20s',
            'nat1s',
            'dmgDoneTotal',
            'attackRolls'
        ]
        if (!validDataEntrys.includes(dataEntry)) { console.error(`Not a valid data entry: ${dataEntry}`); return -1; }
        let total = 0;
        for (let char in this.data) {
            total += this.data[char].playerData[dataEntry];
        }
        return total;
    }
}

// graphs/charts
// when adding new graph
// 1. add html
// 2. update allGraphs
// 3. update graph title if necessary
// 4. update combineData() in PlayerData class

Chart.register(ChartDataLabels);    // plugin to display numbers on the charts

// page data
// -- update this with new weeks

const week1RollData = new RollData(week1Data);
const week2RollData = new RollData(week2Data);
const week3RollData = new RollData(week3Data);
const week4RollData = new RollData(week4Data);
const week5RollData = new RollData(week5Data);
const week6RollData = new RollData(week6Data);
const week7RollData = new RollData(week7Data);
const week8RollData = new RollData(week8Data);
const week9RollData = new RollData(week9Data);
const week10RollData = new RollData(week10Data);
const week11RollData = new RollData(week11Data);
const week12RollData = new RollData(week12Data);
const week13RollData = new RollData(week13Data);
const week14RollData = new RollData(week14Data);
const week15RollData = new RollData(week15Data);
const week16RollData = new RollData(week16Data);
const week17RollData = new RollData(week17Data);
const week18RollData = new RollData(week18Data);
const week19RollData = new RollData(week19Data);
const week20RollData = new RollData(week20Data);
const week21RollData = new RollData(week21Data);
const week22RollData = new RollData(week22Data);
const week23RollData = new RollData(week23Data);
const week24RollData = new RollData(week24Data);
const week25RollData = new RollData(week25Data);
const week26RollData = new RollData(week26Data);
const week27RollData = new RollData(week27Data);
const week28RollData = new RollData(week28Data);
const week29RollData = new RollData(week29Data);
const week30RollData = new RollData(week30Data);

// easiest way to do this (probably not the best...)
const allRollData = new RollData(week1Data);
allRollData.combineRollData(week2RollData);
allRollData.combineRollData(week3RollData);
allRollData.combineRollData(week4RollData);
allRollData.combineRollData(week5RollData);
allRollData.combineRollData(week6RollData);
allRollData.combineRollData(week7RollData);
allRollData.combineRollData(week8RollData);
allRollData.combineRollData(week9RollData);
allRollData.combineRollData(week10RollData);
allRollData.combineRollData(week11RollData);
allRollData.combineRollData(week12RollData);
allRollData.combineRollData(week13RollData);
allRollData.combineRollData(week14RollData);
allRollData.combineRollData(week15RollData);
allRollData.combineRollData(week16RollData);
allRollData.combineRollData(week17RollData);
allRollData.combineRollData(week18RollData)
allRollData.combineRollData(week19RollData)
allRollData.combineRollData(week20RollData)
allRollData.combineRollData(week21RollData)
allRollData.combineRollData(week22RollData)
allRollData.combineRollData(week23RollData)
allRollData.combineRollData(week24RollData)
allRollData.combineRollData(week25RollData)
allRollData.combineRollData(week26RollData)
allRollData.combineRollData(week27RollData)
allRollData.combineRollData(week28RollData)
allRollData.combineRollData(week29RollData)
allRollData.combineRollData(week30RollData)

const pageData = {
    all: {
        title: 'All Rolls!',
        charPageTitle: 'The Entire Campaign',
        button: document.getElementById('allButton'),
        data: allRollData
    },
    week1: {
        title: 'Week 1 - Murderer Made of Ice',
        charPageTitle: 'Week 1',
        button: document.getElementById('week1Button'),
        data: week1RollData
    },
    week2: {
        title: 'Week 2 - A Bag of Animals',
        charPageTitle: 'Week 2',
        button: document.getElementById('week2Button'),
        data: week2RollData
    },
    week3: {
        title: 'Week 3 - Snowy the Chwinga',
        charPageTitle: 'Week 3',
        button: document.getElementById('week3Button'),
        data: week3RollData
    },
    week4: {
        title: 'Week 4 - The Company of the Giant Elks',
        charPageTitle: 'Week 4',
        button: document.getElementById('week4Button'),
        data: week4RollData
    },
    week5: {
        title: 'Week 5 - We just made that lady eat that guy wtf',
        charPageTitle: 'Week 5',
        button: document.getElementById('week5Button'),
        data: week5RollData
    },
    week6: {
        title: 'Week 6 - Saving & Taking Lives',
        charPageTitle: 'Week 6',
        button: document.getElementById('week6Button'),
        data: week6RollData
    },
    week7: {
        title: 'Week 7 - The Graced',
        charPageTitle: 'Week 7',
        button: document.getElementById('week7Button'),
        data: week7RollData
    },
    week8: {
        title: 'Week 8 - An Explosive Performance',
        charPageTitle: 'Week 8',
        button: document.getElementById("week8Button"),
        data: week8RollData
    },
    week9: {
        title: 'Week 9 - Are we the Baddies?',
        charPageTitle: 'Week 9',
        button: document.getElementById('week9Button'),
        data: week9RollData
    },
    week10: {
        title: 'Week 10 - Thieves',
        charPageTitle: 'Week 10',
        button: document.getElementById('week10Button'),
        data: week10RollData
    },
    week11: {
        title: 'Week 11 - The Great Warrior Rat, Jeremy',
        charPageTitle: 'Week 11',
        button: document.getElementById("week11Button"),
        data: week11RollData
    },
    week12: {
        title: 'Week 12 - Diversity',
        charPageTitle: 'Week 12',
        button: document.getElementById("week12Button"),
        data: week12RollData
    },
    week13: {
        title: 'Week 13 - The Graced send their regards',
        charPageTitle: 'Week 13',
        button: document.getElementById("week13Button"),
        data: week13RollData
    },
    week14: {
        title: 'Week 14 - Never trust women (if they\'re harpys)',
        charPageTitle: 'Week 14',
        button: document.getElementById("week14Button"),
        data: week14RollData
    },
    week15: {
        title: 'Week 15 - Finding some free treasure laying around',
        charPageTitle: 'Week 15',
        button: document.getElementById("week15Button"),
        data: week15RollData
    },
    week16: {
        title: 'Week 16 - Being chased by a dragon for unknown reasons',
        charPageTitle: 'Week 16',
        button: document.getElementById("week16Button"),
        data: week16RollData
    },
    week17: {
        title: 'Week 17 - Showdown with Xardorok Stunblight',
        charPageTitle: 'Week 17',
        button: document.getElementById("week17Button"),
        data: week17RollData
    },
    week18: {
        title: 'Week 18 - Now we\'re chasing a dragon',
        charPageTitle: 'Week 18',
        button: document.getElementById("week18Button"),
        data: week18RollData
    },
    week19: {
        title: 'Now we\'re killing a dragon.',
        charPageTitle: 'Week 19',
        button: document.getElementById("week19Button"),
        data: week19RollData
    },
    week20: {
        title: 'Week 20 - Mammoth Cannonball',
        charPageTitle: 'Week 20',
        button: document.getElementById("week20Button"),
        data: week20RollData
    },
    week21: {
        title: 'Week 21 - Battle on the Open Sea',
        charPageTitle: 'Week 21',
        button: document.getElementById("week21Button"),
        data: week21RollData
    },
    week22: {
        title: 'Week 22 - Return of Snowy the Chwinga',
        charPageTitle: 'Week 22',
        button: document.getElementById("week22Button"),
        data: week22RollData
    },
    week23: {
        title: 'Week 23 - The Trial of Preservation',
        charPageTitle: 'Week 23',
        button: document.getElementById("week23Button"),
        data: week23RollData
    },
    week24: {
        title: 'Week 24 - Murdering a god real quick.',
        charPageTitle: 'Week 24',
        button: document.getElementById("week24Button"),
        data: week24RollData
    },
    week25: {
        title: 'Week 25 - Travelling across the continent real quick',
        charPageTitle: 'Week 25',
        button: document.getElementById("week25Button"),
        data: week25RollData
    },
    week26: {
        title: 'Week 26 - 11 Shadows vs 1 Fireball: Who Wins?',
        charPageTitle: 'Week 26',
        button: document.getElementById("week26Button"),
        data: week26RollData
    },
    week27: {
        title: 'Week 27 - Mistrust and Madness',
        charPageTitle: 'Week 27',
        button: document.getElementById("week27Button"),
        data: week27RollData
    },
    week28: {
        title: 'Week 28 - Final Showdown in the Caves',
        charPageTitle: 'Week 28',
        button: document.getElementById("week28Button"),
        data: week28RollData
    },
    week29: {
        title: 'Week 29 - The Horny Anvil',
        charPageTitle: 'Week 29',
        button: document.getElementById("week29Button"),
        data: week29RollData
    },
    week30: {
        title: 'Week 30 - Friendly Demons and Angry Plants',
        charPageTitle: 'Week 30',
        button: document.getElementById("week30Button"),
        data: week30RollData
    }
}


// all graphs
// -- update this when adding/removing new graphs

const initialRollData = allRollData;
const initialTitle = pageData['all']['title'];
const allGraphs = {
    totalRollsGraph: new RollGraph(document.getElementById('totalRollsChart'), initialRollData, 'totalRolls', 'Total Rolls'),
    nat20sGraph: new RollGraph(document.getElementById("nat20sChart"), initialRollData, 'nat20s', 'Natural 20\'s'),
    nat1sGraph: new RollGraph(document.getElementById("nat1sChart"), initialRollData, 'nat1s', 'Natural 1\'s'),
    avgRollGraph: new RollGraph(document.getElementById("avgRollChart"), initialRollData, 'avgRoll', 'Average Roll'),
    dmgDoneGraph: new RollGraph(document.getElementById("dmgDoneChart"), initialRollData, 'dmgDoneTotal', 'Damage Done'),
    attacksRolledGraph: new RollGraph(document.getElementById("attacksRolledChart"), initialRollData, 'attackRolls', 'Attacks')
}

// Update some graph titles for the relevant week
const totalRollsTitle = document.getElementById("totalRollsTitle");
const natural20sTitle = document.getElementById("natural20sTitle");
const natural1sTitle = document.getElementById("natural1sTitle");
const dmgDoneTitle = document.getElementById("dmgDoneTitle");
const attacksRolledTitle = document.getElementById("attacksRolledTitle");

function updateGraphTitles(weekRollData) {
    totalRollsTitle.innerText = `Total Rolls (${weekRollData.getCombinedRolls('totalRolls')})`;
    natural20sTitle.innerText = `Natural 20's (${weekRollData.getCombinedRolls('nat20s')})`;
    natural1sTitle.innerText = `Natural 1's (${weekRollData.getCombinedRolls('nat1s')})`;
    dmgDoneTitle.innerText = `Damage Done (${weekRollData.getCombinedRolls('dmgDoneTotal')} HP)`;
    attacksRolledTitle.innerText = `Attacks Rolled (${weekRollData.getCombinedRolls('attackRolls')})`;
}


// this should be automatic now - won't need to update this. (probably)
function pageSetup(pageData) {
    let graphSectionTitle = document.getElementById('graphSectionTitle');
    graphSectionTitle.innerText = initialTitle;
    updateGraphTitles(initialRollData);
    // adding button listeners
    for (let key in pageData) {
        let weekData = pageData[key];
        weekData['button'].addEventListener("click", () => {
            // change all the graphs to relevant data
            for (let graphKey in allGraphs) {
                graph = allGraphs[graphKey];
                graph.changeData(weekData['data']);
            }
            graphSectionTitle.innerText = weekData['title'];
            updateGraphTitles(weekData['data']);
            charPage.setRollData(weekData['data'], weekData['charPageTitle']);
        });
    }
}
pageSetup(pageData);

// global funcs for hiding/showing the pages
const graphSection = document.getElementById("graphSection");
const charPageSection = document.getElementById("charPageSection");
function showGraphPage() {
    charPageSection.hidden = true;
    graphSection.hidden = false;
}
function showCharPage() {
    charPageSection.hidden = false;
    graphSection.hidden = true;
}


/* Character Page */
class CharPage {
    constructor(initialData, initialWeekName) {
        this.activeChar = null;
        this.rollData = initialData;
        this.weekName = initialWeekName;
        this.titleElem = document.getElementById("charPageTitle");
        this.charAttackedBox = document.getElementById("charAttackedBox");
        this.charDamageBox = document.getElementById("charDamageBox");
        this.charAbilityBox = document.getElementById("charAbilityBox");
        this.charSaveBox = document.getElementById("charSaveBox");
    }

    updatePage() {
        if (this.activeChar === null) { return false; }
        const pData = this.rollData.data[this.activeChar];
        this.titleElem.innerText = `${pData.name} - ${this.weekName}`;

        // Attacked Box
        this.charAttackedBox.innerHTML = '';    // clear the box before adding new elements
        // title
        const attackedTitle = document.createElement("h3");
        attackedTitle.innerText = `${this.activeChar} Attacked ${pData.playerData.attackRolls} Times`;
        this.charAttackedBox.appendChild(attackedTitle);
        // weapon specifics
        const allWeaponAttacks = pData.playerData.attackRollsSorted;
        for (let i in allWeaponAttacks) {
            // new attack title
            const allAttackResults = allWeaponAttacks[i].slice(1);  // skip first element which is the name
            const newAtkTitle = document.createElement("h4");
            newAtkTitle.innerText = `${allAttackResults.length}x ${this.extractTitle(allWeaponAttacks[i][0])}`;
            this.charAttackedBox.appendChild(newAtkTitle);
            // contents
            this.addBoxContents(allAttackResults, this.charAttackedBox);
        }

        // Damage Box   - mostly the same as Attacked Box
        this.charDamageBox.innerHTML = '';
        // title
        const damageTitle = document.createElement("h3");
        damageTitle.innerText = `${this.activeChar} Dealt ${pData.playerData.dmgDoneTotal} Damage`;
        this.charDamageBox.appendChild(damageTitle);
        // All damage specifics
        const allDamageDone = pData.playerData.dmgRollsSorted;
        for (let i in allDamageDone) {
            // new dmg title
            const allDmgRolls = allDamageDone[i].slice(1);     
            const totalDmg = allDmgRolls.reduce((a, b) => a + b, 0);
            const newDmgTitle = document.createElement("h4");
            newDmgTitle.innerText = `${totalDmg} from ${this.extractTitle(allDamageDone[i][0])}`;
            this.charDamageBox.appendChild(newDmgTitle);
            // contents
            this.addBoxContents(allDmgRolls, this.charDamageBox);
        }

        // Ability Box
        this.charAbilityBox.innerHTML = '';
        // title
        const abilityTitle = document.createElement("h3");
        abilityTitle.innerText = `${this.activeChar} Performed ${pData.playerData.abilityRolls} Ability Checks`;
        this.charAbilityBox.appendChild(abilityTitle);
        // ability specifics
        const allAbilityRolls = pData.playerData.abilityRollsSorted;
        for (let i in allAbilityRolls) {
            // title
            const allAbilityResults = allAbilityRolls[i].slice(1);
            const newAbilityTitle = document.createElement("h4");
            newAbilityTitle.innerText = `${allAbilityResults.length}x ${this.extractTitle(allAbilityRolls[i][0])} Checks`;
            this.charAbilityBox.appendChild(newAbilityTitle);
            // contents
            this.addBoxContents(allAbilityResults, this.charAbilityBox);
        }

        // Save Box
        this.charSaveBox.innerHTML = '';
        // title
        const saveTitle = document.createElement("h3");
        saveTitle.innerText = `${this.activeChar} Attempted ${pData.playerData.saveRolls} Saves`;
        this.charSaveBox.appendChild(saveTitle);
        // save specifics
        const allSaveRolls = pData.playerData.saveRollsSorted;
        for (let i in allSaveRolls) {
            // title
            const allSaveResults = allSaveRolls[i].slice(1);
            const newSaveTitle = document.createElement("h4");
            newSaveTitle.innerText = `${allSaveResults.length}x ${this.extractTitle(allSaveRolls[i][0])} Saves`;
            this.charSaveBox.appendChild(newSaveTitle);
            // contents
            this.addBoxContents(allSaveResults, this.charSaveBox);
        }
    }

    // does not add a Title because they are different for each entry - does allRolls and quick stats
    addBoxContents(arr, boxHTMLElem) {
        const stats = this.getQuickStats(arr);
        // all rolls
        const allRolls = document.createElement("p");
        allRolls.className = "allRolls";
        allRolls.innerText = `(${arr})`;
        // quick stats
        const statsText = document.createElement("p");
        statsText.className = "quickStats";
        statsText.innerText = `Best: ${stats['highest']} | Worst: ${stats['lowest']} | Average: ${stats['avg']}`;
        boxHTMLElem.append(allRolls, statsText);
    }

    // return a dict with highest, lowest and avg nums from an array
    getQuickStats(arr) {
        const highestNum = Math.max(...arr);
        const lowestNum = Math.min(...arr);
        const avgNum = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
        const d = {
            'highest': highestNum,
            'lowest': lowestNum,
            'avg': avgNum
        }
        return d;
    }

    // extract the title of an attack/damage roll
    // e.g. CROSSBOW, LIGHT: TO HIT => crossbow, light
    extractTitle(s) {
        const colonIndex = s.search(':');
        const newString = s.slice(0, colonIndex).toLowerCase();
        return newString;
    }

    setActiveChar(charName) {
        const validCharNames = ['Alwin', 'Casmenos', 'Dracone', 'Explosion', 'NPCs', 'Glace', 'Ruusk'];
        if (!validCharNames.includes(charName)) { console.error(`Invalid charName: '${charName}' @ setActiveChar`); return false;}
        this.activeChar = charName;
        this.updatePage();
    }

    setNoActiveChar() {
        this.activeChar = null;
        this.updatePage();
    }

    setRollData(rollData, weekName) {
        this.rollData = rollData;
        this.weekName = weekName;
        this.updatePage();
    }
}
const charPage = new CharPage(allRollData, 'The Entire Campaign');

/* Char Buttons */
class charButton {
    constructor(HTMLElem, charName) {
        this.active = false;
        this.HTMLElem = HTMLElem;
        HTMLElem.addEventListener("click", () => {
            const a = this.active;
            makeAllCharButtonsInactive()
            if (a) {
                this.active = false;
                charPage.setNoActiveChar();
            }
            else {
                this.active = true;
                charPage.setActiveChar(charName);
            }
            this.updateButton();
        });
    }

    updateButton() {
        if (this.active) {
            showCharPage();
            this.HTMLElem.className = 'activeCharButton';
        }
        else {
            showGraphPage();
            this.HTMLElem.className = 'charLinks';
        }
    }

    setActive(b) {
        this.active = b;
        this.updateButton();
    }
}

const casmenosButton = new charButton(document.getElementById("casmenosButton"), "Casmenos");
const alwinButton = new charButton(document.getElementById("alwinButton"), 'Alwin');
const explosionButton = new charButton(document.getElementById("explosionButton"), "Explosion");
const draconeButton = new charButton(document.getElementById("draconeButton"), 'Dracone');
const ruuskButton = new charButton(document.getElementById("ruuskButton"), 'Ruusk');
const glaceButton = new charButton(document.getElementById("glaceButton"), "Glace");

// global func to make all buttons inactive
function makeAllCharButtonsInactive() {
    casmenosButton.setActive(false);
    alwinButton.setActive(false);
    explosionButton.setActive(false);
    draconeButton.setActive(false);
    ruuskButton.setActive(false);
    glaceButton.setActive(false);
}