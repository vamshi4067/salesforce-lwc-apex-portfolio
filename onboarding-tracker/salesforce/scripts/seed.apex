// Run in a sandbox only: sf apex run --file scripts/seed.apex --target-org YOUR_ORG
Account a=new Account(Name='Northstar Coffee',Onboarding_Stage__c='Documents');insert a;
List<Task> tasks=new List<Task>();
for(String stage:new List<String>{'Documents','Discovery','Configuration','Training','Review','Launch'}){
 tasks.add(new Task(WhatId=a.Id,Subject='Complete '+stage,ActivityDate=Date.today().addDays(3),Status='Not Started',Priority='Normal',Onboarding_Stage__c=stage,Onboarding_Required__c=true));
}insert tasks;System.debug('Sample Account: '+a.Id);
