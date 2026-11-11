public with sharing class QuoteStudioController {
    private static final Map<String, Decimal> PRICES = new Map<String, Decimal>{
        'heat-pump' => 4200, 'thermostat' => 240, 'install' => 800, 'care' => 360
    };
    @AuraEnabled
    public static Sales_Quote__c submit(String linesJson, Decimal discount, String reason) {
        if (discount == null || discount < 0 || discount > 30) {
            throw new AuraHandledException('Discount must be between 0 and 30%.');
        }
        if (String.isBlank(linesJson) || linesJson.length() > 10000) {
            throw new AuraHandledException('Provide quote line items.');
        }
        List<Object> lines;
        try { lines = (List<Object>) JSON.deserializeUntyped(linesJson); }
        catch (Exception e) { throw new AuraHandledException('Invalid quote line items.'); }
        if (lines == null || lines.isEmpty() || lines.size() > 20) {
            throw new AuraHandledException('Provide 1 to 20 quote lines.');
        }
        Decimal subtotal = 0;
        for (Object item : lines) {
            Map<String, Object> line;
            Decimal quantity;
            String product;
            try {
                line = (Map<String, Object>) item;
                product = (String) line.get('productId');
                quantity = Decimal.valueOf(String.valueOf(line.get('quantity')));
            } catch (Exception e) { throw new AuraHandledException('Invalid product or quantity.'); }
            if (!PRICES.containsKey(product) || quantity < 1 || quantity > 100 || quantity != quantity.setScale(0)) {
                throw new AuraHandledException('Choose a catalog product and whole quantity from 1 to 100.');
            }
            subtotal += PRICES.get(product) * quantity;
        }
        if (discount > 10 && (String.isBlank(reason) || reason.trim().length() < 10)) {
            throw new AuraHandledException('Explain the discount in at least 10 characters.');
        }
        if (reason != null && reason.length() > 500) throw new AuraHandledException('Keep the reason under 500 characters.');
        Decimal saving = (subtotal * discount / 100).setScale(2, RoundingMode.HALF_UP);
        Sales_Quote__c quote = new Sales_Quote__c(
            Lines_JSON__c = linesJson, Discount__c = discount, Reason__c = reason,
            Subtotal__c = subtotal, Total__c = subtotal - saving,
            Status__c = discount <= 10 ? 'Approved' : 'Pending approval'
        );
        insert as user quote;
        return [SELECT Id, Name, Status__c, Subtotal__c, Total__c, Discount__c, Reason__c, Decision_Note__c
                FROM Sales_Quote__c WHERE Id = :quote.Id WITH USER_MODE LIMIT 1];
    }
    @AuraEnabled
    public static Sales_Quote__c review(Id quoteId, String decision, String note) {
        if (!FeatureManagement.checkPermission('Review_Sales_Quotes')) {
            throw new AuraHandledException('A sales manager permission is required.');
        }
        if (decision != 'Approved' && decision != 'Rejected') throw new AuraHandledException('Choose approve or reject.');
        if (String.isBlank(note) || note.trim().length() < 5 || note.length() > 500) {
            throw new AuraHandledException('Provide a decision note of 5 to 500 characters.');
        }
        List<Sales_Quote__c> found = [SELECT Id, Name, Status__c, Subtotal__c, Total__c, Discount__c, Reason__c
            FROM Sales_Quote__c WHERE Id = :quoteId WITH USER_MODE LIMIT 1 FOR UPDATE];
        if (found.isEmpty() || found[0].Status__c != 'Pending approval') {
            throw new AuraHandledException('Only a pending quote can be reviewed.');
        }
        Sales_Quote__c quote = found[0];
        quote.Status__c = decision;
        quote.Decision_Note__c = note.trim();
        update as user quote;
        return quote;
    }
}
