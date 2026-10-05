#!/usr/bin/env python3
"""add-comments.py — one-shot: append COMMENT ON TABLE lines for any table
missing one, inferred from a maintained descriptions map. Idempotent."""
import re
from pathlib import Path

DESC = {
  # 0002
  'educational_stages': 'System taxonomy: educational stages (primary/intermediate/secondary). Admin-managed, soft-disabled.',
  'subjects': 'System taxonomy: subjects taught. Admin-managed, soft-disabled.',
  'specializations': 'System taxonomy: volunteer specializations; hierarchical via parent_id.',
  'teaching_styles': 'System taxonomy: teaching styles enum-backed (explanation, revision, ...).',
  # 0003
  'volunteer_profiles': 'Volunteer public profile + status/coc gates for visibility (§7).',
  'volunteer_applications': 'Volunteer application state machine (draft→submitted→...→approved/rejected).',
  'application_transitions': 'Reference table: legal application status transitions (§7).',
  'volunteer_documents': 'Private-bucket document metadata; access admin-only + audited.',
  'volunteer_subjects': 'M2M volunteer↔subject.',
  'volunteer_stages': 'M2M volunteer↔stage.',
  'volunteer_specializations': 'M2M volunteer↔specialization.',
  'volunteer_styles': 'M2M volunteer↔teaching style.',
  'availability_rules': 'Recurring weekly availability windows (0=Sunday, §6).',
  'availability_exceptions': 'Date exceptions/blackouts over weekly rules.',
  # 0004
  'student_profiles': 'Minimal student info; minors are guardian-linked (§4).',
  'session_requests': 'Learning requests with reference codes AM-S-*; source of truth before WhatsApp (§14B).',
  'sessions': 'Scheduled sessions; double-booking impossible via GIST exclusion constraints (§9 HARD).',
  'session_transitions': 'Reference table: legal session status transitions (§9).',
  'session_participants': 'Join/leave attendance per participant.',
  'session_events': 'Append-only event timeline for investigation (§15).',
  'session_feedback': 'Ratings 1-5 + moderated opt-in excerpts (§10).',
  # 0005
  'platform_settings': 'Versioned key-value settings (matching weights, whatsapp_number §14B).',
  'notifications': 'Outbox: notification intents with idempotency keys (§14).',
  'notification_deliveries': 'Per-channel delivery state machine with retries.',
  'notification_preferences': 'Per-user channel prefs + quiet hours; safety notices not opt-out.',
  'reports': 'Report form entries: category/severity/status (§10 v2).',
  'quality_alerts': 'Admin alert queue: low rating, complaints, attendance, inactivity.',
  'volunteer_hours_ledger': 'Append-only hour ledger; corrections are compensating entries (§11).',
  'points_rules': 'Versioned points rules (admin-configured only, §11).',
  'volunteer_points_ledger': 'Append-only points ledger referencing rules.',
  'content_pages': 'Bilingual versioned legal/static pages, flagged for legal review (§2.8).',
}

MIG = Path('supabase/migrations')
for f in sorted(MIG.glob('*.sql')):
    s = f.read_text()
    tables = re.findall(r'create table\s+(?:if not exists\s+)?(public\.(\w+))', s)
    missing = [(full, name) for full, name in tables if f'comment on table {full}' not in s]
    if not missing:
        continue
    lines = ['\n-- table documentation (added by add-comments.py)']
    for full, name in missing:
        desc = DESC.get(name, f'{name} table.')
        lines.append(f'comment on table {full} is \'{desc}\';')
    f.write_text(s + '\n' + '\n'.join(lines) + '\n')
    print(f'{f.name}: +{len(missing)} comments')
print('done')
