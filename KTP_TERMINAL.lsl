// ─────────────────────────────────────────────────────────────
//  KΘΦ II STORE TERMINAL — LSL Script v2
//  Multi-user queue system with blue text dialog
// ─────────────────────────────────────────────────────────────

string  WEBHOOK_URL    = "https://kappa-theta-phi-ii.vercel.app/api/store/payment";
string  WEBHOOK_SECRET = "KTP-TERMINAL-2026";
integer PRICE          = 200; // L$

// Queue lists — each index matches across all three
list queuePayers  = []; // avatar keys waiting to pay
list queueOrders  = []; // their order numbers
list queueHandles = []; // their listen handles

// HTTP tracking — maps request key back to payer key
list httpKeys   = []; // request keys
list httpPayers = []; // matching payer keys

// Generate a unique private channel from avatar UUID
integer avatarChannel(key id) {
    return (integer)("0x" + llGetSubString((string)id, 0, 6)) | 0x80000000;
}

default {
    state_entry() {
        llSay(0, "KΘΦ II Store Terminal Online. Touch to order.");
    }

    touch_start(integer n) {
        integer i;
        for (i = 0; i < llDetectedNumber(); i++) {
            key toucher = llDetectedKey(i);
            integer channel = avatarChannel(toucher);

            // Remove any existing listen for this avatar
            integer idx = llListFindList(queuePayers, [toucher]);
            if (idx != -1) {
                llListenRemove(llList2Integer(queueHandles, idx));
                queuePayers  = llDeleteSubList(queuePayers,  idx, idx);
                queueOrders  = llDeleteSubList(queueOrders,  idx, idx);
                queueHandles = llDeleteSubList(queueHandles, idx, idx);
            }

            // Listen on their private channel
            integer handle = llListen(channel, "", toucher, "");

            // Add to queue as "waiting for order number"
            queuePayers  += [toucher];
            queueOrders  += [""];
            queueHandles += [handle];

            // Show blue text box popup
            llTextBox(toucher, 
                "KΘΦ II STORE\n\n" +
                "Enter your Order Number\n" +
                "(e.g. KTP-001)\n\n" +
                "Don't have one? Visit:\n" +
                "kappa-theta-phi-ii.vercel.app/store",
                channel);
        }
    }

    listen(integer channel, string name, key id, string message) {
        message = llToUpper(llStringTrim(message, STRING_TRIM));

        integer idx = llListFindList(queuePayers, [id]);
        if (idx == -1) return;

        if (llSubStringIndex(message, "KTP-") == 0 && llStringLength(message) >= 7) {
            // Valid order number — save it and remove listen
            llListenRemove(llList2Integer(queueHandles, idx));
            queueOrders  = llListReplaceList(queueOrders,  [message], idx, idx);
            queueHandles = llListReplaceList(queueHandles, [-1],       idx, idx);

            llRegionSayTo(id, 0,
                "Order " + message + " confirmed.\n" +
                "Please pay L$" + (string)PRICE + " to this terminal.");
        } else {
            // Invalid — show the box again
            integer handle = llListen(channel, "", id, "");
            queueHandles = llListReplaceList(queueHandles, [handle], idx, idx);
            llTextBox(id,
                "Invalid order number.\n\n" +
                "Enter your Order Number\n" +
                "(e.g. KTP-001)\n\n" +
                "Visit kappa-theta-phi-ii.vercel.app/store\n" +
                "to place your order first.",
                channel);
        }
    }

    money(key payer, integer amount) {
        integer idx = llListFindList(queuePayers, [payer]);

        if (idx == -1 || llList2String(queueOrders, idx) == "") {
            // No pending order — refund
            llGiveMoney(payer, amount);
            llRegionSayTo(payer, 0,
                "No active order found. Touch the terminal and enter your order number first.");
            return;
        }

        string orderNum = llList2String(queueOrders, idx);

        // Remove from queue
        queuePayers  = llDeleteSubList(queuePayers,  idx, idx);
        queueOrders  = llDeleteSubList(queueOrders,  idx, idx);
        queueHandles = llDeleteSubList(queueHandles, idx, idx);

        // Send to webhook
        string body = llList2Json(JSON_OBJECT, [
            "order_number", orderNum,
            "amount_ls",    amount,
            "sl_username",  llKey2Name(payer),
            "secret",       WEBHOOK_SECRET
        ]);

        key req = llHTTPRequest(WEBHOOK_URL,
            [HTTP_METHOD, "POST",
             HTTP_MIMETYPE, "application/json",
             HTTP_BODY_MAXLENGTH, 16384],
            body);

        // Track this HTTP request → payer
        httpKeys   += [req];
        httpPayers += [payer];

        llRegionSayTo(payer, 0, "Payment received. Delivering your order...");
    }

    http_response(key request_id, integer status, list metadata, string body) {
        integer idx = llListFindList(httpKeys, [request_id]);
        if (idx == -1) return;

        key payer = llList2Key(httpPayers, idx);

        // Clean up HTTP tracking
        httpKeys   = llDeleteSubList(httpKeys,   idx, idx);
        httpPayers = llDeleteSubList(httpPayers, idx, idx);

        if (status == 200) {
            string deliver  = llJsonGetValue(body, ["deliver"]);
            string itemName = llJsonGetValue(body, ["item_name"]);
            string buyer    = llJsonGetValue(body, ["sl_username"]);
            string orderNum = llJsonGetValue(body, ["order_number"]);

            if (deliver == "yes") {
                llGiveInventory(payer, itemName);
                llRegionSayTo(payer, 0,
                    "✓ " + itemName + " delivered! Check your inventory.");
                llSay(0, "✓ " + orderNum + " — " + itemName + " delivered to " + buyer + "!");
            } else {
                string err = llJsonGetValue(body, ["error"]);
                llRegionSayTo(payer, 0,
                    "Order issue: " + err + "\nPlease contact KΘΦ II staff.");
            }
        } else {
            llRegionSayTo(payer, 0,
                "Server error. Please contact KΘΦ II staff with your order number.");
        }
    }
}
