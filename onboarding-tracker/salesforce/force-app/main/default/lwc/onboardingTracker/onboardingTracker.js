import {LightningElement,api,wire} from 'lwc';
import {refreshApex} from '@salesforce/apex';
import getCustomer from '@salesforce/apex/OnboardingController.getCustomer';
import getTasks from '@salesforce/apex/OnboardingController.getTasks';
import completeTask from '@salesforce/apex/OnboardingController.completeTask';
import advanceStage from '@salesforce/apex/OnboardingController.advanceStage';
import addFollowUp from '@salesforce/apex/OnboardingController.addFollowUp';
export default class OnboardingTracker extends LightningElement {
 @api recordId;customer;tasks=[];customerWire;tasksWire;subject='';dueDate;error;message;
 @wire(getCustomer,{accountId:'$recordId'}) customerResult(result){this.customerWire=result;if(result.data)this.customer=result.data;else if(result.error)this.error=result.error.body?.message;}
 @wire(getTasks,{accountId:'$recordId'}) tasksResult(result){this.tasksWire=result;if(result.data)this.tasks=result.data;else if(result.error)this.error=result.error.body?.message;}
 get currentTasks(){return this.tasks.filter(t=>t.Onboarding_Stage__c===this.customer?.Onboarding_Stage__c).map(t=>({...t,done:t.Status==='Completed'}));}
 get total(){return this.tasks.filter(t=>t.Onboarding_Required__c).length;}get completed(){return this.tasks.filter(t=>t.Onboarding_Required__c&&t.Status==='Completed').length;}get percentage(){return this.total?Math.round(100*this.completed/this.total):0;}
 subjectChanged(e){this.subject=e.target.value;}dueChanged(e){this.dueDate=e.target.value;}
 async refresh(){await Promise.all([refreshApex(this.customerWire),refreshApex(this.tasksWire)]);}
 async finish(e){try{await completeTask({accountId:this.recordId,taskId:e.currentTarget.dataset.id});this.error=undefined;this.message='Task completed.';await this.refresh();}catch(e){this.error=e.body?.message||'Could not complete task.';}}
 async next(){try{await advanceStage({accountId:this.recordId});this.error=undefined;this.message='Stage updated.';await this.refresh();}catch(e){this.error=e.body?.message||'Could not advance stage.';}}
 async add(){try{await addFollowUp({accountId:this.recordId,subject:this.subject,dueDate:this.dueDate});this.subject='';this.dueDate=null;this.error=undefined;this.message='Follow-up added.';await this.refresh();}catch(e){this.error=e.body?.message||'Could not add follow-up.';}}
}
