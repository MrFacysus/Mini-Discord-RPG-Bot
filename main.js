const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder  } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent] });
const sharp = require('sharp')
const fs = require('fs')

client.on('ready', () => {
  console.log(`${client.user.tag} booted up!`);
});

client.login('');

// define database class
class Database {
  constructor() {
    // make a list of players
    this.players = [];

    // if a load file exists, load the database from a file
    if (fs.existsSync('database.json')) {
      this.load();
    }
    else{
      // else create a new database
      this.save();
    }
  }

  // add a player to the list
  addPlayer(player) {
    this.players.push(player);
  }

  // get a player from the list by name
  getPlayer(name) {
    return this.players.find(player => player.name === name);
  }

  // save the database to a file
  save() {
    // convert the database to a JSON string
    let json = JSON.stringify(this, null, 2);
    // write the JSON string to a file
    fs.writeFileSync('database.json', json);
  }

  // load the database from a file
  load() {
    // read the JSON string from a file
    let json = fs.readFileSync('database.json');
    // convert the JSON string to a database
    let database = JSON.parse(json);
    // copy the players from the database
    this.players = database.players;
  }
}

// get player Image
async function getImage(player) {
  // save database to a file
  database.save();
  // continue normal
  if (player.name != "Enemy"){
    let mergedImage = await sharp('body.png')
      .composite([{ input: 'hair.png' }])
      .toBuffer();
      // loop through the images array
    for (let i = 0; i < player.inventory.length; i++){
      // merge two images from a directory to a single image
      mergedImage = await sharp(mergedImage)
        .composite([{ input: player.inventory[i] }])
        .toBuffer();
    }
    return mergedImage;
  }
  else{
      let mergedImage = await sharp('skel.png')
      .composite([{ input: 'skel.png' }])
      .toBuffer();
      // loop through the images array
    for (let i = 0; i < player.inventory.length; i++){
      // merge two images from a directory to a single image
      mergedImage = await sharp(mergedImage)
        .composite([{ input: player.inventory[i] }])
        .toBuffer();
    }
    return mergedImage;
  }
}
// define player class
// add a list of eqiupment to the player
// add stats like health and max health, but also ammo and firespeed, but also training which is a list and experience and level and gold
class Player {
  constructor (name) {
    this.name = name;
    this.inventory = [];
    this.health = 100;
    this.maxHealth = 100;
    this.ammo = 100;
    this.fireSpeed = 100;
    this.experience = 0;
    this.level = 1;
    this.training = [];
    this.gold = 0;
    this.walkDist = 0;
    this.enemy = null;

    // attackPower is random from 5 to 35
    this.attackPower = Math.floor(Math.random() * 30) + 5;
    // firespeed is random from 60 to 120
    this.fireSpeed = Math.floor(Math.random() * 60) + 60;
  }
}

function addItem(player, item) {
  player.inventory.push(item);
}
function removeItem(player, item) {
  player.inventory.splice(this.inventory.indexOf(item), 1);
}
function getTotalValue(player) {
  let totalValue = 0;
  player.inventory.forEach(item => {
    totalValue += item.value;
  });
  return totalValue;
}
function levelUp(player) {
  player.training.push({attackPower: Math.floor(Math.random() * 10)});
  player.maxHealth += Math.floor(Math.random() * 10);
  player.level++;
  player.experience = 0;
}
function getDPS(player) {
  return (player.fireSpeed / 60) * player.attackPower;
}
function battle(player, me) {
  if (getDPS(me) > getDPS(player)) {
    me.gold += player.gold;
    me.experience += player.experience;
    player.inventory = [];
    player.health = player.maxHealth;
    player.ammo = player.maxAmmo;
    me.health = me.maxHealth;
    me.ammo = me.maxAmmo;
    player.experience = 0;
    player.gold = 0;

    // if me.experience > level * 100
    if (me.experience > me.level * 25) {
      levelUp(me);
    }

    return me;

  } else {
    player.gold += me.gold;
    player.experience += me.experience;
    me.inventory = [];
    me.health = me.maxHealth;
    me.ammo = me.maxAmmo;
    player.health = player.maxHealth;
    player.ammo = player.maxAmmo;
    me.experience = 0;
    me.gold = 0;

    // if player.experience > level * 100
    if (player.experience > player.level * 100) {
      levelUp(player);
    }

    return player;
  }
}

