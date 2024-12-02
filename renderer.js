// renderer.js
const fs = require('fs');
const { Client, Intents, Permissions } = require('discord.js-selfbot-v13');

// Variables pour stocker les clients et les tokens
let clients = []; // Tableau pour stocker les instances de clients Discord
let tokens = []; // Tableau pour stocker tous les tokens
let validTokens = []; // Tableau pour stocker les tokens valides

// Fonction pour afficher les logs dans la console intégrée avec émojis
function logMessage(message) {
  const consoleElement = document.getElementById('console');
  const timestamp = new Date().toLocaleTimeString();
  consoleElement.value += `🕒 [${timestamp}] ${message}\n`;
  consoleElement.scrollTop = consoleElement.scrollHeight;
}

// Fonction pour vérifier un seul token
async function verifySingleToken(token) {
  const tempClient = new Client({
    checkUpdate: false,
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
    partials: ['CHANNEL'],
  });

  try {
    await tempClient.login(token);
    logMessage(`✔️ Token valide : ${tempClient.user.tag}`);
    validTokens.push(token);
    addAccountToList(tempClient.user.tag, token);
    tempClient.destroy();
  } catch (err) {
    logMessage(`❌ Token invalide : ${token}`);
  }
}

// Fonction pour charger les tokens depuis un fichier
async function loadTokens() {
  const filePath = await window.electron.openFileDialog();
  if (filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const fileTokens = data.split(/\r?\n/).filter(line => line.trim() !== '');
      tokens = tokens.concat(fileTokens);
      logMessage(`📂 Chargement des tokens depuis : ${filePath}`);

      // Vérifier la validité des tokens chargés
      for (const token of fileTokens) {
        if (!validTokens.includes(token)) { // Éviter de vérifier les tokens déjà valides
          await verifySingleToken(token);
        }
      }

      // Mettre à jour le compteur de tokens valides
      document.getElementById('verifiedTokenCount').innerText = `Tokens valides : ${validTokens.length}`;
    } catch (err) {
      logMessage(`❌ Erreur en lisant le fichier : ${err.message}`);
    }
  } else {
    logMessage('📁 Chargement des tokens annulé.');
  }
}

// Fonction pour vérifier les tokens manuellement entrés
async function verifyTokens() {
  const manualTokensText = document.getElementById('manualTokens').value.trim();
  if (!manualTokensText) {
    alert('Veuillez entrer au moins un token.');
    return;
  }

  const manualTokens = manualTokensText.split(/\r?\n/).filter(line => line.trim() !== '');
  const newTokens = manualTokens.filter(token => !tokens.includes(token)); // Éviter les doublons
  tokens = tokens.concat(newTokens);
  logMessage(`✅ Ajout de ${newTokens.length} tokens manuellement.`);

  // Vérifier la validité des tokens
  for (const token of newTokens) {
    await verifySingleToken(token);
  }

  // Mettre à jour le compteur de tokens valides
  document.getElementById('verifiedTokenCount').innerText = `Tokens valides : ${validTokens.length}`;

  // Enregistrer les tokens valides dans un fichier pour les futures utilisations
  if (validTokens.length > 0) {
    fs.writeFileSync('./valid_tokens.txt', validTokens.join('\n'), 'utf8');
    logMessage(`💾 Enregistrement des tokens valides dans valid_tokens.txt`);
  }
}

// Fonction pour initialiser tous les clients Discord avec les tokens valides sélectionnés
function initializeClients() {
  const selectedTokens = getSelectedTokens();
  if (selectedTokens.length === 0) {
    alert('Aucun compte sélectionné. Veuillez sélectionner au moins un compte.');
    logMessage('⚠️ Aucun compte sélectionné pour initialiser.');
    return;
  }

  selectedTokens.forEach((token, index) => {
    const client = new Client({
      checkUpdate: false,
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
      partials: ['CHANNEL'],
    });

    client.on('ready', () => {
      logMessage(`🔓 Compte ${client.user.tag} connecté.`);
    });

    client.on('error', (error) => {
      logMessage(`⚠️ Erreur pour le compte ${client.user.tag} : ${error.message}`);
    });

    client.login(token).then(() => {
      clients.push(client);
      logMessage(`🔗 Compte ${client.user.tag} ajouté aux clients actifs.`);
    }).catch(err => {
      logMessage(`❌ Erreur de connexion pour un token : ${err.message}`);
    });
  });
}

