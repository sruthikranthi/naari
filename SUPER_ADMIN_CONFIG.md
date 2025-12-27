# Super Admin Configuration

## Super Admin Credentials

- **Email**: `admin@naari.com`
- **Password**: `Kaarthu$1159`
- **UID**: `ebixEzJ8UuYjIYTXrkOObW1obSw1`

## Configuration Locations

The super admin UID is configured in the following files:

1. **Firestore Security Rules** (`firestore.rules` - line 30):
   ```javascript
   function isSuperAdmin() {
     return request.auth.uid == 'ebixEzJ8UuYjIYTXrkOObW1obSw1';
   }
   ```

2. **Admin Panel** (`src/app/dashboard/admin/page.tsx` - line 83):
   ```typescript
   const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || 'ebixEzJ8UuYjIYTXrkOObW1obSw1';
   ```

3. **Main Navigation** (`src/components/main-nav.tsx` - line 30):
   ```typescript
   const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || 'ebixEzJ8UuYjIYTXrkOObW1obSw1';
   ```

## Environment Variable (Optional)

You can override the super admin UID by setting:
```bash
NEXT_PUBLIC_SUPER_ADMIN_ID=ebixEzJ8UuYjIYTXrkOObW1obSw1
```

## Verification Steps

1. **Verify Account Exists in Firebase Auth**:
   - Go to Firebase Console → Authentication → Users
   - Search for `admin@naari.com`
   - Verify the UID matches: `ebixEzJ8UuYjIYTXrkOObW1obSw1`

2. **Verify Password**:
   - Try logging in with `admin@naari.com` / `Kaarthu$1159`
   - If login fails, reset the password in Firebase Console

3. **Verify Firestore Rules**:
   - The rules are deployed from `firestore.rules` (root directory)
   - Ensure the `isSuperAdmin()` function uses the correct UID

4. **Verify User Document**:
   - Check Firestore → `users/ebixEzJ8UuYjIYTXrkOObW1obSw1`
   - Ensure the user document exists with correct email

## Super Admin Permissions

The super admin has access to:
- ✅ All Firestore collections (bypasses security rules)
- ✅ Admin Panel (`/dashboard/admin`)
- ✅ All CRUD operations on fantasy games, ad campaigns, sponsors
- ✅ User management
- ✅ All administrative functions

## Troubleshooting

If the super admin cannot access the admin panel:
1. Verify the UID matches exactly (case-sensitive)
2. Check that the user is logged in with the correct account
3. Verify Firestore rules are deployed
4. Check browser console for authentication errors

