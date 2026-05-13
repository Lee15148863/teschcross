const bcrypt = require('bcryptjs');
const DeploymentAudit = require('../models/saas/DeploymentAudit');
const Deployment = require('../models/saas/Deployment');

var SUPPORTED_TIMEZONES = [
  'Europe/Dublin',
  'Europe/London',
  'America/New_York',
  'Asia/Shanghai'
];

function isTimezoneSupported(tz) {
  return SUPPORTED_TIMEZONES.indexOf(tz) !== -1;
}

function getLocalHHMM(date, timezone) {
  var d = date || new Date();
  var tz = timezone || 'Europe/Dublin';
  try {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(d);

    var h = '', m = '';
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'hour')   h = parts[i].value;
      if (parts[i].type === 'minute') m = parts[i].value;
    }
    return h + m;
  } catch (e) {
    var fallback = '' + d.getUTCHours() + d.getUTCMinutes();
    return ('00' + d.getUTCHours()).slice(-2) + ('00' + d.getUTCMinutes()).slice(-2);
  }
}

function getLocalHHMMRange(toleranceMinutes, timezone) {
  var tol = toleranceMinutes == null ? 1 : toleranceMinutes;
  var codes = [];
  for (var offset = -tol; offset <= tol; offset++) {
    var d = new Date(Date.now() + offset * 60000);
    codes.push(getLocalHHMM(d, timezone));
  }
  return codes.filter(function(c, i) { return codes.indexOf(c) === i; });
}

async function verifyActionCode(dep, enteredCode, toleranceMinutes) {
  if (!dep || !dep.pinHash) {
    return { valid: false, error: 'No deployment PIN configured. Set a PIN first.' };
  }

  if (!enteredCode || enteredCode.length < 8) {
    return { valid: false, error: 'Code must be at least 8 digits (HHMM + PIN).' };
  }

  if (!/^\d+$/.test(enteredCode)) {
    return { valid: false, error: 'Code must contain only digits.' };
  }

  var tol = toleranceMinutes == null ? 1 : toleranceMinutes;
  var tz = dep.timezone || 'Europe/Dublin';
  var localCodes = getLocalHHMMRange(tol, tz);
  var pinPart = enteredCode.slice(4);

  var enteredHHMM = enteredCode.slice(0, 4);
  var tzValid = false;
  for (var i = 0; i < localCodes.length; i++) {
    if (enteredHHMM === localCodes[i]) {
      tzValid = true;
      break;
    }
  }

  if (!tzValid) {
    return { valid: false, error: 'Invalid time code for ' + tz + '. Expected one of: ' + localCodes.join(', ') };
  }

  var pinMatch = await bcrypt.compare(pinPart, dep.pinHash);
  if (!pinMatch) {
    return { valid: false, error: 'Invalid deployment PIN.' };
  }

  return { valid: true, error: '' };
}

async function recordAudit(deploymentId, action, result, reason, adminUser, details) {
  try {
    var dep = await Deployment.findById(deploymentId).select('storeName serviceName status version imageTag');

    var entry = {
      deploymentId: deploymentId,
      storeName:    dep ? dep.storeName : '',
      serviceName:  dep ? dep.serviceName : '',
      action:       action,
      result:       result,
      reason:       reason || '',
      details:      details || {},
      adminUser:    adminUser ? adminUser.userId : null,
      adminName:    adminUser ? (adminUser.username || '') : '',
      snapshot: dep ? {
        status:   dep.status,
        version:  dep.version,
        imageTag: dep.imageTag
      } : {}
    };

    return await DeploymentAudit.create(entry);
  } catch (e) {
    console.error('Audit log write failed:', e.message);
    return null;
  }
}

module.exports = {
  getLocalHHMM,
  getLocalHHMMRange,
  isTimezoneSupported,
  SUPPORTED_TIMEZONES,
  verifyActionCode,
  recordAudit
};