// Fonction pour ajouter un compte à la liste des comptes vérifiés avec une case à cocher
function addAccountToList(username, token) {
  const accountsList = document.getElementById('accountsList');

  // Vérifier si le compte est déjà listé
  const existing = Array.from(accountsList.children).find(child => child.querySelector('span').innerText === username);
  if (existing) {
    return; // Ne pas ajouter de doublons
  }

  const accountItem = document.createElement('div');
  accountItem.className = 'account-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = token;
  checkbox.checked = true; // Sélectionné par défaut

  const label = document.createElement('span');
  label.innerText = username;

  accountItem.appendChild(checkbox);
  accountItem.appendChild(label);
  accountsList.appendChild(accountItem);
}

// Fonction pour récupérer les tokens des comptes sélectionnés
function getSelectedTokens() {
  const checkboxes = document.querySelectorAll('#accountsList input[type="checkbox"]');
  const selectedTokens = [];
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedTokens.push(checkbox.value);
    }
  });
  return selectedTokens;
}

// Fonction pour sélectionner tous les comptes
function selectAllAccounts() {
  const checkboxes = document.querySelectorAll('#accountsList input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  logMessage('✅ Tous les comptes ont été sélectionnés.');
}

// Fonction pour désélectionner tous les comptes
function deselectAllAccounts() {
  const checkboxes = document.querySelectorAll('#accountsList input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  logMessage('❌ Tous les comptes ont été désélectionnés.');
}

// Fonction pour charger les tokens valides au démarrage
async function loadValidTokens() {
  if (fs.existsSync('./valid_tokens.txt')) {
    try {
      const data = fs.readFileSync('./valid_tokens.txt', 'utf8');
      const fileTokens = data.split(/\r?\n/).filter(line => line.trim() !== '');
      logMessage(`📁 Chargement des tokens valides depuis : valid_tokens.txt`);

      // Vérifier les tokens valides et ajouter les comptes à la liste
      for (const token of fileTokens) {
        if (!validTokens.includes(token)) { // Éviter de vérifier les tokens déjà valides
          await verifySingleToken(token);
        }
      }

      // Mettre à jour le compteur de tokens valides
      document.getElementById('verifiedTokenCount').innerText = `Tokens valides : ${validTokens.length}`;
    } catch (err) {
      logMessage(`⚠️ Erreur en lisant valid_tokens.txt : ${err.message}`);
    }
  } else {
    logMessage('📁 Aucun fichier valid_tokens.txt trouvé.');
  }
}

// Fonction pour rejoindre un serveur via un lien d'invitation
async function joinServer() {
  const inviteLink = document.getElementById('inviteLink').value.trim();
  if (!inviteLink) {
    alert('Veuillez entrer le lien d\'invitation du serveur.');
    return;
  }

  // Extraire le code d'invitation du lien
  const inviteCodeMatch = inviteLink.match(/(?:https?:\/\/)?(?:www\.)?discord\.gg\/([a-zA-Z0-9]+)/);
  if (!inviteCodeMatch) {
    alert('🔗 Lien d\'invitation invalide.');
    logMessage('❌ Lien d\'invitation invalide.');
    return;
  }
  const inviteCode = inviteCodeMatch[1];

  logMessage(`🔗 Tentative de rejoindre le serveur avec le lien : ${inviteLink}`);

  const selectedTokens = getSelectedTokens();
  if (selectedTokens.length === 0) {
    alert('Aucun compte sélectionné. Veuillez sélectionner au moins un compte.');
    logMessage('⚠️ Aucun compte sélectionné pour rejoindre le serveur.');
    return;
  }

  selectedTokens.forEach(async (clientToken) => {
    const client = new Client({
      checkUpdate: false,
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
      partials: ['CHANNEL'],
    });

    try {
      await client.login(clientToken);
      const guild = await client.acceptInvite(inviteCode);
      logMessage(`✅ Compte ${client.user.tag} a rejoint le serveur : ${guild.name}.`);
    } catch (err) {
      logMessage(`❌ Compte avec le token ${clientToken.slice(0, 10)}... ne peut pas rejoindre le serveur : ${err.message}`);
    } finally {
      client.destroy(); // Déconnecter après l'action
    }
  });
}

// Fonction pour envoyer des messages privés
async function sendPrivateMessages() {
  const userId = document.getElementById('userId').value.trim();
  const message = document.getElementById('pmMessage').value.trim();

  if (!userId || !message) {
    alert('Veuillez entrer l\'ID de l\'utilisateur et le message.');
    return;
  }

  logMessage(`✉️ Tentative d'envoi de message privé à l'utilisateur ID : ${userId}`);

  const selectedTokens = getSelectedTokens();
  if (selectedTokens.length === 0) {
    alert('Aucun compte sélectionné. Veuillez sélectionner au moins un compte.');
    logMessage('⚠️ Aucun compte sélectionné pour envoyer des messages privés.');
    return;
  }

  selectedTokens.forEach(async (clientToken) => {
    const client = new Client({
      checkUpdate: false,
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
      partials: ['CHANNEL'],
    });

    try {
      await client.login(clientToken);
      const user = await client.users.fetch(userId);
      await user.send(message);
      logMessage(`✅ Message envoyé à ${user.tag} par ${client.user.tag}.`);
    } catch (err) {
      logMessage(`❌ Erreur en envoyant le message à l'utilisateur ID ${userId} par un compte : ${err.message}`);
    } finally {
      client.destroy(); // Déconnecter après l'action
    }
  });
}

// Fonction pour envoyer des messages dans un salon spécifique
async function sendServerMessages() {
  const serverId = document.getElementById('messageServerId').value.trim();
  const channelId = document.getElementById('messageChannelId').value.trim();
  const message = document.getElementById('serverMessage').value.trim();

  if (!serverId || !channelId || !message) {
    alert('Veuillez entrer l\'ID du serveur, l\'ID du salon et le message.');
    return;
  }

  logMessage(`📤 Tentative d'envoi de message dans le salon ID : ${channelId} du serveur ID : ${serverId}`);

  const selectedTokens = getSelectedTokens();
  if (selectedTokens.length === 0) {
    alert('Aucun compte sélectionné. Veuillez sélectionner au moins un compte.');
    logMessage('⚠️ Aucun compte sélectionné pour envoyer des messages sur le serveur.');
    return;
  }

  selectedTokens.forEach(async (clientToken) => {
    const client = new Client({
      checkUpdate: false,
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
      partials: ['CHANNEL'],
    });

    try {
      await client.login(clientToken);
      const channel = await client.channels.fetch(channelId);
      if (channel.type === 'GUILD_TEXT') {
        await channel.send(message);
        logMessage(`✅ Message envoyé dans #${channel.name} par ${client.user.tag}.`);
      } else {
        logMessage(`❌ Le salon avec l'ID ${channelId} n'est pas un salon texte.`);
      }
    } catch (err) {
      logMessage(`❌ Erreur en envoyant le message dans le salon ID ${channelId} par un compte : ${err.message}`);
    } finally {
      client.destroy(); // Déconnecter après l'action
    }
  });
}

// Fonction pour envoyer une demande d'amitié
async function sendFriendRequest() {
  const friendUserId = document.getElementById('friendUserId').value.trim();

  if (!friendUserId) {
    alert('Veuillez entrer l\'ID de l\'utilisateur.');
    return;
  }

  logMessage(`🤝 Tentative d'envoi de demande d'amitié à l'utilisateur ID : ${friendUserId}`);

  const selectedTokens = getSelectedTokens();
  if (selectedTokens.length === 0) {
    alert('Aucun compte sélectionné. Veuillez sélectionner au moins un compte.');
    logMessage('⚠️ Aucun compte sélectionné pour envoyer des demandes d\'amitié.');
    return;
  }

  selectedTokens.forEach(async (clientToken) => {
    const client = new Client({
      checkUpdate: false,
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
      partials: ['CHANNEL'],
    });

    try {
      await client.login(clientToken);
      const user = await client.users.fetch(friendUserId);
      await user.sendFriendRequest(); // Méthode hypothétique
      logMessage(`✅ Demande d'amitié envoyée à ${user.tag} par ${client.user.tag}.`);
    } catch (err) {
      logMessage(`❌ Erreur en envoyant la demande d'amitié à l'utilisateur ID ${friendUserId} par un compte : ${err.message}`);
    } finally {
      client.destroy(); // Déconnecter après l'action
    }
  });
}

// Fonction pour changer l'onglet actif
function switchTab(section) {
  // Désactiver tous les onglets
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));

  // Désactiver tous les contenus
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => content.classList.remove('active'));

  // Activer l'onglet sélectionné
  const activeTabButton = document.querySelector(`.tab-btn[data-tab="${section}"]`);
  const activeTabContent = document.getElementById(section);

  if (activeTabButton && activeTabContent) {
    activeTabButton.classList.add('active');
    activeTabContent.classList.add('active');
    logMessage(`📂 Changement vers l'onglet : ${section}`);
  } else {
    logMessage(`⚠️ Onglet ou contenu introuvable pour : ${section}`);
  }
}

