export const stages=['Documents','Discovery','Configuration','Training','Review','Launch'];
function dateOffset(days){const d=new Date();d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function initial(){return {customer:'Northstar Coffee',contact:'Jamie Rivera',owner:'Alex Morgan',stage:'Documents',notes:[],blockers:[],activity:[],tasks:[
{id:'t1',stage:'Documents',subject:'Collect signed agreement',due:dateOffset(-2),required:true,complete:false},
{id:'t2',stage:'Documents',subject:'Confirm billing details',due:dateOffset(2),required:true,complete:false},
{id:'t7',stage:'Discovery',subject:'Confirm onboarding goals',due:dateOffset(3),required:true,complete:false},
{id:'t8',stage:'Discovery',subject:'Identify key stakeholders',due:dateOffset(4),required:true,complete:false},
{id:'t3',stage:'Configuration',subject:'Set up the customer workspace',due:dateOffset(5),required:true,complete:false},
{id:'t4',stage:'Configuration',subject:'Review access and permissions',due:dateOffset(6),required:true,complete:false},
{id:'t5',stage:'Training',subject:'Run the team training session',due:dateOffset(9),required:true,complete:false},
{id:'t9',stage:'Review',subject:'Review setup with the customer',due:dateOffset(10),required:true,complete:false},
{id:'t10',stage:'Review',subject:'Resolve outstanding questions',due:dateOffset(11),required:true,complete:false},
{id:'t6',stage:'Launch',subject:'Confirm launch readiness',due:dateOffset(12),required:true,complete:false}]};}
let plan=initial();
function event(text){plan.activity.unshift({id:String(Date.now())+Math.random(),text,date:dateOffset(0)});}
function dateValid(due){const parsed=new Date(due+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(due)&&!Number.isNaN(parsed.valueOf())&&parsed.toISOString().slice(0,10)===due;}
export function resetPlan(){plan=initial();}
export function getPlan(){return structuredClone(plan);}
export function completeTask(id){const task=plan.tasks.find(t=>t.id===id);if(!task)throw new Error('Task not found.');if(task.stage!==plan.stage)throw new Error('Only tasks in the current stage can be completed.');if(!task.complete){task.complete=true;event('Completed: '+task.subject);}return getPlan();}
export function advanceStage(){let index=stages.indexOf(plan.stage);if(index===stages.length-1)throw new Error('Launch is the final stage.');if(plan.blockers.some(b=>b.stage===plan.stage&&!b.resolved))throw new Error('Resolve the open blockers in this stage first.');if(plan.tasks.some(t=>t.stage===plan.stage&&t.required&&!t.complete))throw new Error('Complete the required tasks in this stage first.');plan.stage=stages[index+1];event('Moved to '+plan.stage+'.');return getPlan();}
export function addFollowUp(subject,due){subject=(subject||'').trim();const parsed=new Date(due+'T00:00:00Z');if(subject.length<3||subject.length>100)throw new Error('Enter a task name of 3 to 100 characters.');if(!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(parsed.valueOf())||parsed.toISOString().slice(0,10)!==due)throw new Error('Choose a valid due date.');const task={id:'f'+Date.now()+Math.random(),stage:plan.stage,subject,due,required:false,complete:false};plan.tasks.push(task);event('Added follow-up: '+subject+'.');return structuredClone(task);}

export function updateCustomer(data){const customer=(data.customer||'').trim(),contact=(data.contact||'').trim(),owner=(data.owner||'').trim(),note=(data.note||'').trim();if(customer.length<2||customer.length>100||contact.length<2||contact.length>100||owner.length<2||owner.length>100||note.length>500)throw new Error('Enter a customer, contact and manager (2–100 characters); notes can be up to 500 characters.');plan.customer=customer;plan.contact=contact;plan.owner=owner;if(note){plan.notes.unshift(note);event('Customer note: '+note);}else event('Customer details updated.');return getPlan();}
export function updateTask(id,owner,due){const task=plan.tasks.find(t=>t.id===id);if(!task||task.stage!==plan.stage)throw new Error('Choose a task in the current stage.');owner=(owner||'').trim();if(owner.length<2||owner.length>100||!dateValid(due))throw new Error('Enter a task owner and valid due date.');task.owner=owner;task.due=due;event('Updated owner and due date: '+task.subject+'.');return getPlan();}
export function addBlocker(text){text=(text||'').trim();if(text.length<3||text.length>300)throw new Error('Enter a blocker of 3 to 300 characters.');const blocker={id:'b'+Date.now()+Math.random(),text,stage:plan.stage,resolved:false};plan.blockers.unshift(blocker);event('Blocker added: '+text+'.');return structuredClone(blocker);}
export function resolveBlocker(id){const blocker=plan.blockers.find(b=>b.id===id);if(!blocker||blocker.stage!==plan.stage||blocker.resolved)throw new Error('Select an open blocker in the current stage.');blocker.resolved=true;event('Blocker resolved: '+blocker.text+'.');return getPlan();}
