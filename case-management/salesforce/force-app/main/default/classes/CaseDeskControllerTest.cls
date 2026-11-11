@IsTest
private class CaseDeskControllerTest {
    @IsTest static void updatesAndValidates() {
        Case c = new Case(Subject='Broken screen', Status='New', Priority='Medium', Origin='Web');
        insert c;
        Test.startTest();
        CaseDeskController.updateCase(c.Id,'Working','High','Replacement requested');
        List<Case> visibleCases = CaseDeskController.getCases();
        Test.stopTest();
        Case saved=[SELECT Status, Priority, Description FROM Case WHERE Id=:c.Id];
        System.assertEquals('Working', saved.Status);
        System.assertEquals('High', saved.Priority);
        System.assertEquals(1, [SELECT count() FROM CaseComment WHERE ParentId=:c.Id]);
        System.assert(!visibleCases.isEmpty());
        Id createdId=CaseDeskController.createCase('Delivery missing','The delivery did not arrive.','High');
        CaseDeskController.assignAndSchedule(createdId, UserInfo.getUserId(), Date.today().addDays(1));
        CaseDeskController.escalate(createdId, 'Customer is waiting');
        System.assertEquals(1, CaseDeskController.getInternalNotes(createdId).size());
        Case created=[SELECT OwnerId,Follow_Up_Date__c,IsEscalated FROM Case WHERE Id=:createdId];
        System.assertEquals(Date.today().addDays(1),created.Follow_Up_Date__c);
        System.assertEquals(true,created.IsEscalated);
        try { CaseDeskController.updateCase(c.Id,'Closed','High',''); System.assert(false, 'Closing requires a note'); }
        catch (AuraHandledException expected) { System.assertNotEquals(null, expected); }
        CaseDeskController.updateCase(c.Id,'Closed','High','Replacement shipped');
        CaseDeskController.updateCase(c.Id,'Working','Medium','');
        System.assertEquals('Working', [SELECT Status FROM Case WHERE Id=:c.Id].Status);
        try { CaseDeskController.updateCase(c.Id,'Invalid','High',''); System.assert(false, 'Expected validation error'); }
        catch (AuraHandledException expected) { System.assertNotEquals(null, expected); }
    }
}