// Gestion des clics sur les boutons de menu latéral et les onglets
function setupMenuAndTabs() {
  // Gestion des clics sur les boutons de menu latéral
  const menuButtons = document.querySelectorAll('.menu-btn');
  menuButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      switchTab(section);
    });
  });

  // Gestion des clics sur les onglets
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

// Fonction pour gérer les boutons de contrôle de fenêtre
function setupWindowControls() {
  document.getElementById('minimize-btn').addEventListener('click', () => {
    window.electron.minimizeWindow();
  });

  document.getElementById('maximize-btn').addEventListener('click', () => {
    window.electron.maximizeWindow();
  });

  document.getElementById('close-btn').addEventListener('click', () => {
    window.electron.closeWindow();
  });
}

// Fonction pour gérer les événements des boutons d'action
function setupActionButtons() {
  document.getElementById('verifyTokensBtn').addEventListener('click', verifyTokens);
  document.getElementById('loadTokensBtn').addEventListener('click', loadTokens);
  document.getElementById('initializeBtn').addEventListener('click', initializeClients);
  document.getElementById('joinServerBtn').addEventListener('click', joinServer);
  document.getElementById('sendPMBtn').addEventListener('click', sendPrivateMessages);
  document.getElementById('sendServerMsgBtn').addEventListener('click', sendServerMessages);
  document.getElementById('sendFriendRequestBtn').addEventListener('click', sendFriendRequest); // Nouveau bouton

  // Boutons de sélection des comptes
  document.getElementById('selectAllBtn').addEventListener('click', selectAllAccounts);
  document.getElementById('deselectAllBtn').addEventListener('click', deselectAllAccounts);
}

// Charger les tokens valides au démarrage
async function loadAllTokens() {
  await loadValidTokens();
}

// Initialiser toutes les configurations après le chargement du DOM
window.addEventListener('DOMContentLoaded', () => {
  setupMenuAndTabs();
  setupWindowControls();
  setupActionButtons();
  loadAllTokens();
});
