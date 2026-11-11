public with sharing class CaseDeskController {
    @AuraEnabled(cacheable=true)
    public static List<Case> getCases() {
        return [SELECT Id, CaseNumber, Subject, Description, Status, Priority, Origin, Contact.Name
            FROM Case WITH USER_MODE ORDER BY LastModifiedDate DESC LIMIT 50];
    }
    @AuraEnabled
    public static void updateCase(Id caseId, String status, String priority, String note) {
        if (caseId == null || !new Set<String>{'New','Working','Closed'}.contains(status)
            || !new Set<String>{'High','Medium','Low'}.contains(priority)) {
            throw new AuraHandledException('Choose a valid case, status and priority.');
        }
        if (note != null && note.length() > 500) throw new AuraHandledException('Notes must be 500 characters or fewer.');
        List<Case> rows = [SELECT Id, Description, Status, Priority FROM Case WHERE Id = :caseId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if (rows.isEmpty()) throw new AuraHandledException('Case not found or not accessible.');
        Case record = rows[0];
        if (status == 'Closed' && record.Status != 'Closed' && String.isBlank(note)) {
            throw new AuraHandledException('Add a resolution note before closing this case.');
        }
        record.Status = status;
        record.Priority = priority;
        update as user record;
        if (String.isNotBlank(note)) {
            CaseComment comment = new CaseComment(ParentId=record.Id, CommentBody=note.trim(), IsPublished=false);
            insert as user comment;
        }
    }
    @AuraEnabled
    public static Id createCase(String subject, String description, String priority) {
        if (String.isBlank(subject) || subject.trim().length() < 3 || subject.length() > 255 ||
            String.isBlank(description) || description.trim().length() < 5 || description.length() > 2000 ||
            !new Set<String>{'High','Medium','Low'}.contains(priority)) {
            throw new AuraHandledException('Enter a valid subject, description and priority.');
        }
        Case created = new Case(Subject=subject.trim(), Description=description.trim(), Priority=priority, Status='New', Origin='Web');
        insert as user created;
        return created.Id;
    }
    @AuraEnabled
    public static void assignAndSchedule(Id caseId, Id ownerId, Date followUp) {
        if (caseId == null || ownerId == null || (ownerId.getSObjectType() != User.SObjectType && ownerId.getSObjectType() != Group.SObjectType)) {
            throw new AuraHandledException('Select a valid case owner.');
        }
        List<Case> rows = [SELECT Id, OwnerId, Follow_Up_Date__c FROM Case WHERE Id=:caseId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if (rows.isEmpty()) throw new AuraHandledException('Case not found or not accessible.');
        Case target=rows[0]; target.OwnerId=ownerId; target.Follow_Up_Date__c=followUp;
        update as user target;
    }
    @AuraEnabled
    public static void escalate(Id caseId, String reason) {
        if (caseId == null || String.isBlank(reason) || reason.trim().length() > 500) throw new AuraHandledException('Add a reason for escalation (up to 500 characters).');
        List<Case> rows=[SELECT Id, Status, IsEscalated FROM Case WHERE Id=:caseId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if (rows.isEmpty()) throw new AuraHandledException('Case not found or not accessible.');
        if (rows[0].Status=='Closed') throw new AuraHandledException('Reopen the case before escalating it.');
        Case target=rows[0]; target.IsEscalated=true;
        update as user target;
        CaseComment comment = new CaseComment(ParentId=caseId, CommentBody='Escalation: '+reason.trim(), IsPublished=false);
        insert as user comment;
    }
    @AuraEnabled
    public static List<CaseComment> getInternalNotes(Id caseId) {
        if (caseId == null) return new List<CaseComment>();
        return [SELECT Id, CommentBody, CreatedDate FROM CaseComment WHERE ParentId=:caseId AND IsPublished=false WITH USER_MODE ORDER BY CreatedDate DESC LIMIT 100];

    }
}
