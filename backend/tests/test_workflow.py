from datetime import date
from app.database import SessionLocal
from app.models import AnonymousVoteScore,ParticipationToken,PresentationEdit,Vote
from sqlalchemy import func,select
from .conftest import auth
def lecturer(client,admin,name='lecturer'):
 client.post('/api/users',headers=auth(admin),json={'username':name,'full_name':name,'password':'lecturer-password','role':'LECTURER'})
 return client.post('/api/auth/login',json={'username':name,'password':'lecturer-password'}).json()['access_token']
def setup(client,h):
 c=client.post('/api/courses',headers=h,json={'name':'Μεθοδολογία'}).json();p=client.post('/api/periods',headers=h,json={'name':'Χειμερινό 2026'}).json();g=client.post('/api/groups',headers=h,json={'title':'Ομάδα Γ','course_id':c['id'],'period_id':p['id']}).json()
 s=client.post('/api/sessions',headers=h,json={'course_id':c['id'],'period_id':p['id'],'group_id':g['id'],'session_date':'2026-10-21','criteria':[{'name':'Ακρίβεια','weight':50},{'name':'Σαφήνεια','weight':50}],'presenters':[{'full_name':'Μαρία','presentation_title':None},{'full_name':'Νίκος','presentation_title':'Τίτλος'}]}).json();return c,p,g,s
def test_complete_acceptance_and_anonymization(client,admin):
 t=lecturer(client,admin);h=auth(t);c,p,g,s=setup(client,h);detail=client.get(f"/api/sessions/{s['id']}",headers=h).json();pid=detail['presentations'][0]['id'];criteria=detail['criteria']
 assert client.post(f"/api/sessions/{s['id']}/activate",headers=h).status_code==200
 raw=client.post(f"/api/public/sessions/{s['public_id']}/tokens").json()['token']
 assert client.put(f"/api/public/sessions/{s['public_id']}/vote",headers={'X-Participation-Token':raw},json={'scores':{str(x['id']):5 for x in criteria}}).status_code==409
 client.post(f"/api/sessions/{s['id']}/presentations/{pid}/open",headers=h)
 assert client.put(f"/api/public/sessions/{s['public_id']}/vote",headers={'X-Participation-Token':raw},json={'scores':{str(x['id']):5 for x in criteria}}).status_code==200
 assert client.put(f"/api/public/sessions/{s['public_id']}/vote",headers={'X-Participation-Token':raw},json={'scores':{str(x['id']):4 for x in criteria}}).json()['vote_count']==1
 client.post(f"/api/sessions/{s['id']}/presentations/{pid}/close",headers=h);client.post(f"/api/sessions/{s['id']}/complete",headers=h)
 with SessionLocal() as db:
  assert db.scalar(select(func.count(Vote.id)))==0;assert db.scalar(select(func.count(ParticipationToken.id)))==0;assert db.scalar(select(func.count(AnonymousVoteScore.id)))==2
 result=client.get(f"/api/sessions/{s['id']}",headers=h).json()['results'][0];assert result['weighted_score']==4 and result['rank']==1
def test_live_edit_preserves_vote_and_history(client,admin):
 t=lecturer(client,admin);h=auth(t);*_,s=setup(client,h);d=client.get(f"/api/sessions/{s['id']}",headers=h).json();pid=d['presentations'][0]['id'];client.post(f"/api/sessions/{s['id']}/activate",headers=h);raw=client.post(f"/api/public/sessions/{s['public_id']}/tokens").json()['token'];client.post(f"/api/sessions/{s['id']}/presentations/{pid}/open",headers=h);client.put(f"/api/public/sessions/{s['public_id']}/vote",headers={'X-Participation-Token':raw},json={'scores':{str(x['id']):3 for x in d['criteria']}})
 assert client.put(f"/api/sessions/{s['id']}/presentations/{pid}",headers=h,json={'presenter_name':'Μαρία Νέα','title':'Νέος τίτλος'}).status_code==200
 with SessionLocal() as db:assert db.scalar(select(func.count(Vote.id)))==1 and db.scalar(select(func.count(PresentationEdit.id)))==2
def test_ownership_and_concurrent_isolation(client,admin):
 a=lecturer(client,admin,'auser');b=lecturer(client,admin,'buser');*_,sa=setup(client,auth(a));*_,sb=setup(client,auth(b));assert client.get(f"/api/sessions/{sa['id']}",headers=auth(b)).status_code==404;assert sa['public_id']!=sb['public_id']
def test_branding_override_and_invalid_image(client,admin):
 t=lecturer(client,admin);h=auth(t);c,*_=setup(client,h);client.put('/api/branding',headers=auth(admin),json={'university_name':'Πανεπιστήμιο','school_name':'Σχολή','background_type':'none','background_opacity':.1});client.put(f"/api/courses/{c['id']}/branding",headers=h,json={'department_name':'Τμήμα','background_type':'solid','background_value':'#ffffff','background_opacity':.1});r=client.post('/api/branding/logo',headers=auth(admin),files={'file':('bad.png',b'not image','image/png')});assert r.status_code==415
def test_locking_and_duplicate(client,admin):
 t=lecturer(client,admin);h=auth(t);*_,s=setup(client,h);client.post(f"/api/sessions/{s['id']}/activate",headers=h);token=client.post(f"/api/public/sessions/{s['public_id']}/tokens").json()['token'];client.patch(f"/api/sessions/{s['id']}/admission",headers=h,json={'locked':True});assert client.post(f"/api/public/sessions/{s['public_id']}/tokens").status_code==403;assert client.get(f"/api/public/sessions/{s['public_id']}/my-vote",headers={'X-Participation-Token':token}).status_code==200
 copy=client.post(f"/api/sessions/{s['id']}/duplicate",headers=h,json={'session_date':'2026-11-01'}).json();d=client.get(f"/api/sessions/{copy['id']}",headers=h).json();assert d['status']=='DRAFT' and all(x['vote_count']==0 for x in d['presentations'])

def test_only_admin_creates_users_and_lecturer_changes_password(client,admin):
 t=lecturer(client,admin);h=auth(t)
 assert client.post('/api/users',headers=h,json={'username':'forbidden','full_name':'No','password':'long-password','role':'LECTURER'}).status_code==403
 assert client.put('/api/auth/password',headers=h,json={'current_password':'wrong','new_password':'new-password-123'}).status_code==400
 assert client.put('/api/auth/password',headers=h,json={'current_password':'lecturer-password','new_password':'new-password-123'}).status_code==200
 assert client.post('/api/auth/login',json={'username':'lecturer','password':'lecturer-password'}).status_code==401
 assert client.post('/api/auth/login',json={'username':'lecturer','password':'new-password-123'}).status_code==200

