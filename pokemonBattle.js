const pokedex = require("./pokemon_data/pokedex.json");
const types = require("./pokemon_data/types.json");

class Pokemon {
  // Insert your code here
  attack(moveIndex, enemy) {
    const move = this.moves[moveIndex];
    const miss = Math.random() * 100 > move.accuracy;
    const crit = Math.random() < .05;
    const A = this.getAttackStat(move.special);
    const D = enemy.getDefenseStat(move.special);
    const typeMultiplier = enemy.types.reduce((multiplier, type) => {
      if (Pokemon.immunes(type).includes(move.type)) return 0;
      if (Pokemon.weaknesses(type).includes(move.type)) return multiplier * 2;
      if (Pokemon.strengths(type).includes(move.type)) return multiplier / 2;
      return multiplier;
    }, 1);

    const damage = miss ? 0 : (crit ? 2 : 1) * (move.power * (A/D) * typeMultiplier) / 3;
    enemy.damageTaken = Math.min(enemy.damageTaken + damage, enemy.stats.HP);

    const results = []
    if (miss) results.push("It missed.");
    else {
      if (typeMultiplier === 0)  results.push(`${enemy.name} is immune to ${move.type} attacks.`);
      else {
        if (crit)  results.push("A critical hit!");
        if (typeMultiplier > 1)  results.push("It's super effective.");
        if (typeMultiplier < 1)  results.push("It wasn't very effective.");
      }
    }
    return results.length ? results.join(" ") : "It's a hit!";
  }
}

class Battle {
  // Insert your code here
  battleAreaToString() {
    const enemyHealthBarLength = Math.ceil(10 * ((this.enemyPokemon.stats.HP - this.enemyPokemon.damageTaken) / this.enemyPokemon.stats.HP));
    const allyHealthBarLength = Math.ceil(10 * ((this.allyPokemon.stats.HP - this.allyPokemon.damageTaken) / this.allyPokemon.stats.HP));

    const allyHealthBar = this.health.repeat(allyHealthBarLength) + this.missingHealth.repeat(10 - allyHealthBarLength);
    const enemyHealthBar = this.health.repeat(enemyHealthBarLength) + this.missingHealth.repeat(10 - enemyHealthBarLength);
    const battleAreaString = `${this.enemyPokemon.name + " ".repeat(25 - this.enemyPokemon.name.length)}
${enemyHealthBar + " ".repeat(15 - this.enemyPokemon.avatar.length) + this.enemyPokemon.avatar}

${" ".repeat(25 - this.allyPokemon.name.length) + this.allyPokemon.name}
${this.allyPokemon.avatar + " ".repeat(15 - this.allyPokemon.avatar.length) + allyHealthBar}`;
  
    return battleAreaString;
  }

  menuToString(options) {
    const option1 = options[0] ? `1 ${options[0]}${" ".repeat(12 - options[0].length)} ` : " ".repeat(15);
    const option2 = options[1] ? `2 ${options[1]}${" ".repeat(12 - options[1].length)} ` : " ".repeat(15);
    const option3 = options[2] ? `3 ${options[2]}${" ".repeat(12 - options[2].length)} ` : " ".repeat(15);
    const option4 = options[3] ? `4 ${options[3]}${" ".repeat(12 - options[3].length)} ` : " ".repeat(15);
    return `+---------------------------------+
| ${option1}| ${option3}|
| ${option2}| ${option4}|
+---------------------------------+`;
  }

  messageInMenuToString(message) {
    let line1Overflow = false;
    let line1 = "";
    let line2 = "";

    message.split(" ").forEach(word => {
      if (line1.length + word.length > 32) {
        line1Overflow = true;
      }
      if (line1Overflow) line2 += " " + word;
      else line1 += " " + word;
    });

    line1 = line1.trim();
    line2 = line2.trim();

    return `+---------------------------------+
|${line1 + " ".repeat(33-line1.length)}|
|${line2 + " ".repeat(33-line2.length)}|
+---------------------------------+`;
  }
}

function randomBattle() {
  const allyPokemonId = Math.floor(Math.random() * 809) + 1;
  const enemyPokemonId = Math.floor(Math.random() * 809) + 1;
  const ally = new Pokemon(allyPokemonId);
  const enemy =  new Pokemon(enemyPokemonId);

  const battle = new Battle(ally, enemy);

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  promptForMove();

  function promptForMove() {
    console.clear();
    console.log(battle.battleAreaToString());
    console.log(battle.menuToString(ally.moveNames()));
    readline.question("enter the number for your attack\n", handleUserInput);
  }

  function performAttack(moveIndex) {
    
    typeWriterEffect(battle, `${ally.name} used ${ally.moves[moveIndex].name}.`, () => {
      const attackResult = ally.attack(moveIndex, enemy);
      if (enemy.damageTaken >= enemy.stats.HP) {
        typeWriterEffect(battle, "VICTORY! 😎", () => readline.close());
      }
      else {
        typeWriterEffect(battle, attackResult, performEnemyAttack, 750)
      }
    }, 100);
  }

  function performEnemyAttack() {
    const enemyMoveIndex = Math.floor(Math.random() * enemy.moves.length);
    typeWriterEffect(battle, `${enemy.name} used ${enemy.moveNames()[enemyMoveIndex]}.`, () => {

      const enemyAttackResult = enemy.attack(enemyMoveIndex, ally);
      setTimeout(() => {
        if (ally.damageTaken >= ally.stats.HP) {
          typeWriterEffect(battle, "Defeat 😔", () => readline.close());
        }
        else {
          typeWriterEffect(battle, enemyAttackResult, promptForMove, 750);
        }
      }, 100);
    });
  }

  function handleUserInput(input) {
    const moveIndex = Number(input) - 1;
    if (![0,1,2,3].includes(moveIndex)) {
      typeWriterEffect(battle, "Invalid input....", promptForMove);
    }
    else {
      performAttack(moveIndex);
    }
  }
}

function typeWriterEffect(battle, message, callback, callbackDelay = 0, i = 0) {
  if (i <= message.length) {
    setTimeout(() => {
      console.clear();
      console.log(battle.battleAreaToString());
      console.log(battle.messageInMenuToString(message.slice(0, i)));
      typeWriterEffect(battle, message, callback, callbackDelay, i+1);
    }, 80);
  } else {
    setTimeout(callback, callbackDelay);
  }
}

randomBattle();