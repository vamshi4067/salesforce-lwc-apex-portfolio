@IsTest
private class QuoteStudioControllerTest {
    private static String lines() { return '[{"productId":"heat-pump","quantity":2},{"productId":"install","quantity":1}]'; }
    @IsTest static void calculatesAndAutoApproves() {
        Sales_Quote__c quote = QuoteStudioController.submit(lines(), 10, '');
        Assert.areEqual(9200, quote.Subtotal__c);
        Assert.areEqual(8280, quote.Total__c);
        Assert.areEqual('Approved', quote.Status__c);
    }
    @IsTest static void routesBoundaryToReview() {
        Sales_Quote__c quote = QuoteStudioController.submit(lines(), 10.01, 'Two-site equipment rollout.');
        Assert.areEqual('Pending approval', quote.Status__c);
        Assert.areEqual(8279.08, quote.Total__c);
    }
    @IsTest static void rejectsInvalidInput() {
        for (Decimal discount : new List<Decimal>{-1, 31}) {
            try { QuoteStudioController.submit(lines(), discount, 'Volume order'); Assert.fail('Invalid discount accepted'); }
            catch (AuraHandledException expected) { }
        }
        for (String input : new List<String>{'[]', 'bad', '[{"productId":"unknown","quantity":1}]', '[{"productId":"install","quantity":1.5}]'}) {
            try { QuoteStudioController.submit(input, 0, ''); Assert.fail('Invalid line accepted'); }
            catch (AuraHandledException expected) { }
        }
        try { QuoteStudioController.submit(lines(), 15, ''); Assert.fail('Missing reason accepted'); }
        catch (AuraHandledException expected) { }
    }
    @IsTest static void managerDecisionLocksTransition() {
        PermissionSet manager = [SELECT Id FROM PermissionSet WHERE Name = 'Service_Studio_Manager' LIMIT 1];
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert new PermissionSetAssignment(AssigneeId = UserInfo.getUserId(), PermissionSetId = manager.Id);
        }
        Sales_Quote__c quote = QuoteStudioController.submit(lines(), 15, 'Three sites in one rollout.');
        Test.startTest();
        Sales_Quote__c approved = QuoteStudioController.review(quote.Id, 'Approved', 'Margin reviewed.');
        Assert.areEqual('Approved', approved.Status__c);
        try { QuoteStudioController.review(quote.Id, 'Rejected', 'Repeat decision.'); Assert.fail('Repeat decision accepted'); }
        catch (AuraHandledException expected) { }
        Test.stopTest();
    }
    @IsTest static void rejectsReviewerWithoutPermission() {
        User seller = new User(Alias='seller', Email='seller@example.com',
            EmailEncodingKey='UTF-8', LastName='Demo Seller', LanguageLocaleKey='en_US',
            LocaleSidKey='en_US', TimeZoneSidKey='America/New_York', ProfileId=UserInfo.getProfileId(),
            Username='studio.seller.' + String.valueOf(Datetime.now().getTime()) + '@example.com');
        insert seller;
        PermissionSet basic = [SELECT Id FROM PermissionSet WHERE Name='Service_Studio_User' LIMIT 1];
        insert new PermissionSetAssignment(AssigneeId=seller.Id, PermissionSetId=basic.Id);
        System.runAs(seller) {
            Assert.isFalse(FeatureManagement.checkPermission('Review_Sales_Quotes'));
            Sales_Quote__c quote = QuoteStudioController.submit(lines(),15,'Two-site equipment rollout.');
            try { QuoteStudioController.review(quote.Id,'Approved','Margin reviewed.'); Assert.fail('Unauthorized review accepted'); }
            catch (AuraHandledException expected) { }
        }
    }
}
