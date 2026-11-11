public with sharing class OnboardingController {
    private static final List<String> STAGES = new List<String>{'Documents','Discovery','Configuration','Training','Review','Launch'};
    @AuraEnabled(cacheable=true)
    public static Account getCustomer(Id accountId) {
        List<Account> rows=[SELECT Id,Name,Onboarding_Stage__c FROM Account WHERE Id=:accountId WITH USER_MODE LIMIT 1];
        if(rows.isEmpty()) throw new AuraHandledException('Customer not found or not accessible.');
        return rows[0];
    }
    @AuraEnabled(cacheable=true)
    public static List<Task> getTasks(Id accountId) {
        return [SELECT Id,Subject,Status,ActivityDate,Onboarding_Stage__c,Onboarding_Required__c
          FROM Task WHERE WhatId=:accountId AND Onboarding_Stage__c != null WITH USER_MODE ORDER BY ActivityDate ASC NULLS LAST LIMIT 200];
    }
    @AuraEnabled
    public static void completeTask(Id accountId, Id taskId) {
        if(accountId==null || taskId==null) throw new AuraHandledException('Select a customer and task.');
        List<Account> accounts=[SELECT Id,Onboarding_Stage__c FROM Account WHERE Id=:accountId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if(accounts.isEmpty())throw new AuraHandledException('Customer not found or not accessible.');
        List<Task> tasks=[SELECT Id,Status,Onboarding_Stage__c FROM Task WHERE Id=:taskId AND WhatId=:accountId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if(tasks.isEmpty() || tasks[0].Onboarding_Stage__c!=accounts[0].Onboarding_Stage__c)throw new AuraHandledException('Select a task in the current stage.');
        Task task=tasks[0];task.Status='Completed';update as user task;
    }
    @AuraEnabled
    public static void advanceStage(Id accountId) {
        if(accountId==null)throw new AuraHandledException('Select a customer.');
        List<Account> rows=[SELECT Id,Onboarding_Stage__c FROM Account WHERE Id=:accountId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if(rows.isEmpty())throw new AuraHandledException('Customer not found or not accessible.');
        Account customer=rows[0];Integer position=STAGES.indexOf(customer.Onboarding_Stage__c);
        if(position<0 || position>=STAGES.size()-1)throw new AuraHandledException('This customer has no valid next stage.');
        String currentStage=customer.Onboarding_Stage__c;
        List<Task> requiredTasks=[SELECT Id,Status FROM Task WHERE WhatId=:accountId AND Onboarding_Stage__c=:currentStage AND Onboarding_Required__c=true WITH USER_MODE LIMIT 200];
        if(requiredTasks.isEmpty())throw new AuraHandledException('Add the required tasks for this stage before continuing.');
        if(requiredTasks.size()>=200)throw new AuraHandledException('Too many required tasks to verify. Contact an administrator.');
        for(Task item:requiredTasks) if(item.Status!='Completed')throw new AuraHandledException('Complete the required tasks in this stage first.');
        customer.Onboarding_Stage__c=STAGES[position+1];update as user customer;
    }
    @AuraEnabled
    public static void addFollowUp(Id accountId, String subject, Date dueDate) {
        if(accountId==null || String.isBlank(subject) || subject.trim().length()<3 || subject.length()>100 || dueDate==null)throw new AuraHandledException('Enter a task name of 3 to 100 characters and a due date.');
        List<Account> rows=[SELECT Id,Onboarding_Stage__c FROM Account WHERE Id=:accountId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if(rows.isEmpty() || !STAGES.contains(rows[0].Onboarding_Stage__c))throw new AuraHandledException('Customer has no valid onboarding stage.');
        Task item=new Task(WhatId=accountId,Subject=subject.trim(),ActivityDate=dueDate,Status='Not Started',Priority='Normal',Onboarding_Stage__c=rows[0].Onboarding_Stage__c,Onboarding_Required__c=false);
        insert as user item;
    }
}
