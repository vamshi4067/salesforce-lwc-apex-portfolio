import test from 'node:test';
import assert from 'node:assert/strict';
import { listCases, updateCase, resetCases } from '../src/modules/c/caseService/caseService.js';
test('filter cases and update a case without changing other records', () => {
 resetCases(); const all=listCases(); assert.ok(all.length>=3); assert.ok(listCases('High').every(c=>c.priority==='High'));
 const item=all.find(c=>c.status!=='Closed'); const next=updateCase(item.id,{status:'Working',priority:'High',note:'Investigating the issue.'});
 assert.equal(next.status,'Working'); assert.equal(next.priority,'High'); assert.equal(next.notes.at(-1),'Investigating the issue.'); assert.equal(listCases().length,all.length);
});
test('invalid input cannot change a case', () => {
 resetCases(); const item=listCases()[0]; assert.throws(()=>updateCase(item.id,{status:'Not a status'})); assert.throws(()=>updateCase('missing',{status:'Closed'})); assert.deepEqual(listCases()[0],item);
});
test('search and status filters narrow the queue together',()=>{
 resetCases(); const result=listCases('All','Working','daniel'); assert.equal(result.length,1); assert.equal(result[0].customer,'Daniel Kim'); assert.equal(listCases('High','Closed','maya').length,0);
});
test('closing a case requires a resolution note and a closed case can be reopened',()=>{
 resetCases(); const item=listCases().find(c=>c.status==='New'); assert.throws(()=>updateCase(item.id,{status:'Closed',priority:item.priority,note:''}),/resolution note/i); assert.equal(listCases().find(c=>c.id===item.id).status,'New');
 assert.equal(updateCase(item.id,{status:'Closed',priority:item.priority,note:'Replacement sent.'}).status,'Closed'); assert.equal(updateCase(item.id,{status:'Working',priority:item.priority,note:''}).status,'Working');
});
test('create validates input and creates an assigned case with a timeline', async()=>{
 const {createCase}=await import('../src/modules/c/caseService/caseService.js');resetCases();
 assert.throws(()=>createCase({subject:'x',customer:'',description:'x'}));
 const c=createCase({subject:'Package missing',customer:'Mina Lee',description:'Package did not arrive.',priority:'High',owner:'Jordan Lee',followUp:'2030-05-01'});
 assert.equal(c.status,'New');assert.equal(c.owner,'Jordan Lee');assert.equal(c.followUp,'2030-05-01');assert.ok(c.activity.length);assert.equal(listCases()[0].id,c.id);
});
test('assignment, follow-up and escalation are validated and recorded',()=>{
 resetCases();const before=listCases()[0];
 assert.throws(()=>updateCase(before.id,{escalate:true,escalationReason:' '}),/reason/i);assert.deepEqual(listCases()[0],before);
 const after=updateCase(before.id,{owner:'Support queue',followUp:'2030-05-01',escalate:true,escalationReason:'Customer impact'});
 assert.equal(after.owner,'Support queue');assert.equal(after.escalated,true);assert.equal(after.followUp,'2030-05-01');assert.ok(after.activity.some(a=>a.text.includes('Customer impact')));
 assert.throws(()=>updateCase(before.id,{followUp:'2030-99-99'}),/date/i);
});
