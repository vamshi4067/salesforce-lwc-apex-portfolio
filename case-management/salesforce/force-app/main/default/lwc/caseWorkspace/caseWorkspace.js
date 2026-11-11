import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getCases from '@salesforce/apex/CaseDeskController.getCases';
import updateCase from '@salesforce/apex/CaseDeskController.updateCase';
import createCase from '@salesforce/apex/CaseDeskController.createCase';
import assignAndSchedule from '@salesforce/apex/CaseDeskController.assignAndSchedule';
import escalate from '@salesforce/apex/CaseDeskController.escalate';
import getInternalNotes from '@salesforce/apex/CaseDeskController.getInternalNotes';
export default class CaseWorkspace extends LightningElement {
    rows=[]; ownerId=''; followUp; reason=''; newSubject=''; newDescription=''; notes=[]; selectedId; status='New'; priority='Medium'; note=''; error; message; wiredCases;
    statusOptions=[{label:'New',value:'New'},{label:'Working',value:'Working'},{label:'Closed',value:'Closed'}];
    priorityOptions=[{label:'High',value:'High'},{label:'Medium',value:'Medium'},{label:'Low',value:'Low'}];
    @wire(getCases) receiveCases(result){this.wiredCases=result;if(result.data){this.rows=result.data;this.error=undefined;}else if(result.error){this.error=result.error.body?.message || 'Could not load cases.';}}
    get hasSelection(){return Boolean(this.selectedId);}
    select(event){this.selectedId=event.currentTarget.dataset.id;const selected=this.rows.find(row=>row.Id===this.selectedId);this.status=selected.Status;this.priority=selected.Priority;this.note='';this.message='';this.loadNotes();}
    async loadNotes(){try{this.notes=await getInternalNotes({caseId:this.selectedId});}catch(e){this.error=e.body?.message || 'Could not load notes.';}}
    changeOwner(e){this.ownerId=e.target.value;} changeFollowUp(e){this.followUp=e.target.value;} changeReason(e){this.reason=e.target.value;} changeNewSubject(e){this.newSubject=e.target.value;} changeNewDescription(e){this.newDescription=e.target.value;}
    async create(){try{await createCase({subject:this.newSubject,description:this.newDescription,priority:this.priority});this.newSubject='';this.newDescription='';this.error=undefined;this.message='Case created.';await refreshApex(this.wiredCases);}catch(e){this.error=e.body?.message || 'Could not create this case.';}}
    async assign(){try{await assignAndSchedule({caseId:this.selectedId,ownerId:this.ownerId,followUp:this.followUp || null});this.message='Assignment and follow-up updated.';this.error=undefined;await refreshApex(this.wiredCases);}catch(e){this.error=e.body?.message || 'Could not assign this case.';}}
    async escalateSelected(){try{await escalate({caseId:this.selectedId,reason:this.reason});this.reason='';this.message='Case escalated.';this.error=undefined;await refreshApex(this.wiredCases);await this.loadNotes();}catch(e){this.error=e.body?.message || 'Could not escalate this case.';}}
    changeStatus(event){this.status=event.detail.value;}
    changePriority(event){this.priority=event.detail.value;}
    changeNote(event){this.note=event.target.value;}
    async save(){try{await updateCase({caseId:this.selectedId,status:this.status,priority:this.priority,note:this.note});this.note='';this.message='Case updated.';this.error=undefined;await refreshApex(this.wiredCases);await this.loadNotes();}catch(e){this.error=e.body?.message || 'Could not update this case.';this.message='';}}
}
