#!/usr/bin/env python3
"""Evidence-first SPS release gate. Read-only. Stdlib only."""
import argparse, json, sqlite3, sys
from pathlib import Path

REQUIRED_LANES = {'Frontend', 'Backend', 'Database', 'Integration', 'DevOps', 'QA', 'Governance'}

def audit(path):
    db = sqlite3.connect(f'file:{Path(path).resolve()}?mode=ro', uri=True)
    try:
        integrity = db.execute('PRAGMA integrity_check').fetchone()[0]
        foreign_keys = len(db.execute('PRAGMA foreign_key_check').fetchall())
        rows = db.execute('SELECT id,lane,weight,status,verified_at FROM work_item').fetchall()
        checkpoint = db.execute('SELECT id,verified_weight,total_weight,verified_pct,gate_g3 FROM checkpoint ORDER BY at DESC,id DESC LIMIT 1').fetchone()
        if not rows or not checkpoint:
            raise ValueError('Missing task registry or checkpoint')
        allowed = {'PLANNED', 'IMPLEMENTED', 'TESTED', 'VERIFIED'}
        errors = []
        if integrity != 'ok' or foreign_keys: errors.append('SQLite integrity or foreign keys failed')
        if len({row[0] for row in rows}) != len(rows): errors.append('Duplicate task IDs')
        if {r[1] for r in rows} != REQUIRED_LANES: errors.append('Unexpected or missing engineering lane')
        if any(r[3] not in allowed or r[2] <= 0 for r in rows): errors.append('Invalid work item status or weight')
        total_weight = sum(r[2] for r in rows)
        verified_weight = sum(r[2] for r in rows if r[3] == 'VERIFIED')
        implementation = sum(r[3] != 'PLANNED' for r in rows)
        tested = sum(r[3] in ('TESTED', 'VERIFIED') for r in rows)
        if any((r[3] == 'VERIFIED') != bool(r[4]) for r in rows): errors.append('Verified date mismatch')
        if (checkpoint[1] != verified_weight or checkpoint[2] != total_weight or abs(checkpoint[3] - verified_weight * 100 / total_weight) > .011): errors.append('Checkpoint score mismatch')
        if checkpoint[4] not in ('HOLD','PASS'): errors.append('Invalid G3 gate')
        if checkpoint[4] == 'PASS' and verified_weight == 0: errors.append('G3 PASS without verified evidence')
        report = dict(checkpoint=checkpoint[0], task_count=len(rows), implemented_or_tested=implementation,
                      implementation_pct=round(100 * implementation / len(rows),2), tested_count=tested,
                      tested_pct=round(100 * tested / len(rows),2), verified_weight=verified_weight,
                      total_weight=total_weight, verified_pct=round(100 * verified_weight / total_weight,2),
                      gate_g3=checkpoint[4], threshold50_met=implementation * 2 >= len(rows),
                      eligible_for_github_upload=False, errors=errors)
        # Upload is never automatically approved by a numeric threshold.
        return report
    finally: db.close()

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('checkpoint_db');args=parser.parse_args()
    try:
        result=audit(args.checkpoint_db);print(json.dumps(result,indent=2));sys.exit(1 if result['errors'] else 0)
    except (sqlite3.Error,ValueError,OSError) as exc:
        print(json.dumps({'errors':[str(exc)]}));sys.exit(1)
