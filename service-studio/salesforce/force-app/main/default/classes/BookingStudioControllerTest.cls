@IsTest
private class BookingStudioControllerTest {
    private static Service_Slot__c slot() {
        Datetime startTime = Datetime.newInstance(Date.today().addDays(1), Time.newInstance(9,0,0,0));
        Service_Slot__c result = new Service_Slot__c(Technician__c='Alex Morgan', Skills__c='repair;maintenance', Start__c=startTime, End__c=startTime.addHours(2), Booked__c=false);
        insert result; return result;
    }
    @IsTest static void availabilityMatchesSkills() {
        slot();
        Assert.areEqual(1, BookingStudioController.getSlots('repair',Date.today().addDays(1)).size());
        Assert.areEqual(0, BookingStudioController.getSlots('install',Date.today().addDays(1)).size());
    }
    @IsTest static void reservesAndReleasesSlot() {
        Service_Slot__c available=slot();
        Service_Booking__c booking=BookingStudioController.book(available.Id,'repair','Maya Patel','maya@example.com','24 Cedar Lane, Boston');
        Assert.areEqual('Confirmed',booking.Status__c);
        Assert.areEqual(0, BookingStudioController.getSlots('repair',Date.today().addDays(1)).size());
        try { BookingStudioController.book(available.Id,'repair','Maya Patel','maya@example.com','24 Cedar Lane, Boston'); Assert.fail('Double booking accepted'); }
        catch(AuraHandledException expected) { }
        BookingStudioController.cancel(booking.Id);
        Assert.areEqual(1,BookingStudioController.getSlots('repair',Date.today().addDays(1)).size());
        try { BookingStudioController.cancel(booking.Id); Assert.fail('Repeat cancellation accepted'); }
        catch(AuraHandledException expected) { }
    }
    @IsTest static void rejectsInvalidRequests() {
        Service_Slot__c available=slot();
        try { BookingStudioController.book(available.Id,'install','Maya Patel','maya@example.com','24 Cedar Lane, Boston'); Assert.fail('Wrong skill accepted'); }
        catch(AuraHandledException expected) { }
        try { BookingStudioController.book(available.Id,'repair','Maya Patel','invalid','24 Cedar Lane, Boston'); Assert.fail('Invalid email accepted'); }
        catch(AuraHandledException expected) { }
        try { BookingStudioController.getSlots('repair',Date.today()); Assert.fail('Past date accepted'); }
        catch(AuraHandledException expected) { }
    }
}
