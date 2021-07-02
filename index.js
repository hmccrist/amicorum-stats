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
        this.playerData = {
            'colour': colour,
            'totalRolls': 0,
            'nat20s': 0,
            'nat1s': 0,
            'allD20Rolls': [],
            'avgRoll': 0,
            'attackRolls': 0,
            'dmgRolls': 0,
            'dmgDoneTotal': 0,
            'attackRollsDict': {},          // key = title | value(s) = rollShort
            'dmgRollsDict': {}
        };
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

    addAttackRoll(rollTitle, rollResult) {
        if (!(rollTitle in this.playerData.attackRollsDict)) {
            this.playerData.attackRollsDict[rollTitle] = [rollResult];
        }
        else {
            this.playerData.attackRollsDict[rollTitle].push(rollResult);
        }
    }

    addDmgRoll(rollTitle, rollResult) {
        if (!(rollTitle in this.playerData.dmgRollsDict)) {
            this.playerData.dmgRollsDict[rollTitle] = [rollResult];
        }
        else {
            this.playerData.dmgRollsDict[rollTitle].push(rollResult);
        }
    }

    combineData(newPlayerData) {
        this.playerData['totalRolls'] += newPlayerData['totalRolls'];
        this.playerData['nat20s'] += newPlayerData['nat20s'];
        this.playerData['nat1s'] += newPlayerData['nat1s'];
        this.playerData['allD20Rolls'] = this.playerData['allD20Rolls'].concat(newPlayerData['allD20Rolls']);
        this.playerData['dmgDoneTotal'] += newPlayerData['dmgDoneTotal'];
        this.playerData['attackRolls'] += newPlayerData['attackRolls'];
        // attackRollsDict
        for (let key in newPlayerData['attackRollsDict']) {
            for (let i in newPlayerData['attackRollsDict'][key]) {
                const rollResult = newPlayerData['attackRollsDict'][key][i];
                const rollTitle = key;
                this.addAttackRoll(rollTitle, rollResult);
            }
        }
        // dmgRollsDict
        for (let key in newPlayerData['dmgRollsDict']) {
            for (let i in newPlayerData['dmgRollsDict'][key]) {
                const rollResult = newPlayerData['dmgRollsDict'][key][i];
                const rollTitle = key;
                this.addDmgRoll(rollTitle, rollResult);
            }
        }
        this.calculateAvg();
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
        // calculate averages for chars after all data is collected
        for (let char in this.data) {
            this.data[char].calculateAvg();
        }
    }

    // Updates an entry in this.data with a roll from rawData
    updateData(roll) {
        const nameConversion = {
            [casmenosFullName]: 'Casmenos',
            [alwinFullName]: 'Alwin',
            [explosionFullName]: 'Explosion',
            [draconeFullName]: 'Dracone',
            [ruuskFullName]: 'Ruusk'
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
            this.data[name].addDmgRoll(roll['title'], parseInt(roll['rollShort']));
        }
        
        // Check if the roll is an Attack roll
        matchResult = roll['title'].match('TO HIT');
        if (matchResult) {
            //console.log(`${roll['sender']}: ${roll['title']}: ${roll['rollShort']}`);
            this.data[name].playerData['attackRolls'] += 1;
            this.data[name].addAttackRoll(roll['title'], parseInt(roll['rollShort']));      // todo: if natroll is 1 then just add 1. (no modifiers)
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

// easiest way to do this (probably not the best...)
const allRollData = new RollData(week1Data);
allRollData.combineRollData(week2RollData);
allRollData.combineRollData(week3RollData);
allRollData.combineRollData(week4RollData);

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
        const allWeaponAttacks = pData.playerData.attackRollsDict;
        for (let key in allWeaponAttacks) {
            const attackType = this.extractTitle(key);
            const allAttackResults = allWeaponAttacks[key];
            const bestHit = Math.max(...allAttackResults);
            const worstHit = Math.min(...allAttackResults);
            const avgHit = Math.round(allAttackResults.reduce((a, b) => a + b, 0) / allAttackResults.length);
            // new attack title
            const newAtkTitle = document.createElement("h4");
            newAtkTitle.innerText = `${allAttackResults.length}x ${attackType}`;
            this.charAttackedBox.appendChild(newAtkTitle);
            // all rolls
            const allRolls = document.createElement("p");
            allRolls.className = "allRolls";
            allRolls.innerText = `(${allAttackResults})`;
            this.charAttackedBox.appendChild(allRolls);
            // new attack quick stats
            const atkStats = document.createElement("p");
            atkStats.className = "quickStats";
            atkStats.innerText = `Best Hit: ${bestHit} | Worst Hit: ${worstHit} | Average Hit: ${avgHit}`;
            this.charAttackedBox.appendChild(atkStats);
        }

        // Damage Box   - mostly the same as Attacked Box
        this.charDamageBox.innerHTML = '';
        // title
        const damageTitle = document.createElement("h3");
        damageTitle.innerText = `${this.activeChar} Dealt ${pData.playerData.dmgDoneTotal} Damage`;
        this.charDamageBox.appendChild(damageTitle);
        // damage specifics
        const allDamageDone = pData.playerData.dmgRollsDict;
        for (let key in allDamageDone) {
            const dmgType = this.extractTitle(key);
            const allDmgResults = allDamageDone[key];
            const bestDmg = Math.max(...allDmgResults);
            const worstDmg = Math.min(...allDmgResults)
            const allDmg = allDmgResults.reduce((a, b) => a + b, 0);
            const avgDmg = Math.round(allDmgResults.reduce((a, b) => a + b, 0) / allDmgResults.length);
            // new dmg title
            const newDmgTitle = document.createElement("h4");
            newDmgTitle.innerText = `${allDmg} from ${dmgType}`;
            this.charDamageBox.appendChild(newDmgTitle);
            // all rolls
            const allDmgRolls = document.createElement("p");
            allDmgRolls.className = "allRolls";
            allDmgRolls.innerText = `(${allDmgResults})`;
            this.charDamageBox.appendChild(allDmgRolls);
            // new dmg quick stats
            const dmgStats = document.createElement("p");
            dmgStats.className = "quickStats";
            dmgStats.innerText = `Best Damage: ${bestDmg} | Worst Damage: ${worstDmg} | Average Damage: ${avgDmg}`;
            this.charDamageBox.appendChild(dmgStats);
        }

    }

    // extract the title of an attack/damage roll
    // e.g. CROSSBOW, LIGHT: TO HIT => crossbow, light
    extractTitle(s) {
        const colonIndex = s.search(':');
        const newString = s.slice(0, colonIndex).toLowerCase();
        return newString;
    }

    setActiveChar(charName) {
        const validCharNames = ['Alwin', 'Casmenos', 'Dracone', 'Explosion', 'NPCs', 'Ruusk'];
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

// global func to make all buttons inactive
function makeAllCharButtonsInactive() {
    casmenosButton.setActive(false);
    alwinButton.setActive(false);
    explosionButton.setActive(false);
    draconeButton.setActive(false);
    ruuskButton.setActive(false);
}