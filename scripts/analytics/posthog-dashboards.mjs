#!/usr/bin/env node
/**
 * Builds the Kids Zone PostHog dashboards from code (see docs/ANALYTICS.md).
 *
 *   npm run analytics:dashboards -- [--dry-run] [--channel production|all]
 *
 * Env (put them in .env.local, never in the app):
 *   POSTHOG_PERSONAL_API_KEY  phx_… with dashboard:write, insight:write, project:read
 *   POSTHOG_PROJECT_ID        the number in the PostHog URL (/project/<id>/…)
 *   POSTHOG_HOST              optional, defaults to https://eu.posthog.com
 *
 * Idempotent: dashboards are found by name and their insights by name, then
 * updated in place (links stay the same). Nothing is ever deleted.
 */

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const channelArg = args.includes('--channel') ? args[args.indexOf('--channel') + 1] : 'production';
const HOST = (process.env.POSTHOG_HOST || 'https://eu.posthog.com').replace(/\/$/, '');
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT = process.env.POSTHOG_PROJECT_ID;

// ---------------------------------------------------------------- query helpers

const ev = (event, extra = {}) => ({ kind: 'EventsNode', event, name: event, ...extra });
const prop = (key, value, operator = 'exact') => ({ key, value, operator, type: 'event' });

function trends({ series, interval = 'day', from = '-30d', display = 'ActionsLineGraph', breakdown, limit, formula, compare, props }) {
  return {
    kind: 'InsightVizNode',
    source: {
      kind: 'TrendsQuery',
      series,
      interval,
      dateRange: { date_from: from },
      trendsFilter: { display, ...(formula ? { formula } : {}), showValuesOnSeries: display === 'ActionsBarValue' },
      ...(breakdown ? { breakdownFilter: { breakdown, breakdown_type: 'event', breakdown_limit: limit ?? 25 } } : {}),
      ...(compare ? { compareFilter: { compare: true } } : {}),
      ...(props ? { properties: props } : {}),
    },
  };
}

function sql(query, { from = '-30d', display = 'ActionsTable', x, y } = {}) {
  return {
    kind: 'DataVisualizationNode',
    source: { kind: 'HogQLQuery', query: query.trim(), filters: { dateRange: { date_from: from } } },
    display,
    ...(x && y ? { chartSettings: { xAxis: { column: x }, yAxis: y.map((column) => ({ column })) } } : {}),
  };
}

const num = (p) => `toFloat(properties.${p})`;
const isFatal = `toString(properties.fatal) = 'true'`;

// ---------------------------------------------------------------- dashboards

