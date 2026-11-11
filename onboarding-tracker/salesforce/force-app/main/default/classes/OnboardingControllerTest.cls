@IsTest private class OnboardingControllerTest {
 @IsTest static void validatesStageAndCreatesFollowUp(){
  Account customer=new Account(Name='Northstar Coffee',Onboarding_Stage__c='Documents');insert customer;
  Task requiredTask=new Task(WhatId=customer.Id,Subject='Collect agreement',Status='Not Started',Priority='Normal',Onboarding_Stage__c='Documents',Onboarding_Required__c=true);insert requiredTask;
  try{OnboardingController.advanceStage(customer.Id);System.assert(false,'Incomplete required work must block advancement');}catch(AuraHandledException expected){System.assertNotEquals(null,expected);}
  Test.startTest();OnboardingController.addFollowUp(customer.Id,'Call customer',Date.today().addDays(1));OnboardingController.completeTask(customer.Id,requiredTask.Id);OnboardingController.advanceStage(customer.Id);Test.stopTest();
  Account saved=[SELECT Onboarding_Stage__c FROM Account WHERE Id=:customer.Id];System.assertEquals('Discovery',saved.Onboarding_Stage__c);
  System.assertEquals(2,OnboardingController.getTasks(customer.Id).size());
 }
}