// define new database
let database = new Database();
let lastChallange = null;
let dropTable = [];

// droptable is every png file in current directory
fs.readdirSync('./').forEach(file => {
  if (file.endsWith('.png')) {
    dropTable.push(file);
  }
});

// define a function to get a player from the database
// if the player doesn't exist, create a new player
async function getPlayer(name) {
  let player = database.getPlayer(name);
  if (!player) {
    player = new Player(name);
    database.addPlayer(player);
    database.save();
  }
  return player;
}

// when discord message created, create drawing class and draw player
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content === 'stats') {
    // get character by authors name from database
    let character = await getPlayer(message.author.username);

    if (character){
      let mergedImage = await getImage(character);
      // using Embed Builder make a embedded message with the character image, and stats
      const embed = new EmbedBuilder()
        .setTitle(character.name)
        .setDescription(`Health: ${character.health} \nMax Health: ${character.maxHealth} \nAmmo: ${character.ammo} \nFire Speed: ${character.fireSpeed} \nExperience: ${character.experience} \nLevel: ${character.level} \nTraining: ${character.training} \nGold: ${character.gold}`)
        .setTimestamp()
        .setColor(0x00AE86);
      
      message.channel.send({ embeds:[embed], files: [mergedImage] });
    }
  }

  // if the message is 'challange' then create an embed message with the stats and image of the character
  if (message.content === 'challange') {
    // get character by authors name from database
    let character = await getPlayer(message.author.username);
    lastChallange = character;

    if (character){
      let mergedImage = await getImage(character);
      // using Embed Builder make a embedded message with the character image, and stats
      const embed = new EmbedBuilder()
        .setTitle(character.name + ' has challanged you to a battle!')
        .setDescription(`Health: ${character.health} \nMax Health: ${character.maxHealth} \nAmmo: ${character.ammo} \nFire Speed: ${character.fireSpeed} \nExperience: ${character.experience} \nLevel: ${character.level} \nTraining: ${character.training} \nGold: ${character.gold}`)
        .setTimestamp()
        .setFooter({text: "Type 'accept' to accept the challange"})
        .setColor(0xEE0000);
      
      message.channel.send({ embeds:[embed], files: [mergedImage] });
    }
  }

  // if the message is 'shop' show all of the items without .png at the end and their price based on index in the droptable
  if (message.content === 'shop') {
    let shop = '';
    for (let i = 0; i < dropTable.length; i++) {
      shop += `${i + 1}. ${dropTable[i].replace('.png', '')} - ${i + 1} gold \n`;
    }
    const embed = new EmbedBuilder()
      .setTitle('Shop')
      .setDescription(shop)
      .setTimestamp()
      .setColor(0x00AE86);
  
    message.channel.send({ embeds:[embed] });
  }

  // if the message is 'buy' then get the item from the droptable and add it to the players inventory
  if (message.content.startsWith('buy')) {
    let item = message.content.split(' ')[1];
    let character = await getPlayer(message.author.username);
    if (character.gold >= item) {
      character.gold -= item;
      addItem(character, dropTable[item - 1]);
      database.save();
      message.channel.send('Item bought!');
    } else {
      message.channel.send('You do not have enough gold!');
    }
  }

  // if the message is 'walk' then increase the player walkcount by 1 and in 10% of chances summon a enemy
  if (message.content === 'walk') {
    // get character by authors name from database
    let character = await getPlayer(message.author.username);

    if (character){
      // if he is dead reset his stats by assigning a new player
      if (character.health <= 0) {
        character = new Player(message.author.username);
        database.addPlayer(character);
        database.save();

      }
      // increase walkcount by 1
      character.walkDist++;
      // show current walkcount and player image
      let mergedImage = await getImage(character);
      const embed = new EmbedBuilder()
        .setTitle(character.name + ' has walked ' + character.walkDist + ' steps')
        .setTimestamp()
        .setColor(0x00AE86);
      
      message.channel.send({ embeds:[embed], files: [mergedImage] });
      // create enemy
      // the enemys health is based on the characters level, and the enemys level is close to the character level based on chance it might be higher or lower
      let enemy = new Player('Enemy');
      enemy.health = character.level * 25;
      enemy.maxHealth = character.level * 25;
      enemy.level = character.level + Math.floor(Math.random() * 3) - 1;
      enemy.experience = Math.abs(Math.floor(Math.random() * character.level) - 1);
      enemy.gold = Math.abs(Math.floor(Math.random() * character.level) - 1);
      enemy.fireSpeed = 100;
      enemy.ammo = 0;
      enemy.maxAmmo = 0;
      enemy.attackPower = 10;
      enemy.inventory = [];
      // enemy inventory has 10% chance to have a item
      if (Math.random() < 0.1) {
        enemy.inventory.push({name: dropTable[Math.floor(Math.random() * dropTable.length)], value: Math.floor(Math.random() * 100)});
      }
      // enemy has 0.5% chance to have a two items
      if (Math.random() < 0.005) {
        enemy.inventory.push({name: dropTable[Math.floor(Math.random() * dropTable.length)], value: Math.floor(Math.random() * 100)});
      }
      // enemy has 0.1% chance to have a three items
      if (Math.random() < 0.001) {
        enemy.inventory.push({name: dropTable[Math.floor(Math.random() * dropTable.length)], value: Math.floor(Math.random() * 100)});
      }
      // 10% chance to spawn enemy
      if (Math.random() < 0.1) {
        // set players enemy to the enemy
        character.enemy = enemy;

        let mergedImage = await getImage(enemy);
        // using Embed Builder make a embedded message with the character image, and stats
        const embed = new EmbedBuilder()
          .setTitle('You have encountered an enemy!')
          .setDescription(`Health: ${enemy.health} \nMax Health: ${enemy.maxHealth} \nAmmo: ${enemy.ammo} \nFire Speed: ${enemy.fireSpeed} \nExperience: ${enemy.experience} \nLevel: ${enemy.level} \nTraining: ${enemy.training} \nGold: ${enemy.gold}`)
          .setTimestamp()
          .setFooter({text: "Type 'attack' to battle the enemy"})
          .setColor(0xEE0000);
        
        message.channel.send({ embeds:[embed], files: [mergedImage] });
      }

      if (character.walkDist % 10 === 0) {
        let x = Math.floor(Math.random() * 5);
        character.gold += x;

        const embed = new EmbedBuilder()
          .setTitle(`You have found ${x} gold!`)
          .setTimestamp()
          .setColor(0x00AE86);
        
        message.channel.send({ embeds:[embed] });
      }
    }
  }

  // if the message is 'leaderboard' show highest level leader
  if (message.content === 'leaderboard') {
    // get character by authors name from database
    let players = database.players;
    let highestLevel = 0;
    let highestLevelPlayer = null;
    players.forEach(player => {
      if (player.level > highestLevel) {
        highestLevel = player.level;
        highestLevelPlayer = player;
      }
    });

    if (highestLevelPlayer){
      let mergedImage = await getImage(highestLevelPlayer);
      // using Embed Builder make a embedded message with the character image, and stats
      const embed = new EmbedBuilder()
        .setTitle(highestLevelPlayer.name)
        .setDescription(`Health: ${highestLevelPlayer.health} \nMax Health: ${highestLevelPlayer.maxHealth} \nAmmo: ${highestLevelPlayer.ammo} \nFire Speed: ${highestLevelPlayer.fireSpeed} \nExperience: ${highestLevelPlayer.experience} \nLevel: ${highestLevelPlayer.level} \nTraining: ${highestLevelPlayer.training} \nGold: ${highestLevelPlayer.gold}`)
        .setTimestamp()
        .setColor(0x000000);

      message.channel.send({ embeds:[embed], files: [mergedImage] });
    }
  }
  // if message is 'attack' then attack the enemy
  if (message.content === 'attack') {
    // battle the character and the enemy
    let character = await getPlayer(message.author.username);
    if (character){
      let enemy = character.enemy;
      if (enemy) {
        // get the damage the character does
        let damage = character.attackPower;
        // get the damage the enemy does
        let enemyDamage = enemy.attackPower;
        // decrease the enemy health by the damage
        enemy.health -= damage;
        // decrease the character health by the enemy damage
        character.health -= enemyDamage;
        // if the enemy health is less than 0 then the enemy is dead
        if (enemy.health <= 0) {
          // increase the characters experience by the enemies experience
          character.experience += enemy.experience;
          // increase the characters gold by the enemies gold
          character.gold += enemy.gold;
          // increase the characters level by 1 if the characters experience is more than 100
          if (character.experience >= 100) {
            character.level++;
            character.experience = 0;
          }
          // set the characters enemy to null
          character.enemy = null;

          const embed = new EmbedBuilder()
            .setTitle(`You have killed the enemy!`)
            .setTimestamp()
            .setColor(0x00AE86);
          
          message.channel.send({ embeds:[embed] });
        } else {
          // if the character health is less than 0 then the character is dead
          if (character.health <= 0) {
            // set the characters enemy to null
            character.enemy = null;
            // set the characters health to 0
            character.health = 0;

            const embed = new EmbedBuilder()
              .setTitle(`You have died!`)
              .setTimestamp()
              .setColor(0x00AE86);
            
            message.channel.send({ embeds:[embed] });
          } else {
            // if the enemy is not dead and the character is not dead then show the current health of the enemy and the character
            let mergedImage = await getImage(character);
            const embed = new EmbedBuilder()
              .setTitle('You have attacked the enemy!')
              .setDescription(`Health: ${character.health} \nMax Health: ${character.maxHealth} \nAmmo: ${character.ammo} \nFire Speed: ${character.fireSpeed} \nExperience: ${character.experience} \nLevel: ${character.level} \nTraining: ${character.training} \nGold: ${character.gold}`)
              .setTimestamp()
              .setColor(0x000000);

            message.channel.send({ embeds:[embed], files: [mergedImage] });

            let mergedImage2 = await getImage(enemy);
            const embed2 = new EmbedBuilder()
              .setTitle('The enemy has attacked you!')
              .setDescription(`Health: ${enemy.health} \nMax Health: ${enemy.maxHealth} \nAmmo: ${enemy.ammo} \nFire Speed: ${enemy.fireSpeed} \nExperience: ${enemy.experience} \nLevel: ${enemy.level} \nTraining: ${enemy.training} \nGold: ${enemy.gold}`)
              .setTimestamp()
              .setColor(0xEE0000);

            message.channel.send({ embeds:[embed2], files: [mergedImage2] });
          }
        }
      }
    }
  }
            
  // if the message is 'accept' then battle the author and the person who challanged them
  if (message.content === 'accept') {
    // get character by authors name from database
    let character = await getPlayer(message.author.username);

    if (character){
      // battle the two out and show the winner with the remaining health. And show gold with a green color
      let winner = battle(lastChallange, character);
      let mergedImage = await getImage(winner);
      // using Embed Builder make a embedded message with the character image, and stats
      const embed = new EmbedBuilder()
        .setTitle(winner.name + ' has won the battle!')
        .setDescription(`Health: ${winner.health} \nMax Health: ${winner.maxHealth} \nAmmo: ${winner.ammo} \nFire Speed: ${winner.fireSpeed} \nExperience: ${winner.experience} \nLevel: ${winner.level} \nTraining: ${winner.training} \nGold: ${winner.gold}`)
        .setTimestamp()
        .setColor(0xBBBB00)
        .setFooter({text: "Type 'stats' to see your stats"});
      
      message.channel.send({ embeds:[embed], files: [mergedImage] });
    }
  }
});
