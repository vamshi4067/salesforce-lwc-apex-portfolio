// Run once in a sandbox. Dates use the executing user's Salesforce time zone.
List<Service_Slot__c> slots = new List<Service_Slot__c>();
List<String> names = new List<String>{'Alex Morgan','Sam Rivera','Jordan Lee'};
List<String> skills = new List<String>{'repair;maintenance','install;maintenance','repair;install'};
for(Integer d=1;d<=5;d++) {
    for(Integer t=0;t<3;t++) {
        for(Integer hour : new List<Integer>{9,11,14}) {
            if(t==2 && hour==11) continue;
            Datetime startTime=Datetime.newInstance(Date.today().addDays(d),Time.newInstance(hour,0,0,0));
            slots.add(new Service_Slot__c(Technician__c=names[t],Skills__c=skills[t],Start__c=startTime,End__c=startTime.addHours(2),Booked__c=false));
        }
    }
}
insert as user slots;
