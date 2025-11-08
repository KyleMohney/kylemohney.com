# Quick Testing Guide - Match Notifications

## Setup: Two Browser Windows

**Window 1 (Pro):** http://localhost:3000/rooted-vitality/dashboard/pro/  
**Window 2 (Client):** http://localhost:3000/rooted-vitality/find-practitioners.html

---

## Test Flow

### Step 1: Pro Logs In (Window 1)
1. Open pro dashboard
2. Click on "New Clients" tab (default)
3. Should see "No New Clients Yet" or existing matches
4. **Keep this window open and visible**

### Step 2: Client Creates Project (Window 2)
1. Open client app (find-practitioners)
2. Create a new wellness project with:
   - Service category: Select any category
   - Description: "Test project for match notification"
   - Project location: Zipcode where pros are available
3. Click "Find Practitioners"
4. Should see list of available practitioners

### Step 3: Client Sends Connection (Window 2)
1. Click "Connect" on any practitioner card
2. Should see success message: "Connection established! Message them in 'My Matches'"

### Step 4: Verify Pro Notification (Window 1)
**Expected Behavior:**
- Toast notification slides in from right edge
- Shows: "🎉 New Client Match!"
- Displays: Client name, project category, distance, match quality
- Toast is sticky (stays on screen)
- Click X to dismiss, or comes back when new match arrives

**Example Toast:**
```
┌─────────────────────────────────────────┐
│ 🎉 New Client Match!                    │
│ Sarah J. from Wellness (3.2 mi)        │
│ Excellent Match (85/100)                │ ×
└─────────────────────────────────────────┘
```

### Step 5: New Client Card Appears (Window 1)
1. Without refreshing, new client card should appear
2. Card shows:
   - Client initials avatar (green circle)
   - Client name and service
   - "Matched Today" or "Matched 1 second ago"
   - Green "Excellent Match (85/100)" badge
   - Blue "📍 3.2 mi" distance badge
   - Auto-message from client
3. Action buttons: Accept, Message, Decline w/ Msg, Decline, Block

### Step 6: Pro Actions (Window 1)

#### Accept Client
1. Click "Accept" button
2. Toast shows: "Client Accepted - You accepted [Name]..."
3. Card disappears from New Clients list
4. Success feedback

#### Message Client
1. Click "Message" button
2. Opens my-matches.html with conversation thread
3. Can see client's initial message
4. Can reply

#### Decline with Message
1. Click "Decline w/ Msg" button
2. Modal appears: "Send Decline Message"
3. Type reason (e.g., "Not accepting new clients this week")
4. Click "Send & Decline"
5. Card disappears, client receives decline message

#### Decline (Silent)
1. Click "Decline" button
2. Confirm: "Are you sure you want to decline?"
3. Card disappears silently
4. Toast: "You declined [Name]"

#### Block Client
1. Click "Block" button
2. Confirm: "Block this customer?"
3. Client added to blocklist
4. Client won't match with pro again

---

## What to Look For

### ✅ Should Work
- [x] Toast appears instantly (no page reload)
- [x] Toast content is accurate
- [x] Multiple matches show multiple toasts
- [x] Toast dismisses when clicked
- [x] Client card appears in list without refresh
- [x] Match quality badge shows correct color
- [x] Distance displays correctly
- [x] Accept/Decline/Block actions work
- [x] Real-time updates without page reload

### ❌ Troubleshooting

**Toast doesn't appear:**
- Check browser console for errors
- Verify Supabase subscription connected
- Verify `practitioner_id` matches correctly

**Card doesn't appear:**
- Refresh page to check if card appears
- Verify match was created in database
- Check project has valid location data

**Distance shows "Unknown":**
- Verify client project has valid zipcode
- Verify practitioner has valid base zipcode
- Check zipcodes are in us_zipcodes table

**Match score shows 0:**
- Verify match_practitioners() RPC is working
- Check project meets matching criteria
- Verify pro services match project category

---

## Browser Console Checks

Open browser DevTools (F12) and check Console tab:

**Should see:**
```
[Pro Clients] Loading data for practitioner: {UUID}
[Pro Clients] Loaded matches: 2
[Real-time] New match received: {payload}
[Real-time] Match score: 85 Distance: 3.2
```

**Should NOT see:**
```
[Pro Clients] Supabase or auth not ready (ERROR)
[Pro Clients] Error loading matches (ERROR)
Cannot read properties of undefined (ERROR)
```

---

## Test Scenarios

### Scenario 1: Single Match
- [ ] Create 1 project
- [ ] Send 1 connection
- [ ] Verify 1 toast + 1 card

### Scenario 2: Multiple Matches
- [ ] Create 1 project
- [ ] Connect to 3 different practitioners
- [ ] Should see 3 separate toasts (or batched)
- [ ] Should see 3 cards in New Clients

### Scenario 3: Accept Then New Match
- [ ] Accept a client (card disappears)
- [ ] New match arrives (toast + card appears)
- [ ] Both work smoothly

### Scenario 4: Decline with Message
- [ ] Click "Decline w/ Msg"
- [ ] Type a message
- [ ] Send
- [ ] Verify client receives message in their system
- [ ] Card disappears from pro list

### Scenario 5: Block Client
- [ ] Click "Block"
- [ ] Try connecting again from client
- [ ] Client should NOT match with this pro again

---

## Performance Checks

- **Toast appears in:** < 1 second
- **Card appears in:** < 2 seconds
- **Accept completes in:** < 1 second
- **No lag with 10+ matches visible**

---

## Mobile Testing

Open pro dashboard on mobile phone:
- [ ] Toast appears at top (not clipped)
- [ ] Toast is readable (font size ok)
- [ ] Cards stack vertically
- [ ] Buttons are tap-able (not too small)
- [ ] Dismiss button works on mobile
- [ ] Real-time updates work on 4G/5G

---

**Ready to Test?** 🚀

Start with Window 1 (Pro) open, then trigger matches from Window 2 (Client)!
