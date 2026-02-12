// Script de test de l'API Easy Portal
// Usage: node test-api.js

const API_URL = 'http://localhost:3000/api';

// Fonction helper pour les requêtes
async function request(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Erreur:', error.message);
    return null;
  }
}

// Tests
async function runTests() {
  console.log('🧪 Tests de l\'API Easy Portal\n');

  let adminToken = null;
  let userToken = null;

  // Test 1: Connexion admin
  console.log('1️⃣  Test connexion admin...');
  const loginAdmin = await request('POST', '/auth/login/admin', {
    email: 'admin@easyportal.com',
    password: 'admin123'
  });
  
  if (loginAdmin && loginAdmin.data.success) {
    adminToken = loginAdmin.data.data.token;
    console.log('✅ Connexion admin réussie');
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);
  } else {
    console.log('❌ Échec connexion admin');
  }
  console.log('');

  // Test 2: Connexion utilisateur
  console.log('2️⃣  Test connexion utilisateur...');
  const loginUser = await request('POST', '/auth/login/user', {
    email: 'alice.durand@test.com',
    password: 'user123'
  });
  
  if (loginUser && loginUser.data.success) {
    userToken = loginUser.data.data.token;
    console.log('✅ Connexion utilisateur réussie');
  } else {
    console.log('❌ Échec connexion utilisateur');
  }
  console.log('');

  // Test 3: Vérifier une plaque autorisée
  console.log('3️⃣  Test vérification plaque autorisée...');
  const verifyPlaque = await request('POST', '/plaques/verify', {
    numero: 'AB-123-CD'
  });
  
  if (verifyPlaque && verifyPlaque.data.authorized) {
    console.log('✅ Plaque autorisée détectée');
  } else {
    console.log('❌ Échec vérification plaque');
  }
  console.log('');

  // Test 4: Vérifier une plaque non autorisée
  console.log('4️⃣  Test vérification plaque non autorisée...');
  const verifyInvalidPlaque = await request('POST', '/plaques/verify', {
    numero: 'XX-999-XX'
  });
  
  if (verifyInvalidPlaque && !verifyInvalidPlaque.data.authorized) {
    console.log('✅ Plaque refusée correctement');
  } else {
    console.log('❌ Erreur vérification plaque');
  }
  console.log('');

  // Test 5: Ouverture du portail (utilisateur)
  console.log('5️⃣  Test ouverture portail (utilisateur)...');
  const openPortalUser = await request('POST', '/portal/open', {
    reason: 'Test API'
  }, userToken);
  
  if (openPortalUser && openPortalUser.data.success) {
    console.log('✅ Portail ouvert par utilisateur');
  } else {
    console.log('❌ Échec ouverture portail');
  }
  console.log('');

  // Test 6: Obtenir toutes les plaques (admin)
  console.log('6️⃣  Test récupération plaques (admin)...');
  const getPlaques = await request('GET', '/plaques', null, adminToken);
  
  if (getPlaques && getPlaques.data.success) {
    console.log(`✅ ${getPlaques.data.data.length} plaques récupérées`);
  } else {
    console.log('❌ Échec récupération plaques');
  }
  console.log('');

  // Test 7: Obtenir les logs (admin)
  console.log('7️⃣  Test récupération logs (admin)...');
  const getLogs = await request('GET', '/logs?limit=5', null, adminToken);
  
  if (getLogs && getLogs.data.success) {
    console.log(`✅ ${getLogs.data.data.logs.length} logs récupérés`);
  } else {
    console.log('❌ Échec récupération logs');
  }
  console.log('');

  // Test 8: Obtenir les statistiques (admin)
  console.log('8️⃣  Test statistiques (admin)...');
  const getStats = await request('GET', '/logs/stats?period=today', null, adminToken);
  
  if (getStats && getStats.data.success) {
    const stats = getStats.data.data.general;
    console.log('✅ Statistiques récupérées:');
    console.log(`   - Total logs: ${stats.total_logs}`);
    console.log(`   - Ouvertures auto: ${stats.ouvertures_auto}`);
    console.log(`   - Ouvertures manuelles: ${stats.ouvertures_manuelles}`);
    console.log(`   - Accès refusés: ${stats.acces_refuses}`);
  } else {
    console.log('❌ Échec récupération statistiques');
  }
  console.log('');

  // Test 9: Profil utilisateur
  console.log('9️⃣  Test récupération profil...');
  const getProfile = await request('GET', '/users/me', null, userToken);
  
  if (getProfile && getProfile.data.success) {
    console.log('✅ Profil récupéré:');
    console.log(`   - Nom: ${getProfile.data.data.nom} ${getProfile.data.data.prenom}`);
    console.log(`   - Email: ${getProfile.data.data.email}`);
    console.log(`   - Plaques: ${getProfile.data.data.plaques.length}`);
  } else {
    console.log('❌ Échec récupération profil');
  }
  console.log('');

  // Test 10: Statut du portail
  console.log('🔟 Test statut du portail...');
  const getStatus = await request('GET', '/portal/status', null, adminToken);
  
  if (getStatus && getStatus.data.success) {
    console.log('✅ Statut du portail récupéré');
    console.log(`   - État: ${getStatus.data.data.status}`);
    console.log(`   - Activités récentes: ${getStatus.data.data.recent_activity.length}`);
  } else {
    console.log('❌ Échec récupération statut');
  }
  console.log('');

  console.log('═══════════════════════════════════');
  console.log('✅ Tests terminés !');
}

// Exécuter les tests
runTests().catch(console.error);