const DASHBOARDS = [
  {
    name: 'Kids Zone · Overview',
    description: 'Is the app growing and are kids coming back? Anonymous devices, not people.',
    insights: [
      {
        name: 'Active devices · last 7 days',
        description: 'Unique devices that opened the app, vs the 7 days before.',
        query: trends({ series: [ev('app_open', { math: 'dau' })], from: '-7d', display: 'BoldNumber', compare: true }),
      },
      {
        name: 'Games played · last 7 days',
        query: trends({ series: [ev('game_start')], from: '-7d', display: 'BoldNumber', compare: true }),
      },
      {
        name: 'Play hours · last 7 days',
        description: 'Foreground time inside games.',
        query: trends({
          series: [ev('game_end', { math: 'sum', math_property: 'durationSec' })],
          formula: 'A / 3600',
          from: '-7d',
          display: 'BoldNumber',
          compare: true,
        }),
      },
      {
        name: 'Minutes played per device per day',
        description: 'Average daily play time of a device that played that day.',
        query: trends({
          series: [ev('game_end', { math: 'sum', math_property: 'durationSec' }), ev('game_end', { math: 'dau' })],
          formula: 'A / 60 / B',
        }),
      },
      {
        name: 'Daily & weekly active devices',
        query: trends({
          series: [ev('app_open', { math: 'dau', custom_name: 'Daily' }), ev('app_open', { math: 'weekly_active', custom_name: 'Weekly' })],
          from: '-90d',
        }),
      },
      {
        name: 'Weekly retention',
        description: 'Of the devices first seen in a week, how many open the app again in later weeks.',
        query: {
          kind: 'InsightVizNode',
          source: {
            kind: 'RetentionQuery',
            dateRange: { date_from: '-8w' },
            retentionFilter: {
              period: 'Week',
              totalIntervals: 8,
              retentionType: 'retention_first_time',
              targetEntity: { id: 'app_open', name: 'app_open', type: 'events' },
              returningEntity: { id: 'app_open', name: 'app_open', type: 'events' },
            },
          },
        },
      },
      {
        name: 'Day 1 / Day 7 retention',
        query: {
          kind: 'InsightVizNode',
          source: {
            kind: 'RetentionQuery',
            dateRange: { date_from: '-14d' },
            retentionFilter: {
              period: 'Day',
              totalIntervals: 14,
              retentionType: 'retention_first_time',
              targetEntity: { id: 'app_open', name: 'app_open', type: 'events' },
              returningEntity: { id: 'game_start', name: 'game_start', type: 'events' },
            },
          },
        },
      },
      {
        name: 'Days played per week',
        description: 'How many days in a week a device plays (habit strength).',
        query: {
          kind: 'InsightVizNode',
          source: {
            kind: 'StickinessQuery',
            series: [ev('game_start')],
            interval: 'day',
            dateRange: { date_from: '-7d' },
            stickinessFilter: { display: 'ActionsBar' },
          },
        },
      },
      {
        name: 'Free play vs guided journey',
        query: trends({ series: [ev('game_start')], breakdown: 'mode', display: 'ActionsAreaGraph' }),
      },
      {
        name: 'Devices by age band',
        query: trends({ series: [ev('app_open', { math: 'dau' })], breakdown: 'ageBand', display: 'ActionsPie' }),
      },
      {
        name: 'Devices by language',
        query: trends({ series: [ev('app_open', { math: 'dau' })], breakdown: 'language', display: 'ActionsPie' }),
      },
      {
        name: 'Devices by platform',
        query: trends({ series: [ev('app_open', { math: 'dau' })], breakdown: 'platform', display: 'ActionsPie' }),
      },
      {
        name: 'When kids play (hour of day)',
        description: 'Game starts by hour, in the project time zone.',
        query: sql(
          `SELECT toHour(timestamp) AS hour, count() AS games_started
           FROM events WHERE event = 'game_start' AND {filters}
           GROUP BY hour ORDER BY hour`,
          { display: 'ActionsBar', x: 'hour', y: ['games_started'] },
        ),
      },
    ],
  },

  {
    name: 'Kids Zone · Games',
    description: 'Which games kids pick, stay with and find hard.',
    insights: [
      {
        name: 'Game scorecard',
        description:
          'plays_per_device = how often a device comes back to a game. quit_before_round_pct = sessions that ended before the first round was finished (high = confusing, too hard or not fun). The row "journey" is the guided-journey session as a whole.',
        query: sql(`
          SELECT
            properties.gameId AS game,
            countIf(event = 'game_start') AS plays,
            uniqIf(distinct_id, event = 'game_start') AS devices,
            round(plays / nullIf(devices, 0), 1) AS plays_per_device,
            round(avgIf(${num('durationSec')}, event = 'game_end') / 60, 1) AS avg_minutes,
            round(avgIf(${num('rounds')}, event = 'game_end'), 1) AS avg_rounds,
            round(100 * countIf(event = 'game_end' AND ${num('rounds')} = 0) / nullIf(countIf(event = 'game_end'), 0)) AS quit_before_round_pct,
            round(100 * countIf(event = 'game_start' AND properties.mode = 'journey') / nullIf(plays, 0)) AS journey_pct
          FROM events
          WHERE event IN ('game_start', 'game_end', 'round_complete') AND properties.gameId IS NOT NULL AND {filters}
          GROUP BY game
          ORDER BY plays DESC
          LIMIT 100`),
      },
      {
        name: 'How game sessions end',
        description:
          'finished = the game ended itself; back_before_round = left before finishing a round (confusing or not fun); backgrounded = the app left the screen mid-game. Only sessions from builds that send endedBy.',
        query: sql(`
          SELECT
            properties.gameId AS game,
            count() AS sessions,
            round(100 * countIf(properties.endedBy = 'complete') / count()) AS finished_pct,
            round(100 * countIf(properties.endedBy = 'back' AND ${num('rounds')} = 0) / count()) AS back_before_round_pct,
            round(100 * countIf(properties.endedBy = 'back' AND ${num('rounds')} > 0) / count()) AS back_after_rounds_pct,
            round(100 * countIf(properties.endedBy IN ('error', 'limit')) / count()) AS error_or_limit_pct,
            round(100 * countIf(toString(properties.backgrounded) = 'true') / count()) AS backgrounded_pct,
            round(quantileIf(0.5)(${num('secondsToFirstRound')}, properties.secondsToFirstRound IS NOT NULL)) AS median_sec_to_first_round
          FROM events
          WHERE event = 'game_end' AND properties.endedBy IS NOT NULL AND {filters}
          GROUP BY game
          ORDER BY sessions DESC
          LIMIT 100`),
      },
      {
        name: 'Session endings',
        query: trends({ series: [ev('game_end')], breakdown: 'endedBy', display: 'ActionsPie', props: [prop('endedBy', '', 'is_set')] }),
      },
      {
        name: 'Hints needed per game',
        description:
          'Rounds from games on the shared hint ladder. first_try = no miss; retry / highlight / reveal = the furthest hint the round needed. A high reveal_pct means the game is too hard for the children playing it.',
        query: sql(`
          SELECT
            properties.gameId AS game,
            count() AS rounds,
            round(100 * countIf(properties.hint = 'none') / count()) AS first_try_pct,
            round(100 * countIf(properties.hint = 'retry') / count()) AS retry_pct,
            round(100 * countIf(properties.hint = 'highlight') / count()) AS highlight_pct,
            round(100 * countIf(properties.hint = 'reveal') / count()) AS reveal_pct,
            round(avg(${num('misses')}), 2) AS avg_misses
          FROM events
          WHERE event = 'round_complete' AND properties.hint IS NOT NULL AND {filters}
          GROUP BY game
          ORDER BY reveal_pct DESC
          LIMIT 100`),
      },
      {
        name: 'Hints needed by age band',
        description: 'Same as above, split by the age band a grown-up picked. Shows whether a band gets games that are too hard.',
        query: sql(`
          SELECT
            properties.ageBand AS age_band,
            count() AS rounds,
            round(100 * countIf(properties.hint = 'none') / count()) AS first_try_pct,
            round(100 * countIf(properties.hint = 'reveal') / count()) AS reveal_pct,
            round(avg(${num('misses')}), 2) AS avg_misses
          FROM events
          WHERE event = 'round_complete' AND properties.hint IS NOT NULL AND {filters}
          GROUP BY age_band
          ORDER BY rounds DESC`),
      },
      {
        name: 'Tutorial completion',
        description: 'Devices that saw a first-run demo, and how many went on to finish it (first touch).',
        query: sql(`
          SELECT
            properties.id AS demo,
            uniqIf(distinct_id, event = 'tutorial_shown') AS devices_shown,
            uniqIf(distinct_id, event = 'tutorial_done') AS devices_done,
            round(100 * devices_done / nullIf(devices_shown, 0)) AS done_pct,
            round(countIf(event = 'tutorial_shown') / nullIf(devices_shown, 0), 1) AS shows_per_device
          FROM events
          WHERE event IN ('tutorial_shown', 'tutorial_done') AND {filters}
          GROUP BY demo
          ORDER BY devices_shown DESC`),
      },
      {
        name: 'Idle help per game',
        description:
          'How often a child sat stuck long enough for the help to come back, per 10 finished rounds of that game. Rounds from older builds count too, so this reads low until the new build is everywhere.',
        query: sql(`
          SELECT game, idle_hints, devices, rounds, round(10 * idle_hints / nullIf(rounds, 0), 1) AS idle_per_10_rounds
          FROM (
            SELECT
              if(event = 'idle_hint', properties.id, properties.gameId) AS game,
              countIf(event = 'idle_hint') AS idle_hints,
              uniqIf(distinct_id, event = 'idle_hint') AS devices,
              countIf(event = 'round_complete') AS rounds
            FROM events
            WHERE event IN ('idle_hint', 'round_complete') AND {filters}
            GROUP BY game)
          WHERE idle_hints > 0
          ORDER BY idle_per_10_rounds DESC`),
      },
      {
        name: 'Most played games',
        query: trends({ series: [ev('game_start')], breakdown: 'gameId', limit: 50, display: 'ActionsBarValue' }),
      },
      {
        name: 'Devices per game',
        description: 'Reach: how many devices tried each game.',
        query: trends({ series: [ev('game_start', { math: 'dau' })], breakdown: 'gameId', limit: 50, display: 'ActionsBarValue' }),
      },
      {
        name: 'Plays over time (top 10 games)',
        query: trends({ series: [ev('game_start')], breakdown: 'gameId', limit: 10, display: 'ActionsAreaGraph', interval: 'week', from: '-90d' }),
      },
      {
        name: 'Average session length by game (seconds)',
        query: trends({
          series: [ev('game_end', { math: 'avg', math_property: 'durationSec' })],
          breakdown: 'gameId',
          limit: 50,
          display: 'ActionsBarValue',
        }),
      },
      {
        name: 'Session length distribution',
        query: sql(
          `SELECT bucket, count() AS sessions FROM (
             SELECT ${num('durationSec')} AS d,
               multiIf(d < 60, '1: under 1 min', d < 180, '2: 1–3 min', d < 300, '3: 3–5 min',
                       d < 600, '4: 5–10 min', d < 1200, '5: 10–20 min', '6: 20+ min') AS bucket
             FROM events WHERE event = 'game_end' AND {filters})
           GROUP BY bucket ORDER BY bucket`,
          { display: 'ActionsBar', x: 'bucket', y: ['sessions'] },
        ),
      },
      {
        name: 'First play funnel',
        description: 'Open → start a game → finish a round → end a game after 2+ rounds, within a day.',
        query: {
          kind: 'InsightVizNode',
          source: {
            kind: 'FunnelsQuery',
            series: [ev('app_open'), ev('game_start'), ev('round_complete'), ev('game_end', { properties: [prop('rounds', '1', 'gt')] })],
            dateRange: { date_from: '-30d' },
            funnelsFilter: { funnelWindowInterval: 1, funnelWindowIntervalUnit: 'day', funnelVizType: 'steps' },
          },
        },
      },
      {
        name: 'Guided journeys completed',
        query: trends({
          series: [ev('game_start', { math: 'dau', custom_name: 'Devices on a journey', properties: [prop('mode', ['journey'])] }), ev('journey_done', { custom_name: 'Journeys finished' })],
          interval: 'week',
          from: '-90d',
          display: 'ActionsBar',
        }),
      },
    ],
  },

  {
    name: 'Kids Zone · Releases & stability',
    description: 'Did the last release or OTA update help or hurt?',
    insights: [
      {
        name: 'Crashes · last 7 days',
        description: 'app_error with fatal = true.',
        query: trends({ series: [ev('app_error', { properties: [prop('fatal', ['true'])] })], from: '-7d', display: 'BoldNumber', compare: true }),
      },
      {
        name: 'Errors per day',
        query: trends({ series: [ev('app_error')], breakdown: 'fatal', display: 'ActionsBar' }),
      },
      {
        name: 'Health by app version',
        description: 'Errors and crashes per 1,000 app opens. Compare a new version with the previous one.',
        query: sql(`
          SELECT
            properties.appVersion AS version,
            uniqIf(distinct_id, event = 'app_open') AS devices,
            countIf(event = 'app_open') AS opens,
            countIf(event = 'app_error') AS errors,
            countIf(event = 'app_error' AND ${isFatal}) AS crashes,
            round(1000 * errors / nullIf(opens, 0), 1) AS errors_per_1k_opens,
            round(1000 * crashes / nullIf(opens, 0), 1) AS crashes_per_1k_opens,
            countIf(event = 'gl3d_disabled') AS gl3d_disabled
          FROM events
          WHERE event IN ('app_open', 'app_error', 'gl3d_disabled') AND {filters}
          GROUP BY version
          ORDER BY max(timestamp) DESC
          LIMIT 20`),
      },
      {
        name: 'Top errors',
        description: 'Grouped by where it was caught and its message.',
        query: sql(`
          SELECT
            properties.\`where\` AS caught_in,
            properties.message AS message,
            count() AS total,
            countIf(${isFatal}) AS fatal,
            uniq(distinct_id) AS devices,
            arrayStringConcat(groupUniqArray(toString(properties.appVersion)), ', ') AS versions,
            max(timestamp) AS last_seen
          FROM events
          WHERE event = 'app_error' AND {filters}
          GROUP BY caught_in, message
          ORDER BY total DESC
          LIMIT 50`),
      },
      {
        name: 'Errors by where they were caught',
        query: trends({ series: [ev('app_error')], breakdown: 'where', display: 'ActionsBarValue' }),
      },
      {
        name: 'Version adoption',
        description: 'Active devices on each store version.',
        query: trends({ series: [ev('app_open', { math: 'dau' })], breakdown: 'appVersion', display: 'ActionsAreaGraph', limit: 8, from: '-60d' }),
      },
      {
        name: 'OTA updates seen',
        description: 'Each EAS update id, when it first appeared and how many devices run it.',
        query: sql(`
          SELECT
            ifNull(toString(properties.updateId), 'embedded') AS update_id,
            any(properties.appVersion) AS app_version,
            any(properties.channel) AS channel,
            min(timestamp) AS first_seen,
            uniq(distinct_id) AS devices
          FROM events
          WHERE event = 'app_open' AND {filters}
          GROUP BY update_id
          ORDER BY first_seen DESC
          LIMIT 20`, { from: '-60d' }),
      },
      {
        name: '3D turned off (gl3d_disabled)',
        description: 'Devices where starting a 3D view crashed the app, so 3D was switched off.',
        query: trends({ series: [ev('gl3d_disabled', { math: 'dau' })], breakdown: 'platform', display: 'ActionsBar', interval: 'week', from: '-90d' }),
      },
    ],
  },
];

