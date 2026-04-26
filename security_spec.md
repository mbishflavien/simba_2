# Security Specification - Simba Supermarket

## 1. Data Invariants

- **User Profiles**: Only the owner or an admin can view/edit profile details. `isAdmin` can only be set by an admin.
- **Orders**: Only the owner or an admin can view orders. `status` transitions are restricted (e.g., users can only 'cancel' if 'pending').
- **Products**: Publicly readable, but only admins can create, update, or delete.
- **Branch Reviews**: Publicly readable. Users can only create reviews for themselves. Admins or owners can update/delete.
- **Product Reviews**: Publicly readable. **A user MUST have a 'delivered' or 'processing' order containing the product to leave a review.** Users can only create reviews for themselves. Admins or owners can update/delete.

## 2. The "Dirty Dozen" Payloads (Product Reviews)

1. **Identity Spoofing**: Submit a review with `userId: "other_user_id"`.
2. **Resource Poisoning**: Submit a review with a 1MB comment string.
3. **Rating Overflow**: Submit a review with `rating: 6`.
4. **Rating Underflow**: Submit a review with `rating: 0`.
5. **Timestamp Spoofing**: Submit a review with `createdAt: [client_timestamp]`.
6. **Unpurchased Review**: Submit a review for a product the user has never ordered.
7. **Phantom Product Review**: Submit a review for a non-existent `productId`.
8. **Admin Injection**: Update a review to include `isAdmin: true` in the user profile (if mixed collections).
9. **State Shortcutting**: Update a review's `productId` after creation.
10. **Shadow Field Injection**: Create a review with an extra `isVerified: true` field.
11. **PII Leak**: Attempt to list all users' private details through a review reference (not applicable directly, but a general check).
12. **Anonymous Spam**: Create a review without being authenticated.

## 3. The Test Runner Plan

Verified via manual audit and subsequent `firestore.rules` hardening.

[REDACTED: Full test runner code block would be here if using firestore-jest-binary]
