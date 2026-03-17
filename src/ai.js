'use strict';

const Anthropic     = require('@anthropic-ai/sdk');
const { httpRequest } = require('./utils');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function adfToText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.type === 'mention') return node.attrs?.text || '';
  if (node.type === 'emoji') return node.attrs?.text || '';
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'rule') return '\n---\n';
  const children = (node.content || []).map(adfToText).join('');
  if (node.type === 'paragraph') return children + '\n';
  if (node.type === 'heading') return children + '\n';
  if (node.type === 'listItem') return '• ' + children;
  if (node.type === 'codeBlock') return '```\n' + children + '```\n';
  if (node.type === 'blockquote') return '> ' + children;
  return children;
}

function jiraFetch(session, apiPath) {
  const fullPath = `/ex/jira/${session.cloudId}${apiPath}`;
  return httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'GET', fullPath, null);
}

async function estimateIssue(session, issueKey) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('AI estimation not configured');

  const { status, body } = await jiraFetch(session, `/rest/api/3/issue/${issueKey}?fields=*all`);
  if (status !== 200) throw new Error(`Jira returned ${status}`);

  const f = JSON.parse(body).fields;

  const description  = f.description ? adfToText(f.description).trim() : '(no description)';
  const comments     = (f.comment?.comments || []).slice(-8)
    .map(c => `${c.author?.displayName || 'Unknown'}: ${adfToText(c.body).trim().slice(0, 400)}`).join('\n');
  const attachments  = (f.attachment || []).map(a => a.filename).join(', ') || 'none';
  const linkedIssues = (f.issuelinks || []).map(l => {
    const linked = l.inwardIssue || l.outwardIssue;
    const dir    = l.inwardIssue ? l.type?.inward : l.type?.outward;
    return linked ? `${dir}: ${linked.key} — ${linked.fields?.summary || ''}` : null;
  }).filter(Boolean).join('\n') || 'none';
  const subtasks     = (f.subtasks || []).map(s => `• ${s.key}: ${s.fields?.summary || ''}`).join('\n') || 'none';
  const customFields = Object.entries(f)
    .filter(([k, v]) => k.startsWith('customfield_') && v !== null && v !== undefined)
    .map(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number') return `${k}: ${v}`;
      if (typeof v === 'object' && v.type === 'doc') return `${k}: ${adfToText(v).trim().slice(0, 600)}`;
      if (typeof v === 'object' && v.value) return `${k}: ${v.value}`;
      if (typeof v === 'object' && v.name)  return `${k}: ${v.name}`;
      return null;
    }).filter(Boolean).join('\n');

  const prompt = `You are a senior engineering estimator for a software team. Analyze this Jira ticket and provide realistic hour estimates — not overly conservative, based on what a competent team would actually need.

TICKET: ${issueKey}
Type: ${f.issuetype?.name || 'Unknown'}
Priority: ${f.priority?.name || 'Unknown'}
Status: ${f.status?.name || 'Unknown'}
Labels: ${(f.labels || []).join(', ') || 'none'}
Components: ${(f.components || []).map(c => c.name).join(', ') || 'none'}
Epic: ${f.parent?.fields?.issuetype?.name === 'Epic' ? `${f.parent.key}: ${f.parent.fields?.summary || ''}` : 'none'}

SUMMARY:
${f.summary || ''}

DESCRIPTION:
${description.slice(0, 3000)}

CUSTOM FIELDS (may include acceptance criteria and other team-specific fields):
${customFields.slice(0, 2000) || 'none'}

SUBTASKS:
${subtasks}

LINKED ISSUES:
${linkedIssues}

ATTACHMENTS: ${attachments}

RECENT COMMENTS:
${comments.slice(0, 1500) || 'none'}

Estimate hours for:
1. Dev hours — implementation + unit tests + code review. Simple text/styling changes = 1-4h. Standard feature = 4-16h. Complex new system = 16-40h.
2. QA hours — typically 25-50% of dev hours. Simple changes = 0.5-2h. Standard = 2-8h.

Respond in this exact JSON format only, no other text:
{
  "dev": <number>,
  "qa": <number>,
  "reasoning": "<2-3 sentence explanation>"
}`;

  const message = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 512,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text = message.content[0]?.text || '';
  let parsed;
  try {
    parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
  } catch {
    throw new Error('AI response could not be parsed');
  }

  return {
    dev:       Number(parsed.dev) || 0,
    qa:        Number(parsed.qa)  || 0,
    reasoning: String(parsed.reasoning || ''),
  };
}

module.exports = { estimateIssue, adfToText };
