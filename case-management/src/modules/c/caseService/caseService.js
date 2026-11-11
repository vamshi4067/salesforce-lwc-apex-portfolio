const seed = [
 {id:'1048',subject:'Order arrived with a damaged screen',customer:'Maya Thompson',email:'maya@example.com',company:'Northwind Studio',priority:'High',status:'New',channel:'Email',description:'My order arrived this morning, but the screen has a crack in the corner. Could you help me arrange a replacement?',notes:['Customer attached a photo of the damage.']},
 {id:'1047',subject:'Unable to sign in after password reset',customer:'Daniel Kim',email:'daniel@example.com',company:'Harbor & Co.',priority:'Medium',status:'Working',channel:'Web',description:'The reset link worked, but I still receive an error when signing in.',notes:['Asked the customer to confirm the email on their account.']},
 {id:'1046',subject:'Question about an invoice',customer:'Aisha Patel',email:'aisha@example.com',company:'Elm Street Design',priority:'Low',status:'New',channel:'Phone',description:'There is an unfamiliar charge on our latest invoice. Please help clarify it.',notes:[]},
 {id:'1045',subject:'Delivery address needs updating',customer:'Noah Williams',email:'noah@example.com',company:'Parkside Works',priority:'Medium',status:'Closed',channel:'Email',description:'I entered the wrong delivery address when placing my order.',notes:['Address updated before dispatch.']}
];
const owners=['Support queue','Jordan Lee','Sam Rivera','Alex Morgan'];
const priorities=['High','Medium','Low'], statuses=['New','Working','Closed'];
const today=()=>new Date().toLocaleDateString('en-CA');
function validDate(value){if(!value)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0,10)===value;}
function initial(){return structuredClone(seed).map(c=>({...c,owner:'Support queue',followUp:'',escalated:false,activity:[{id:'initial',text:'Case added to the support queue.',date:'Sample activity'}]}));}
let cases=initial();
export function resetCases(){cases=initial();}
export function listCases(priority='All',status='All',search=''){const q=search.trim().toLowerCase();return structuredClone(cases.filter(c=>(priority==='All'||c.priority===priority) && (status==='All'||c.status===status) && (!q || [c.id,c.subject,c.customer,c.company].some(v=>v.toLowerCase().includes(q)))));}
function addActivity(item,text){item.activity.unshift({id:String(Date.now())+Math.random(),text,date:today()});}
export function createCase(data){
 const subject=(data.subject||'').trim(), customer=(data.customer||'').trim(),description=(data.description||'').trim();
 if(subject.length<3 || subject.length>255 || customer.length<2 || customer.length>100 || description.length<5 || description.length>2000)throw new Error('Enter a customer, a subject of at least 3 characters, and a description of at least 5 characters.');
 const priority=data.priority||'Medium',owner=data.owner||'Support queue',followUp=data.followUp||'';
 if(!priorities.includes(priority)||!owners.includes(owner)||!validDate(followUp))throw new Error('Choose a valid priority, owner and follow-up date.');
 const id=String(Math.max(...cases.map(c=>Number(c.id)),1048)+1);const item={id,subject,customer,description,company:(data.company||'').trim()||'Individual customer',email:(data.email||'').trim()||'Not provided',priority,owner,followUp,status:'New',channel:'Web',escalated:false,notes:[],activity:[]};
 addActivity(item,'Case created and assigned to '+owner+'.');cases.unshift(item);return structuredClone(item);
}
export function updateCase(id, changes){
 const item=cases.find(c=>c.id===id); if(!item) throw new Error('Case not found.');
 if(changes.status && !statuses.includes(changes.status)) throw new Error('Choose a valid status.');
 if(changes.priority && !priorities.includes(changes.priority)) throw new Error('Choose a valid priority.');
 if(changes.owner && !owners.includes(changes.owner))throw new Error('Choose a valid owner.');
 if(changes.followUp!==undefined && !validDate(changes.followUp))throw new Error('Enter a valid follow-up date.');
 if(changes.status==='Closed' && item.status!=='Closed' && !changes.note?.trim()) throw new Error('Add a resolution note before closing this case.');
 if(changes.note && changes.note.trim().length>500) throw new Error('Notes must be 500 characters or fewer.');
 if(changes.escalate && (!changes.escalationReason || !changes.escalationReason.trim()))throw new Error('Add a reason for escalation.');
 if(changes.escalationReason && changes.escalationReason.trim().length>500)throw new Error('Escalation reason must be 500 characters or fewer.');
 if(changes.escalate && (item.status==='Closed' || changes.status==='Closed'))throw new Error('Reopen the case before escalating it.');
 if(changes.status && changes.status!==item.status){addActivity(item,'Status changed from '+item.status+' to '+changes.status+'.');item.status=changes.status;}
 if(changes.priority && changes.priority!==item.priority){addActivity(item,'Priority changed from '+item.priority+' to '+changes.priority+'.');item.priority=changes.priority;}
 if(changes.owner && changes.owner!==item.owner){item.owner=changes.owner;addActivity(item,'Assigned to '+item.owner+'.');}
 if(changes.followUp!==undefined && changes.followUp!==item.followUp){item.followUp=changes.followUp;addActivity(item,item.followUp?'Follow-up set for '+item.followUp+'.':'Follow-up date cleared.');}
 if(changes.note?.trim()){item.notes.push(changes.note.trim());addActivity(item,'Note added: '+changes.note.trim());}
 if(changes.escalate){item.escalated=true;addActivity(item,'Escalated: '+changes.escalationReason.trim());}
 return structuredClone(item);
}
