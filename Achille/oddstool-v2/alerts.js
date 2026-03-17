/**
 * alerts.js - Alert System
 * Formats and delivers EV+ alerts via file and/or WhatsApp (via Pasta)
 *
 * Bet object shape (from engine.js filterValueBets):
 *   bet.sportLabel, bet.league, bet.game, bet.commenceTime
 *   bet.betSide, bet.bookmaker, bet.market
 *   bet.bookmakerOdds (decimal), bet.consensusOdds (decimal), bet.consensusProb
 *   bet.ev (decimal, e.g. 0.038), bet.evPct (string, e.g. "3.84%")
 *   bet.href (optional link)
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

function decimalToAmerican(dec) {
  if (!dec || dec <= 1) return 'N/A';
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `${Math.round(-100 / (dec - 1))}`;
}

/**
 * Format an EV+ value bet opportunity for display/alerting
 */
function formatAlert(bet, trade) {
  const gameTime = bet.commenceTime
    ? new Date(bet.commenceTime).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      })
    : 'TBD';

  const betTeam = bet.betSide === 'home' ? bet.homeTeam
    : bet.betSide === 'away' ? bet.awayTeam
    : bet.betSide; // 'draw' or other

  const lines = [
    `🎲 *EV+ Alert — ${bet.sportLabel}: ${bet.game}*`,
    `📅 ${gameTime}`,
    ``,
    `Bet: *${betTeam || bet.betSide.toUpperCase()}* (${bet.betSide}) — ${bet.market || 'ML'}`,
    `${bet.bookmaker}: ${decimalToAmerican(bet.bookmakerOdds)} (decimal: ${bet.bookmakerOdds})`,
    `Market consensus: ${decimalToAmerican(bet.consensusOdds)} | True prob: ${bet.consensusProb}`,
    `Expected Value: *+${bet.evPct}* → exp. profit: $${((bet.ev || 0) * config.unitSize).toFixed(2)} on $${config.unitSize} unit`,
  ];

  if (bet.href) lines.push(`🔗 ${bet.href}`);
  if (trade) lines.push(`📝 Trade ID: ${trade.id}`);

  return lines.join('\n');
}

function writeAlertToFile(bet, trade) {
  try {
    const alertsDir = path.dirname(config.alertsFile);
    if (!fs.existsSync(alertsDir)) fs.mkdirSync(alertsDir, { recursive: true });

    let alerts = [];
    if (fs.existsSync(config.alertsFile)) {
      try { alerts = JSON.parse(fs.readFileSync(config.alertsFile, 'utf8')); } catch (_) {}
    }
    alerts.push({
      timestamp: new Date().toISOString(),
      tradeId: trade?.id || null,
      sportLabel: bet.sportLabel,
      league: bet.league,
      game: bet.game,
      betSide: bet.betSide,
      bookmaker: bet.bookmaker,
      evPct: bet.evPct,
      message: formatAlert(bet, trade),
    });
    fs.writeFileSync(config.alertsFile, JSON.stringify(alerts, null, 2));
    console.log(`  📝 Alert written to ${config.alertsFile}`);
  } catch (e) {
    console.error('  ❌ Failed to write alert:', e.message);
  }
}

async function sendAgentAlert(bet, trade) {
  const { exec } = require('child_process');
  const msg = formatAlert(bet, trade);
  const escaped = msg.replace(/'/g, "'\\''");
  const cmd = `openclaw session send agent:main:whatsapp:direct:+14083759119 '${escaped}' 2>&1`;
  return new Promise(resolve => {
    exec(cmd, (err) => {
      if (err) console.log(`  ⚠️  Agent alert failed: ${err.message}`);
      else console.log(`  📨 Alert sent to Mario via WhatsApp`);
      resolve();
    });
  });
}

async function sendAlert(bet, trade) {
  const method = config.alertMethod;
  const label = `${bet.sportLabel || bet.sport}: ${bet.game} | +${bet.evPct} | ${bet.bookmaker} ${bet.betSide}`;
  console.log(`\n🚨 EV+ | ${label}`);

  if (method === 'file' || method === 'both') writeAlertToFile(bet, trade);
  if (method === 'agent' || method === 'both') await sendAgentAlert(bet, trade);
}

module.exports = { sendAlert, formatAlert };
