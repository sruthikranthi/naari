# Firestore Indexes Documentation

This document explains the Firestore indexes used in the Naarimani application.

## Index Organization

The indexes are organized into two categories:
1. **Single Field Indexes** - Indexes on a single field
2. **Composite Indexes** - Indexes on multiple fields

---

## Single Field Indexes

These indexes optimize queries that filter or order by a single field.

### Posts Collection

1. **timestamp (DESCENDING)**
   - Used for: Ordering posts by timestamp (newest first)
   - Query example: `orderBy('timestamp', 'desc')`

### Communities Collection

2. **createdAt (DESCENDING)**
   - Used for: Ordering communities by creation date
   - Query example: `orderBy('createdAt', 'desc')`

### Kitty Groups Collection

3. **createdAt (DESCENDING)**
   - Used for: Ordering kitty groups by creation date
   - Query example: `orderBy('createdAt', 'desc')`

4. **memberIds (CONTAINS)**
   - Used for: Finding groups where a user is a member
   - Query example: `where('memberIds', 'array-contains', userId)`

### Contests Collection

5. **status (ASCENDING)**
   - Used for: Filtering contests by status
   - Query example: `where('status', '==', 'Live')`

6. **createdAt (DESCENDING)**
   - Used for: Ordering contests by creation date
   - Query example: `orderBy('createdAt', 'desc')`

### Chats Collection

7. **lastMessageTime (DESCENDING)**
   - Used for: Ordering chats by last message time
   - Query example: `orderBy('lastMessageTime', 'desc')`

8. **participants (CONTAINS)**
   - Used for: Finding chats where a user is a participant
   - Query example: `where('participants', 'array-contains', userId)`

### Messages Collection (Collection Group)

9. **chatId (ASCENDING)**
   - Used for: Filtering messages by chat ID
   - Query example: `where('chatId', '==', chatId)`

10. **timestamp (ASCENDING)**
    - Used for: Ordering messages by timestamp
    - Query example: `orderBy('timestamp', 'asc')`

### Marketplace Listings Collection

11. **category (ASCENDING)**
    - Used for: Filtering products by category
    - Query example: `where('category', '==', 'Food')`

12. **price (ASCENDING)**
    - Used for: Ordering products by price
    - Query example: `orderBy('price', 'asc')`

13. **sellerId (ASCENDING)**
    - Used for: Finding products by seller
    - Query example: `where('sellerId', '==', sellerId)`

14. **createdAt (DESCENDING)**
    - Used for: Ordering products by creation date
    - Query example: `orderBy('createdAt', 'desc')`

---

## Composite Indexes (Multiple Fields)

These indexes optimize queries that filter or order by multiple fields simultaneously.

### Posts Collection

1. **author.id + timestamp**
   - Fields: `author.id (ASCENDING)`, `timestamp (DESCENDING)`
   - Used for: Getting posts by a specific author, ordered by timestamp
   - Query example: `where('author.id', '==', userId).orderBy('timestamp', 'desc')`

### Marketplace Listings Collection

2. **category + price**
   - Fields: `category (ASCENDING)`, `price (ASCENDING)`
   - Used for: Filtering by category and ordering by price
   - Query example: `where('category', '==', 'Food').orderBy('price', 'asc')`

3. **sellerId + createdAt**
   - Fields: `sellerId (ASCENDING)`, `createdAt (DESCENDING)`
   - Used for: Getting products by seller, ordered by creation date
   - Query example: `where('sellerId', '==', sellerId).orderBy('createdAt', 'desc')`

### Kitty Groups Collection

4. **memberIds + createdAt**
   - Fields: `memberIds (CONTAINS)`, `createdAt (DESCENDING)`
   - Used for: Finding groups where user is a member, ordered by creation date
   - Query example: `where('memberIds', 'array-contains', userId).orderBy('createdAt', 'desc')`

### Contests Collection

5. **status + createdAt**
   - Fields: `status (ASCENDING)`, `createdAt (DESCENDING)`
   - Used for: Filtering contests by status and ordering by creation date
   - Query example: `where('status', '==', 'Live').orderBy('createdAt', 'desc')`

### Chats Collection

6. **participants + lastMessageTime**
   - Fields: `participants (CONTAINS)`, `lastMessageTime (DESCENDING)`
   - Used for: Finding user's chats, ordered by last message time
   - Query example: `where('participants', 'array-contains', userId).orderBy('lastMessageTime', 'desc')`

### Messages Collection (Collection Group)

7. **chatId + timestamp**
   - Fields: `chatId (ASCENDING)`, `timestamp (ASCENDING)`
   - Used for: Getting messages in a chat, ordered by timestamp
   - Query example: `where('chatId', '==', chatId).orderBy('timestamp', 'asc')`

---

## Deployment

To deploy these indexes to Firebase:

```bash
firebase deploy --only firestore:indexes
```

Or manually create them in Firebase Console:
1. Go to Firebase Console > Firestore Database > Indexes
2. Click "Add Index"
3. Configure each index as shown above

---

## Notes

- **Collection Group Indexes**: The `messages` collection uses `COLLECTION_GROUP` scope because messages are stored in subcollections under chats (`chats/{chatId}/messages`). This allows querying across all message subcollections.

- **Array Contains**: Indexes with `arrayConfig: "CONTAINS"` are used for array membership queries (e.g., checking if a user ID is in a members array).

- **Order Matters**: In composite indexes, the order of fields matters. Always filter by the first field before ordering by the second field.

