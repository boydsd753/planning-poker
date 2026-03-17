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

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function adfToHtml(node, attachmentMap) {
  if (!node) return '';
  if (node.type === 'text') {
    let text = esc(node.text || '');
    for (const mark of (node.marks || [])) {
      if (mark.type === 'strong')    text = `<strong>${text}</strong>`;
      else if (mark.type === 'em')   text = `<em>${text}</em>`;
      else if (mark.type === 'code') text = `<code>${text}</code>`;
      else if (mark.type === 'strike')    text = `<s>${text}</s>`;
      else if (mark.type === 'underline') text = `<u>${text}</u>`;
      else if (mark.type === 'link') {
        const href = esc(mark.attrs?.href || '#');
        text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
    }
    return text;
  }
  if (node.type === 'mention')   return `<span class="adf-mention">${esc(node.attrs?.text || '')}</span>`;
  if (node.type === 'emoji')     return esc(node.attrs?.text || '');
  if (node.type === 'hardBreak') return '<br>';
  if (node.type === 'rule')      return '<hr class="adf-hr">';
  if (node.type === 'inlineCard') {
    const url = esc(node.attrs?.url || '');
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="adf-card-link">${url}</a>`;
  }

  const children = (node.content || []).map(c => adfToHtml(c, attachmentMap)).join('');

  switch (node.type) {
    case 'doc':         return children;
    case 'paragraph':   return `<p>${children || '<br>'}</p>`;
    case 'heading': {
      const lvl = Math.min(Math.max(node.attrs?.level || 1, 1), 6);
      return `<h${lvl} class="adf-h${lvl}">${children}</h${lvl}>`;
    }
    case 'bulletList':  return `<ul class="adf-list">${children}</ul>`;
    case 'orderedList': return `<ol class="adf-list">${children}</ol>`;
    case 'listItem':    return `<li>${children}</li>`;
    case 'codeBlock':   return `<pre class="adf-pre"><code>${children}</code></pre>`;
    case 'blockquote':  return `<blockquote class="adf-blockquote">${children}</blockquote>`;
    case 'table':       return `<table class="adf-table">${children}</table>`;
    case 'tableRow':    return `<tr>${children}</tr>`;
    case 'tableHeader': return `<th>${children}</th>`;
    case 'tableCell':   return `<td>${children}</td>`;
    case 'mediaSingle':
    case 'mediaGroup':  return `<div class="adf-media-group">${children}</div>`;
    case 'media': {
      const fileName = node.attrs?.__fileName || node.attrs?.alt || '';
      const fileMime = node.attrs?.__fileMimeType || '';
      const att = (fileName && attachmentMap?.[`fn:${fileName}`]) || null;
      // Store the original ADF node attrs so the client can reconstruct the node on save
      const adfAttr = esc(JSON.stringify({ type: 'media', attrs: node.attrs || {} }));
      if (!att) {
        // No attachment match — still emit a placeholder that preserves the original ADF
        return `<span class="adf-media-placeholder" data-adf="${adfAttr}">[media]</span>`;
      }
      const mime = att.mimeType || fileMime;
      const name = att.filename || fileName;
      const isImage = /^image\//i.test(mime) || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name);
      if (isImage) {
        return `<img class="adf-inline-img" data-attachment-id="${esc(att.id)}" data-adf="${adfAttr}" alt="${esc(name)}" src="">`;
      }
      return `<span class="adf-file-ref" data-attachment-id="${esc(att.id)}" data-adf="${adfAttr}">${esc(name)}</span>`;
    }
    default:            return children;
  }
}

function jiraFetch(session, apiPath) {
  const fullPath = `/ex/jira/${session.cloudId}${apiPath}`;
  return httpRequest('api.atlassian.com', `Bearer ${session.accessToken}`, 'GET', fullPath, null);
}

async function estimateIssue(session, issueKey, team = 'both') {
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

${team === 'dev' ? `Estimate hours for:
1. Dev hours only — implementation + unit tests + code review. Simple text/styling changes = 1-4h. Standard feature = 4-16h. Complex new system = 16-40h.

If the ticket has genuinely insufficient detail to produce a meaningful estimate (e.g. no description, no acceptance criteria, title-only with no context), respond with this format instead:
{ "insufficient": true, "reasoning": "<1-2 sentences describing what specific information is missing>" }

Otherwise respond in this exact JSON format only, no other text:
{
  "dev": <number>,
  "reasoning": "<2-3 sentence explanation>"
}` : team === 'qa' ? `Estimate hours for:
1. QA hours only — test planning, execution, regression, bug verification. Typically 25-50% of dev hours. Simple changes = 0.5-2h. Standard = 2-8h.

If the ticket has genuinely insufficient detail to produce a meaningful estimate (e.g. no description, no acceptance criteria, title-only with no context), respond with this format instead:
{ "insufficient": true, "reasoning": "<1-2 sentences describing what specific information is missing>" }

Otherwise respond in this exact JSON format only, no other text:
{
  "qa": <number>,
  "reasoning": "<2-3 sentence explanation>"
}` : `Estimate hours for:
1. Dev hours — implementation + unit tests + code review. Simple text/styling changes = 1-4h. Standard feature = 4-16h. Complex new system = 16-40h.
2. QA hours — typically 25-50% of dev hours. Simple changes = 0.5-2h. Standard = 2-8h.

If the ticket has genuinely insufficient detail to produce a meaningful estimate (e.g. no description, no acceptance criteria, title-only with no context), respond with this format instead:
{ "insufficient": true, "reasoning": "<1-2 sentences describing what specific information is missing>" }

Otherwise respond in this exact JSON format only, no other text:
{
  "dev": <number>,
  "qa": <number>,
  "reasoning": "<2-3 sentence explanation>"
}`}`;

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

  if (parsed.insufficient) {
    return { insufficient: true, reasoning: String(parsed.reasoning || ''), team };
  }

  return {
    dev:       team !== 'qa'  ? (Number(parsed.dev) || 0) : null,
    qa:        team !== 'dev' ? (Number(parsed.qa)  || 0) : null,
    reasoning: String(parsed.reasoning || ''),
    team,
  };
}

module.exports = { estimateIssue, adfToText, adfToHtml };