// ---------------------------------------------------------------- API

async function api(method, path, body) {
  const res = await fetch(`${HOST}/api/projects/${PROJECT}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function findDashboard(name) {
  let url = '/dashboards/?limit=200';
  while (url) {
    const page = await api('GET', url);
    const hit = page.results.find((d) => d.name === name && !d.deleted);
    if (hit) return hit;
    url = page.next ? page.next.slice(page.next.indexOf('/dashboards/')) : null;
  }
  return null;
}

function dashboardFilters() {
  return channelArg === 'all' ? { properties: [] } : { properties: [prop('channel', [channelArg])] };
}

async function sync(spec) {
  const filters = dashboardFilters();
  let dash = await findDashboard(spec.name);
  if (dash) {
    dash = await api('PATCH', `/dashboards/${dash.id}/`, { description: spec.description, filters });
    console.log(`↻ ${spec.name}`);
  } else {
    dash = await api('POST', '/dashboards/', { name: spec.name, description: spec.description, filters });
    console.log(`+ ${spec.name}`);
  }
  const full = await api('GET', `/dashboards/${dash.id}/`);
  const existing = new Map((full.tiles || []).filter((t) => t.insight).map((t) => [t.insight.name, t.insight.id]));

  for (const insight of spec.insights) {
    const body = { name: insight.name, description: insight.description ?? '', query: insight.query };
    const id = existing.get(insight.name);
    if (id) await api('PATCH', `/insights/${id}/`, body);
    else await api('POST', '/insights/', { ...body, dashboards: [dash.id] });
    console.log(`   ${id ? '↻' : '+'} ${insight.name}`);
  }
  console.log(`   → ${HOST}/project/${PROJECT}/dashboard/${dash.id}\n`);
}

async function main() {
  if (DRY) {
    console.log(JSON.stringify({ channel: channelArg, dashboards: DASHBOARDS }, null, 2));
    return;
  }
  if (!KEY || !PROJECT) {
    console.error('Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID (e.g. in .env.local). See docs/ANALYTICS.md.');
    process.exit(1);
  }
  console.log(`PostHog ${HOST}, project ${PROJECT}, channel filter: ${channelArg}\n`);
  for (const spec of DASHBOARDS) await sync(spec);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
