const axios = require("axios");

/* Obtener IP pública */
async function obtenerIpPublica() {
  const res = await axios.get("https://api.ipify.org?format=json");
  return res.data.ip;
}

/* Obtener token de Azure */
async function obtenerTokenAzure() {
  const {
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
  } = process.env;

  const url = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    resource: "https://management.azure.com/",
  });

  const res = await axios.post(url, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return res.data.access_token;
}

/* Actualizar regla en Azure SQL */
async function actualizarFirewallSql(ip) {
  const {
    AZURE_SUBSCRIPTION_ID,
    AZURE_SQL_RESOURCE_GROUP,
    AZURE_SQL_SERVER,
    AZURE_SQL_FIREWALL_RULE_NAME,
  } = process.env;

  const token = await obtenerTokenAzure();

  const url =
    `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}` +
    `/resourceGroups/${AZURE_SQL_RESOURCE_GROUP}` +
    `/providers/Microsoft.Sql/servers/${AZURE_SQL_SERVER}` +
    `/firewallRules/${AZURE_SQL_FIREWALL_RULE_NAME}?api-version=2021-11-01-preview`;

  const body = {
    properties: {
      startIpAddress: ip,
      endIpAddress: ip,
    },
  };

  await axios.put(url, body, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log(`🔥 Azure: firewall actualizado con IP ${ip}`);
}

/* Función principal */
async function actualizarIpFirewallAzure() {
  const ip = await obtenerIpPublica();
  await actualizarFirewallSql(ip);
  return ip;
}

module.exports = { actualizarIpFirewallAzure };
