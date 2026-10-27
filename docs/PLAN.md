# Rajyash v1 plan — food wastage pickup

## Decisions
- One APK for drivers and admin. Web admin on a subdomain.
- Separate MySQL database for this app.
- Admin accepts and assigns. Drivers confirm the assigned trip.
- Requester gets the driver's name and phone number once assigned.
- NGO pays drivers monthly. Open: confirm before building payouts.

## Users
| User | Where | Does |
|---|---|---|
| Requester (restaurant, shop) | Web form or WhatsApp link | Sends request, sees status, gets driver contact |
| Admin (Rajyash team) | Web panel (`admin.` subdomain) | Reviews requests, assigns drivers, runs salary |
| Driver | APK, phone OTP login | Confirms trip, runs steps, uploads photos, sees earnings |

## Trip lifecycle
1. `requested`: requester submits food type, approx kg, address, ready time.
2. `under_review`: admin checks the request.
3. `assigned`: admin picks a driver. Driver and requester are notified.
4. `accepted`: driver confirms. Or `declined`, and admin reassigns.
5. `ride_started`: GPS trail starts.
6. `picked_up`: driver confirms, then uploads a photo, then enters kg.
7. `delivered`: driver uploads a drop photo and confirms the receiver. GPS trail stops.
8. `closed`: km calculated, trip fare set, food totals updated.

Rules:
- A status cannot be skipped.
- Trip cannot close without both photos and kg.
- If GPS stops for more than 10 minutes during a trip, alert admin.

## Calculations
- **Km:** sum of GPS segments after removing jumps above 80 km/h. Manual override needs a reason.
- **Trip fare:** max(minimum fare, km × rate). Example: ₹12/km, minimum ₹40.
- **Food by person:** kg per donor, per drop point, and per driver.
- **Monthly salary:** sum of trip fares + approved bonus − approved deduction. Admin approves, then marks paid with UPI reference.

## Data (first draft)
See `db/schema.sql`.

## Build order (about 4 weeks)
1. Database, roles, login, request form, admin queue and assign.
2. Driver app: login, trip steps, photos, GPS trail.
3. Km, food reports, salary sheet, driver statement.
4. Test with 3 drivers and 3 restaurants. Fix. Handover.

## Open questions
- Who pays drivers: NGO monthly (assumed) or donor directly?
- "Food by person": donor, drop point, or driver? (Assumed all three.)
- Minimum fare and per-km rate.
- Photo retention period.
