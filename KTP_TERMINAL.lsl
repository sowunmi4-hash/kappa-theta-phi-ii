// ─────────────────────────────────────────────────────────────
//  KΘΦ II STORE TERMINAL — LSL Script
//  Drop this into your vendor/terminal object in Second Life
//  The object must have all 8 plushies in its inventory
// ─────────────────────────────────────────────────────────────

string  WEBHOOK_URL    = "https://kappa-theta-phi-ii.vercel.app/api/store/payment";
string  WEBHOOK_SECRET = "KTP-TERMINAL-2026";
integer PRICE          = 200; // L$

// State
string  pendingOrderNumber = "";
key     pendingPayer       = NULL_KEY;
key     httpRequest        = NULL_KEY;

// Listen handle
integer listenHandle = 0;

default {
    state_entry() {
        llSay(0, "KΘΦ II Store Terminal Online. Touch to order.");
    }

    touch_start(integer n) {
        key toucher = llDetectedKey(0);
        // Stop any existing listen
        if (listenHandle) llListenRemove(listenHandle);
        // Listen for order number in nearby chat
        listenHandle = llListen(0, "", toucher, "");
        llRegionSayTo(toucher, 0,
            "Welcome to the KΘΦ II Store!\n" +
            "Enter your Order Number (e.g. KTP-001):\n" +
            "(Place your order at kappa-theta-phi-ii.vercel.app/store)");
    }

    listen(integer channel, string name, key id, string message) {
        // Check if it looks like a KTP order number
        if (llSubStringIndex(message, "KTP-") == 0 && llStringLength(message) >= 7) {
            pendingOrderNumber = llToUpper(llStringTrim(message, STRING_TRIM));
            pendingPayer       = id;
            llListenRemove(listenHandle);
            listenHandle = 0;
            // Ask them to pay
            llRegionSayTo(id, 0,
                "Order: " + pendingOrderNumber + "\n" +
                "Please pay L$" + (string)PRICE + " to this terminal to complete your order.");
            llRequestPermissions(id, PERMISSION_DEBIT);
        } else {
            llRegionSayTo(id, 0, "Invalid order number. Enter a number like KTP-001.");
        }
    }

    money(key payer, integer amount) {
        if (payer != pendingPayer || pendingOrderNumber == "") {
            // Unknown payer or no pending order — refund
            llGiveMoney(payer, amount);
            llRegionSayTo(payer, 0, "No active order found. Touch the terminal first and enter your order number.");
            return;
        }
        // Send payment to website
        string body = llList2Json(JSON_OBJECT, [
            "order_number", pendingOrderNumber,
            "amount_ls",    amount,
            "sl_username",  llKey2Name(payer),
            "secret",       WEBHOOK_SECRET
        ]);
        httpRequest = llHTTPRequest(WEBHOOK_URL,
            [HTTP_METHOD, "POST",
             HTTP_MIMETYPE, "application/json",
             HTTP_BODY_MAXLENGTH, 16384],
            body);
        llRegionSayTo(payer, 0, "Payment received. Verifying order...");
        // Clear pending
        pendingOrderNumber = "";
        pendingPayer       = NULL_KEY;
    }

    http_response(key request_id, integer status, list metadata, string body) {
        if (request_id != httpRequest) return;
        if (status == 200) {
            // Parse response
            string deliver  = llJsonGetValue(body, ["deliver"]);
            string itemName = llJsonGetValue(body, ["item_name"]);
            string buyer    = llJsonGetValue(body, ["sl_username"]);
            string orderNum = llJsonGetValue(body, ["order_number"]);
            if (deliver == "true") {
                // Find the avatar key by name and deliver
                key buyerKey = llRequestAgentData((key)buyer, DATA_ONLINE);
                // Give the item to the buyer - llGiveInventory by avatar key
                // Note: avatar needs to accept if not set to auto-accept
                llGiveInventory(llGetOwnerKey(buyer), itemName);
                llSay(0, "✓ " + orderNum + " — " + itemName + " delivered to " + buyer + "!");
            } else {
                string err = llJsonGetValue(body, ["error"]);
                llSay(0, "Order issue: " + err + ". Please contact staff.");
            }
        } else {
            llSay(0, "Server error. Please contact KΘΦ II staff with your order number.");
        }
    }
}
