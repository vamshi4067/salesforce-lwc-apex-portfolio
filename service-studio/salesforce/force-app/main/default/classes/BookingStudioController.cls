public with sharing class BookingStudioController {
    private static void validateService(String service) {
        if (!new Set<String>{'repair','install','maintenance'}.contains(service)) {
            throw new AuraHandledException('Choose a valid service.');
        }
    }
    @AuraEnabled
    public static List<Service_Slot__c> getSlots(String service, Date day) {
        validateService(service);
        if (day == null || day <= Date.today() || day > Date.today().addDays(5)) {
            throw new AuraHandledException('Choose a date in the next five days.');
        }
        Datetime startTime = Datetime.newInstance(day, Time.newInstance(0,0,0,0));
        Datetime endTime = startTime.addDays(1);
        String skillPattern = '%' + service + '%';
        return [SELECT Id, Name, Technician__c, Start__c, End__c, Skills__c
            FROM Service_Slot__c WHERE Start__c >= :startTime AND Start__c < :endTime
            AND Booked__c = false AND Skills__c LIKE :skillPattern
            WITH USER_MODE ORDER BY Start__c, Technician__c LIMIT 100];
    }
    @AuraEnabled
    public static Service_Booking__c book(Id slotId, String service, String customer, String email, String address) {
        validateService(service);
        if (String.isBlank(customer) || customer.trim().length() < 2 || customer.length() > 100) {
            throw new AuraHandledException('Provide a customer name of 2 to 100 characters.');
        }
        if (String.isBlank(email) || email.length() > 120 || !Pattern.matches('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', email.trim())) {
            throw new AuraHandledException('Provide a valid email address.');
        }
        if (String.isBlank(address) || address.trim().length() < 8 || address.length() > 255) {
            throw new AuraHandledException('Provide a full service address.');
        }
        List<Service_Slot__c> found = [SELECT Id, Booked__c, Technician__c, Skills__c, Start__c, End__c
            FROM Service_Slot__c WHERE Id = :slotId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if (found.isEmpty()) throw new AuraHandledException('Slot not found. Refresh availability.');
        Service_Slot__c slot = found[0];
        if (slot.Booked__c || slot.Start__c.date() <= Date.today() || slot.Start__c.date() > Date.today().addDays(5)
            || String.isBlank(slot.Skills__c) || !slot.Skills__c.split(';').contains(service)) {
            throw new AuraHandledException('This time is no longer available for the selected service.');
        }
        Service_Booking__c booking = new Service_Booking__c(Slot__c = slot.Id,
            Slot_Key__c = String.valueOf(slot.Id), Customer__c = customer.trim(), Email__c = email.trim(),
            Address__c = address.trim(), Service__c = service, Status__c = 'Confirmed', Start__c = slot.Start__c);
        insert as user booking;
        slot.Booked__c = true;
        update as user slot;
        return [SELECT Id, Name, Customer__c, Status__c, Start__c FROM Service_Booking__c WHERE Id = :booking.Id WITH USER_MODE LIMIT 1];
    }
    @AuraEnabled
    public static void cancel(Id bookingId) {
        // Read the slot reference first, then lock slot before booking, consistent with book().
        List<Service_Booking__c> refs = [SELECT Id, Slot__c FROM Service_Booking__c WHERE Id = :bookingId WITH USER_MODE LIMIT 1];
        if (refs.isEmpty()) throw new AuraHandledException('Appointment not found.');
        Id slotId = refs[0].Slot__c;
        Service_Slot__c slot = [SELECT Id, Booked__c FROM Service_Slot__c WHERE Id = :slotId WITH USER_MODE LIMIT 1 FOR UPDATE];
        Service_Booking__c booking = [SELECT Id, Status__c, Slot_Key__c FROM Service_Booking__c WHERE Id = :bookingId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if (booking.Status__c != 'Confirmed') throw new AuraHandledException('Only confirmed appointments can be cancelled.');
        booking.Status__c = 'Cancelled'; booking.Slot_Key__c = null;
        update as user booking;
        slot.Booked__c = false;
        update as user slot;
    }
}
