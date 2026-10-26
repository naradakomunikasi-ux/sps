#!/usr/bin/env python3
"""Evidence-aware SPS task progress audit; no status mutation."""
import sqlite3, sys, json
from collections import defaultdict
con=sqlite3.connect(sys.argv[1]);con.row_factory=sqlite3.Row
items=[dict(x) for x in con.execute('SELECT id,lane,title,weight,status FROM work_item ORDER BY lane,id')]
rows=defaultdict(list)
for it in items: rows[it['lane']].append(it)
result={'formula':'count(IMPLEMENTED or TESTED or VERIFIED)/count(all)','verified_formula':'sum(weight VERIFIED)/sum(weight all)','lanes':{},'overall':{}}
for lane, group in sorted(rows.items()):
 done=sum(i['status'] in ('IMPLEMENTED','TESTED','VERIFIED') for i in group)
 verified=sum(i['status']=='VERIFIED' for i in group)
 result['lanes'][lane]={'done':done,'total':len(group),'coverage_pct':round(100*done/len(group),2),'verified':verified,'verified_pct':round(100*verified/len(group),2)}
done=sum(i['status'] in ('IMPLEMENTED','TESTED','VERIFIED') for i in items)
vw=sum(i['weight'] for i in items if i['status']=='VERIFIED'); tw=sum(i['weight'] for i in items)
result['overall']={'implemented_or_tested':done,'tasks':len(items),'coverage_pct':round(100*done/len(items),2),'verified_weight':vw,'total_weight':tw,'verified_pct':round(100*vw/tw,2)}
result['next_planned']=[{'id':i['id'],'lane':i['lane'],'title':i['title']} for i in items if i['status']=='PLANNED']
print(json.dumps(result,ensure_ascii=False,indent=2))
