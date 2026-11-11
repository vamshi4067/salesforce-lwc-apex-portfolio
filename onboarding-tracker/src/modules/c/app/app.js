import {LightningElement} from 'lwc';
import {getPlan,resetPlan,completeTask,advanceStage,addFollowUp,stages,updateCustomer,updateTask,addBlocker,resolveBlocker} from 'c/onboardingService';
export default class App extends LightningElement {
 plan={tasks:[]};viewStage='Documents';tab='journey';showForm=false;subject='';due='';editTaskId='';taskOwner='';taskDue='';blockerText='';customerName='';customerContact='';customerOwner='';customerNote='';showCustomer=false;error='';message='';
 connectedCallback(){this.refresh();}
 refresh(){this.plan=getPlan();}
 get isJourney(){return this.tab==='journey';}get isAbout(){return this.tab==='about';}
 get stageIndex(){return stages.indexOf(this.plan.stage);}
 get stageRows(){return stages.map((name,i)=>({name,number:'0'+(i+1),state:i<this.stageIndex?'Complete':i===this.stageIndex?'In progress':'Upcoming',css:(i<this.stageIndex?'stage complete':i===this.stageIndex?'stage current':'stage')+(name===this.viewStage?' selected':''),pressed:name===this.viewStage}));}
 get currentTasks(){const now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');return this.plan.tasks.filter(t=>t.stage===this.viewStage).map(t=>({...t,dateLabel:t.complete?'Completed':this.canEdit&&t.due<today?'Overdue · '+t.due:'Due '+t.due,css:t.complete?'task done':this.canEdit&&t.due<today?'task overdue':'task',ownerLabel:'Owner · '+(t.owner||this.plan.owner),buttonLabel:'Complete '+t.subject}));}
 get taskEditing(){return Boolean(this.editTaskId);} get blockers(){return (this.plan.blockers||[]).filter(b=>b.stage===this.viewStage).map(b=>({...b,canResolve:!b.resolved&&this.canEdit}));} get activity(){return this.plan.activity||[];} get hasActivity(){return this.activity.length>0;} get hasBlockers(){return this.blockers.length>0;} get notes(){return (this.plan.notes||[]).map((text,i)=>({id:i,text}));}
 get canEdit(){return this.viewStage===this.plan.stage;} get stageCaption(){return this.canEdit?'CURRENT STAGE':'STAGE PREVIEW';}
 get completeCount(){return this.plan.tasks.filter(t=>t.required&&t.complete).length;}get totalCount(){return this.plan.tasks.filter(t=>t.required).length;}
 get progress(){return Math.round((this.completeCount/this.totalCount)*100)+'%';}get progressStyle(){return 'width:'+this.progress;}
 get remaining(){return this.plan.tasks.filter(t=>t.stage===this.plan.stage&&t.required&&!t.complete).length;}
 get readyMessage(){if(!this.canEdit)return stages.indexOf(this.viewStage)<this.stageIndex?'Review the work completed in this stage.':'Preview upcoming work. Complete stages in order to make changes.';return this.remaining===0?'The required work for this stage is complete.':this.remaining+' required task(s) to finish before moving on.';}
 get isFinal(){return this.stageIndex===stages.length-1;}get nextLabel(){return this.isFinal?'Final stage':'Continue to '+stages[this.stageIndex+1];}
 viewStageChanged(e){this.viewStage=e.currentTarget.dataset.stage;this.showForm=false;this.editTaskId='';this.error='';this.message='';}
 returnToCurrent(){this.viewStage=this.plan.stage;this.error='';this.message='';}
 navigate(e){this.tab=e.currentTarget.dataset.tab;this.message='';this.error='';}
 openCustomer(){this.customerName=this.plan.customer;this.customerContact=this.plan.contact;this.customerOwner=this.plan.owner;this.customerNote='';this.showCustomer=!this.showCustomer;}
 customerField(e){this[e.target.dataset.field]=e.target.value;}
 saveCustomer(){try{updateCustomer({customer:this.customerName,contact:this.customerContact,owner:this.customerOwner,note:this.customerNote});this.showCustomer=false;this.error='';this.message='Customer details saved.';this.refresh();}catch(e){this.error=e.message;}}
 editTask(e){const t=this.plan.tasks.find(t=>t.id===e.currentTarget.dataset.id);this.editTaskId=t.id;this.taskOwner=t.owner||this.plan.owner;this.taskDue=t.due;this.error='';}
 editOwner(e){this.taskOwner=e.target.value;} editDue(e){this.taskDue=e.target.value;}
 saveTask(){try{updateTask(this.editTaskId,this.taskOwner,this.taskDue);this.editTaskId='';this.error='';this.message='Task updated.';this.refresh();}catch(e){this.error=e.message;}}
 cancelTask(){this.editTaskId='';} blockerChanged(e){this.blockerText=e.target.value;}
 addBlockerAction(){try{addBlocker(this.blockerText);this.blockerText='';this.error='';this.message='Blocker added.';this.refresh();}catch(e){this.error=e.message;}}
 resolveBlockerAction(e){try{resolveBlocker(e.currentTarget.dataset.id);this.error='';this.message='Blocker resolved.';this.refresh();}catch(e){this.error=e.message;}}
 toggleForm(){this.showForm=!this.showForm;this.error='';}
 subjectChanged(e){this.subject=e.target.value;}dueChanged(e){this.due=e.target.value;}
 addTask(){try{addFollowUp(this.subject,this.due);this.subject='';this.due='';this.showForm=false;this.message='Follow-up added.';this.error='';this.refresh();}catch(e){this.error=e.message;this.message='';}}
 finish(e){try{completeTask(e.currentTarget.dataset.id);this.message='Task completed.';this.error='';this.refresh();}catch(e){this.error=e.message;}}
 advance(){try{advanceStage();this.viewStage=getPlan().stage;this.message='Moved to '+getPlan().stage+'.';this.error='';this.refresh();}catch(e){this.error=e.message;this.message='';}}
 reset(){resetPlan();this.viewStage=getPlan().stage;this.showForm=false;this.showCustomer=false;this.editTaskId='';this.blockerText='';this.subject='';this.due='';this.error='';this.message='Sample journey restored.';this.refresh();}
}
